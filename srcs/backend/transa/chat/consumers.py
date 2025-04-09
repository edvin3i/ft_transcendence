import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, UserBlock
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
            self.room_group_name = f"chat_{self.room_name}"

            logger.info(f"[🔌 CONNECT] User connecting to room: {self.room_name}")

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            logger.info(f"[✅ CONNECTED] Joined group: {self.room_group_name}")

            messages = await database_sync_to_async(list)(
                ChatMessage.objects.filter(room=self.room_name).order_by("-timestamp")[:50]
            )

            logger.info(f"[📜 HISTORY] Found {len(messages)} messages in {self.room_name}")

            for msg in reversed(messages):
                await self.send(text_data=json.dumps({
                    "username": msg.user.username,
                    "message": msg.content,
                    "timestamp": msg.timestamp.strftime("%H:%M:%S")
                }))
                logger.debug(f"[📤 SENT] {msg.user.username}: {msg.content}")

        except Exception as e:
            logger.error(f"[❌ ERROR] connect() failed: {e}")
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

            if not user.is_anonymous:
                await database_sync_to_async(ChatMessage.objects.create)(
                    user=user,
                    room=self.room_name,
                    content=message
                )
                logger.info(f"[💾 SAVED] {username}: {message}")
            else:
                logger.debug(f"[👻 ANON] {username}: {message} (not saved)")

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "username": username,
                    "message": message
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
            "message": message
        }))
