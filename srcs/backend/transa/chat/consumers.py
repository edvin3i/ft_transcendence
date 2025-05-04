import json
import redis.asyncio as redis
from chat.utils import is_blocked, friendship_action, block, unblock
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from datetime import datetime

import logging

logger = logging.getLogger(__name__)

redis_client = redis.Redis(host="redis", port=6379, db=0, decode_responses=True)


class ChatConsumer(AsyncWebsocketConsumer):
    async def setup(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

    async def connect(self):
        query_string = self.scope["query_string"].decode()
        token = parse_qs(query_string).get("token", [None])[0]

        if token:
            try:
                validated_token = AccessToken(token)
                user_id = validated_token["user_id"]
                user = await database_sync_to_async(get_user_model().objects.get)(
                    id=user_id
                )
                self.scope["user"] = user
                await redis_client.set(f"user_online:{user.id}", "1", ex=5)
                logger.info(f"[🔐 JWT AUTH] Connected user: {user.username}")
            except Exception as e:
                logger.warning(f"[❌ JWT ERROR] {e}")
                await self.close()
                return

        try:
            await self.setup()

            # DM security check
            if self.room_name.startswith("dm__"):
                parts = self.room_name.split("__")
                if len(parts) != 3:
                    logger.warning("Invalid DM room format")
                    await self.close()
                    return
                _, user1, user2 = parts
                current_user = self.scope["user"].username
                if current_user not in {user1, user2}:
                    logger.warning(
                        f"Unauthorized DM access: {current_user} not in room {self.room_name}"
                    )
                    await self.close()
                    return

            logger.info(f"[🔌 CONNECT] User connecting to room: {self.room_name}")

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(
                f"user_notify_{self.scope['user'].username}", self.channel_name
            )
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
        await self.setup()
        user = self.scope["user"]
        await redis_client.delete(f"user_online:{user.id}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard(
            f"user_notify_{user.username}", self.channel_name
        )
        logger.info(f"[👋 DISCONNECT] Leaving room: {self.room_group_name}")

    async def receive(self, text_data):
        logger.debug(
            f"[📩 RECEIVE] Raw data: {text_data}"
        )  # spam dans le container django
        try:
            data = json.loads(text_data)
            message = data.get("message", "")
            user = self.scope["user"]
            username = user.username
            if data.get("type") == "ping":
                await redis_client.set(f"user_online:{user.id}", "1", ex=5)
                return

            if message.startswith("/dm "):
                target_username = message.split(" ", 1)[1]
                try:
                    target_user = await database_sync_to_async(
                        get_user_model().objects.get
                    )(username=target_username)
                except get_user_model().DoesNotExist:
                    await self.send(
                        text_data=json.dumps(
                            {
                                "username": "SYSTEM",
                                "message": f"❌ User '{target_username}' does not exist.",
                            }
                        )
                    )
                    return

                usernames = sorted([self.scope["user"].username, target_username])
                room_name = f"dm__{usernames[0]}__{usernames[1]}"

                # ✅ Notify both users
                for username in usernames:
                    await self.channel_layer.group_send(
                        f"user_notify_{username}",
                        {
                            "type": "open_dm",
                            "room": room_name,
                            "from": self.scope["user"].username,
                        },
                    )
                return

            if message.startswith("/invite "):
                try:
                    parts = message.split()
                    if len(parts) != 3:
                        raise ValueError("Usage: /invite <username> <room_name>")

                    target, room_name = parts[1], parts[2]
                    invite_link = f"/game?room={room_name}"
                    html_message = (
                        f"{username} invited {target} to a game 🎮 → "
                        f"<a href='{invite_link}' class='game-invite-link' data-room='{room_name}'>Join Game</a>"
                    )

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "chat_message",
                            "username": "SYSTEM",
                            "message": html_message,
                            "is_html": True,
                        },
                    )
                    logger.info(f"[🎮 INVITE] {username} invited {target} to room {room_name}")
                except Exception as e:
                    await self.send(text_data=json.dumps({
                        "username": "SYSTEM",
                        "message": f"❌ Error with /invite command: {str(e)}"
                    }))
                return


            if message.startswith("/block"):
                target = message.split(" ", 1)[1]
                await block(user, target)
                await self.send(
                    text_data=json.dumps(
                        {
                            "username": "SYSTEM",
                            "message": f"Blocking -> {target} is done",
                        }
                    )
                )
                logger.info(f"[🎮 INVITE] {username} invited {target}")
                return

            if message.startswith("/unblock"):
                target = message.split(" ", 1)[1]
                await unblock(user, target)
                await self.send(
                    text_data=json.dumps(
                        {
                            "username": "SYSTEM",
                            "message": f"Blocking -> {target} is done",
                        }
                    )
                )
                logger.info(f"[🎮 INVITE] {username} invited {target}")
                return

            if message.startswith("/friend"):
                try:
                    _, action, target = message.split(maxsplit=2)
                    if action not in {"add", "accept", "reject", "block", "unblock"}:
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
                    await self.channel_layer.group_send(
                        f"user_notify_{target}",
                        {
                            "type": "chat_message",
                            "username": "SYSTEM",
                            "message": f"👋 {user.username} sent you a friend request!",
                            "timestamp": datetime.now().strftime("%H:%M:%S"),
                        },
                    )
                except Exception as e:
                    await self.send(
                        text_data=json.dumps(
                            {
                                "username": "SYSTEM",
                                "message": str(e),
                            }
                        )
                    )
                return

            await redis_client.rpush(
                f"chat_room:{self.room_name}",
                json.dumps(
                    {
                        "username": username,
                        "user_id": user.id,
                        "message": message,
                        "timestamp": datetime.now().strftime("%H:%M:%S"),
                    }
                ),
            )
            await redis_client.ltrim(f"chat_room:{self.room_name}", -50, -1)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "username": username,
                    "user_id": user.id,
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

        if sender != "SYSTEM" and await is_blocked(user, sender):
            logger.info(f"[🙈 BLOCKED MESSAGE] {sender} -> {user.username}")
            return

        await self.send(
            text_data=json.dumps(
                {
                    "username": sender,
                    "user_id": event.get("user_id"),
                    "message": message,
                    "timestamp": event.get("timestamp"),
                    "is_html": event.get("is_html", False),
                }
            )
        )


    async def open_dm(self, event):
        await self.send(
            text_data=json.dumps(
                {"type": "open_dm", "room": event["room"], "from": event["from"]}
            )
        )
