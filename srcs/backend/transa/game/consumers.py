import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"pong_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        room = GameConsumer.rooms.setdefault(self.room_name, {
            "players": [],
            "ball": {"x": 250, "y": 150, "vx": 3, "vy": 3},
            "paddle1_y": 100,
            "paddle2_y": 100,
            "score": [0, 0],
            "started": False
        })

        if len(room["players"]) < 2:
            room["players"].append(self.channel_name)
            self.player_id = len(room["players"]) - 1
            await self.send(text_data=json.dumps({
                "type": "init",
                "playerId": self.player_id
            }))
        else:
            await self.close()
            return

        if len(room["players"]) == 2 and not room["started"]:
            room["started"] = True
            asyncio.create_task(self.game_loop(room))

        else:
            await self.send(text_data=json.dumps({
                "type": "waiting"
            }))

    async def disconnect(self, code):
        room = GameConsumer.rooms.get(self.room_name)
        if room and self.channel_name in room["players"]:
            room["players"].remove(self.channel_name)
            if not room["players"]:
                GameConsumer.rooms.pop(self.room_name)

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        room = GameConsumer.rooms[self.room_name]

        if data["type"] == "move":
            if data["player"] == 0:
                room["paddle1_y"] += data["direction"] * 5
            elif data["player"] == 1:
                room["paddle2_y"] += data["direction"] * 5

        elif data["type"] == "end":
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "game_end"
            })

    async def game_loop(self, room):
        while room in GameConsumer.rooms.values() and room["started"]:
            ball = room["ball"]
            ball["x"] += ball["vx"]
            ball["y"] += ball["vy"]

            # bounce
            if ball["y"] <= 0 or ball["y"] >= 300:
                ball["vy"] *= -1

            if ball["x"] <= 8 and room["paddle1_y"] <= ball["y"] <= room["paddle1_y"] + 60:
                ball["vx"] *= -1
            elif ball["x"] >= 492 and room["paddle2_y"] <= ball["y"] <= room["paddle2_y"] + 60:
                ball["vx"] *= -1

            # scoring
            if ball["x"] <= 0:
                room["score"][1] += 1
                self.reset_ball(room)
            elif ball["x"] >= 500:
                room["score"][0] += 1
                self.reset_ball(room)

            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update_state",
                "ball": ball,
                "paddle1_y": room["paddle1_y"],
                "paddle2_y": room["paddle2_y"],
                "score": room["score"]
            })

            await asyncio.sleep(1 / 60)

    def reset_ball(self, room):
        room["ball"] = {"x": 250, "y": 150, "vx": -room["ball"]["vx"], "vy": 3}

    async def update_state(self, event):
        await self.send(text_data=json.dumps({
            "type": "state",
            "ball": event["ball"],
            "paddle1_y": event["paddle1_y"],
            "paddle2_y": event["paddle2_y"],
            "score": event["score"]
        }))

    async def game_end(self, event):
        await self.send(text_data=json.dumps({ "type": "end" }))
