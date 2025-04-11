import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, UserBlock
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from datetime import datetime


logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode()
        token = parse_qs(query_string).get("token", [None])[0]

        if token:
            try:
                validated_token = AccessToken(token)
                user_id = validated_token["user_id"]
                user = await database_sync_to_async(get_user_model().objects.get)(id=user_id)
                self.scope["user"] = user
                logger.info(f"[🔐 JWT AUTH] Connected user: {user.username}")
            except Exception as e:
                logger.warning(f"[❌ JWT ERROR] {e}")
                await self.close()
                return
        else:
            self.scope["user"] = AnonymousUser()
            logger.info(f"[👤 ANONYMOUS] No token provided.")

        try:
            self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
            if self.room_name.startswith("dm_"):
            # Vérifie si l'utilisateur est bien concerné
                participants = self.room_name.replace("dm_", "").split("_")
                username = self.scope["user"].username

                if username not in participants:
                    logger.warning(f"[🚫 FORBIDDEN DM ACCESS] {username} tried to access {self.room_name}")
                    await self.close()
                    return

            self.room_group_name = f"chat_{self.room_name}"

            logger.info(f"[🔌 CONNECT] User connecting to room: {self.room_name}")

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            logger.info(f"[✅ CONNECTED] Joined group: {self.room_group_name}")

            # ⛑ Prépare les messages en dicts (plus aucun ORM dans le async)
            def fetch_history(room_name):
                messages = ChatMessage.objects.filter(room=room_name).order_by("-timestamp")[:50]
                return [
                    {
                        "username": m.user.username,
                        "message": m.content,
                        "timestamp": m.timestamp.strftime("%H:%M:%S")
                    }
                    for m in messages
                ]

            history = await database_sync_to_async(fetch_history)(self.room_name)
            logger.info(f"[📜 HISTORY] Found {len(history)} messages in {self.room_name}")

            for i, msg in enumerate(reversed(history)):
                if i == len(history) - 1:
                    msg["history_end"] = True  # ✅ tag pour la fin
                await self.send(text_data=json.dumps(msg))


        except Exception:
            logger.exception("[❌ ERROR] connect() failed")
            await self.close()


    async def disconnect(self, close_code):
        logger.info(f"[👋 DISCONNECT] Leaving room: {self.room_group_name}")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        logger.debug(f"[📩 RECEIVE] Raw data: {text_data}")
        try:
            data = json.loads(text_data)
            message = data.get("message", "")
            user = self.scope["user"]
            username = user.username if not user.is_anonymous else "Anonymous"

            if user.is_anonymous and message.startswith("/"):
                await self.send(text_data=json.dumps({
                    "username": "SYSTEM",
                    "message": "⚠️ You must be logged in to use commands."
                }))
                logger.warning(f"[⚠️ BLOCKED] Anonymous tried command: {message}")
                return

            if message.startswith("/invite "):
                target = message.split(" ", 1)[1]
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "username": "SYSTEM",
                        "message": f"{username} invited {target} to a game 🎮"
                    }
                )
                logger.info(f"[🎮 INVITE] {username} invited {target}")
                return

            if message.startswith("/block "):
                target_username = message.split(" ", 1)[1]
                User = get_user_model()
                
                if target_username == user.username:
                    await self.send(text_data=json.dumps({
                        "username": "SYSTEM",
                        "message": "⚠️ You can't block yourself!"
                    }))
                    logger.warning(f"[🙃 SELF-BLOCK] {user.username} tried to block themselves")
                    return

                try:
                    target_user = await database_sync_to_async(User.objects.get)(username=target_username)
                    await database_sync_to_async(UserBlock.objects.get_or_create)(
                        user=user,
                        blocked_user=target_user
                    )

                    await self.send(text_data=json.dumps({
                        "username": "SYSTEM",
                        "message": f"You have blocked {target_username}"
                    }))
                    logger.info(f"[🛡️ BLOCK] {username} blocked {target_username}")
                except User.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        "username": "SYSTEM",
                        "message": f"User '{target_username}' not found"
                    }))
                    logger.warning(f"[❓ USER NOT FOUND] {target_username}")
                return

            if user.is_anonymous:
                # On utilise un user "Anonymous" générique pour stocker les messages anonymes
                User = get_user_model()
                anon_user, _ = await database_sync_to_async(User.objects.get_or_create)(
                    username="Anonymous"
                )
                await database_sync_to_async(ChatMessage.objects.create)(
                    user=anon_user,
                    room=self.room_name,
                    content=message
                )
                logger.info(f"[💾 SAVED AS ANON] Anonymous: {message}")
            else:
                await database_sync_to_async(ChatMessage.objects.create)(
                    user=user,
                    room=self.room_name,
                    content=message
                )
                logger.info(f"[💾 SAVED] {username}: {message}")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "username": username,
                    "message": message,
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "room": self.room_name
                }
            )


        except Exception as e:
            logger.error(f"[❌ ERROR] receive() failed: {e}")

    async def chat_message(self, event):
        sender = event["username"]
        message = event["message"]
        user = self.scope["user"]

        if not user.is_anonymous:
            User = get_user_model()
            is_blocked = await database_sync_to_async(
                UserBlock.objects.filter(user=user, blocked_user__username=sender).exists
            )()
            if is_blocked and sender != "SYSTEM":
                logger.info(f"[🙈 BLOCKED MESSAGE] {sender} -> {user.username}")
                return

        logger.debug(f"[📡 BROADCAST] {sender}: {message}")
        await self.send(text_data=json.dumps({
            "username": sender,
            "message": message,
            "timestamp": event.get("timestamp"),
            "room": event.get("room")
        }))

