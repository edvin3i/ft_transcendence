import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage, UserBlock

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Envoyer les 50 derniers messages
        messages = await database_sync_to_async(list)(
            ChatMessage.objects.filter(room=self.room_name)
            .order_by("-timestamp")[:50]
        )
        for message in reversed(messages):
            await self.send(text_data=json.dumps({
                "username": message.user.username,
                "message": message.content,
                "timestamp": message.timestamp.strftime("%H:%M:%S")
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        user = self.scope["user"]

        # ✅ Commande : /invite <username>
        if message.startswith("/invite "):
            target_username = message.split(" ", 1)[1]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": f"{user.username} invited {target_username} to a game 🎮",
                    "username": "SYSTEM"
                }
            )
            return

        # ✅ Commande : /block <username>
        if message.startswith("/block "):
            target_username = message.split(" ", 1)[1]
            try:
                target_user = await database_sync_to_async(User.objects.get)(username=target_username)
                await database_sync_to_async(UserBlock.objects.get_or_create)(user=user, blocked_user=target_user)
                await self.send(text_data=json.dumps({
                    "username": "SYSTEM",
                    "message": f"You have blocked {target_username}"
                }))
            except User.DoesNotExist:
                await self.send(text_data=json.dumps({
                    "username": "SYSTEM",
                    "message": f"User '{target_username}' not found"
                }))
            return

        # ✅ Message normal : enregistrer + diffuser
        await database_sync_to_async(ChatMessage.objects.create)(
            user=user,
            room=self.room_name,
            content=message
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "username": user.username
            }
        )

    async def chat_message(self, event):
        sender = event["username"]
        user = self.scope["user"]

        # ✅ Ne pas recevoir les messages de ceux qu'on a bloqués
        is_blocked = await database_sync_to_async(UserBlock.objects.filter(user=user, blocked_user__username=sender).exists)()
        if is_blocked and sender != "SYSTEM":
            return

        await self.send(text_data=json.dumps({
            "username": sender,
            "message": event["message"]
        }))
