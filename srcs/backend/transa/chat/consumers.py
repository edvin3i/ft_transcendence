from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"messgae": "Hello! Je suis Le Chat!"})

    async def receive_json(self, content, **kwargs):
        await self.send_json({"echo": content})
