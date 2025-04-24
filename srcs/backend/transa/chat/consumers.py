import json
import logging
import redis.asyncio as redis
from chat.utils import is_blocked, friendship_action
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from datetime import datetime


logger = logging.getLogger(__name__)
redis_client = redis.Redis(host="redis", port=6379, db=0, decode_responses=True)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode()
        token = parse_qs(query_string).get("token", [None])[0]

        if token:
            try:
                validated_token = AccessToken(token)
                user_id = validated_token["user_id"]
                user = await database_sync_to_async(get_user_model().objects.get)(
                    id=user_id,
                )
                self.scope["user"] = user
                await redis_client.set(f"user_online:{user.id}", "1", ex=30)
                logger.info(f"[🔐 JWT AUTH] Connected user: {user.username}")
            except Exception as e:
                logger.warning(f"[❌ JWT ERROR] {e}")
                await self.close()
                return

        try:
            self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
            self.room_group_name = f"chat_{self.room_name}"

            logger.info(f"[🔌 CONNECT] User connecting to room: {self.room_name}")

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            logger.info(f"[✅ CONNECTED] Joined group: {self.room_group_name}")

            history_raw = await redis_client.lrange(
                f"chat_room:{self.room_name}", 0, -1
            )
            history = [json.loads(m) for m in history_raw]

            for i, msg in enumerate(history):
                if i == len(history) - 1:
                    msg["history_end"] = True
                await self.send(text_data=json.dumps(msg))

            logger.info(
                f"[📜 HISTORY] Found {len(history)} messages in {self.room_name}"
            )

        except Exception:
            logger.exception("[❌ ERROR] connect() failed")
            await self.close()

    async def disconnect(self, close_code):
        user = self.scope["user"]
        await redis_client.delete(f"user_online:{user.id}")
        logger.info(f"[👋 DISCONNECT] Leaving room: {self.room_group_name}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        logger.debug(f"[📩 RECEIVE] Raw data: {text_data}")

        try:
            data = json.loads(text_data)
            message = data.get("message", "")
            user = self.scope["user"]
            username = user.username
            if data.get("type") == "ping":
                await redis_client.set(f"user_online:{user.id}", "1", ex=30)
                return

            await redis_client.rpush(
                f"chat_room:{self.room_name}",
                json.dumps(
                    {
                        "username": username,
                        "message": message,
                        "timestamp": datetime.now().strftime("%H:%M:%S"),
                    }
                ),
            )
            await redis_client.ltrim(f"chat_room:{self.room_name}", -50, -1)
            if message.startswith("/invite "):
                target = message.split(" ", 1)[1]
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "username": "SYSTEM",
                        "message": f"{username} invited {target} to a game 🎮",
                    },
                )
                logger.info(f"[🎮 INVITE] {username} invited {target}")
                return

            if message.startswith("/friend"):
                try:
                    _, action, target = message.split(maxsplit=2)
                    if action not in {"add", "accept", "reject", "block", "unblock"}:
                        logger.info("Wrong friend command")
                        raise ValidationError("Wrong command")
                    await friendship_action(user, target, action)
                    await self.send(
                        text_data=json.dumps(
                            {
                                "username": "SYSTEM",
                                "message": f"{action} -> {target} is done",
                            }
                        )
                    )
                except Exception as e:
                    await self.send(
                        text_data=json.dumps(
                            {
                                "username": "SYSTEM",
                                "message": f"{e}",
                            }
                        )
                    )
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "username": username,
                    "message": message,
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                },
            )

        except Exception as e:
            logger.error(f"[❌ ERROR] receive() failed: {e}")

    async def chat_message(self, event):
        sender = event["username"]
        message = event["message"]
        user = self.scope["user"]

        if sender != "SYSTEM":
            if await is_blocked(user, sender):
                logger.info(f"[🙈 BLOCKED MESSAGE] {sender} -> {user.username}")
                return

        logger.debug(f"[📡 BROADCAST] {sender}: {message}")
        await self.send(
            text_data=json.dumps(
                {
                    "username": sender,
                    "message": message,
                    "timestamp": event.get("timestamp"),
                }
            )
        )
