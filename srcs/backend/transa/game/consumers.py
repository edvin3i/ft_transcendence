import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    # Global dictionary holding game states by room
    rooms = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"pong_{self.room_name}"

        # Join WebSocket group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Initialize room if not already present
        room = GameConsumer.rooms.setdefault(self.room_name, {
            "players": {},  # channel_name → player_id
            "names": {},    # channel_name → player_name
            "ball": {"x": 250, "y": 150, "vx": 3, "vy": 3},
            "paddle1_y": 100,
            "paddle2_y": 100,
            "directions": [0, 0],
            "score": [0, 0],
            "timer": 60,
            "_last_timer": 60,
            "started": False
        })

        # Assign player slot (0 or 1)
        if self.channel_name not in room["players"]:
            if len(room["players"]) >= 2:
                await self.close()
                return
            self.player_id = len(room["players"])
            room["players"][self.channel_name] = self.player_id
        else:
            self.player_id = room["players"][self.channel_name]

        # Send player ID
        await self.send(text_data=json.dumps({
            "type": "init",
            "playerId": self.player_id
        }))

        # Start game if both players are present
        if len(room["players"]) == 2 and not room["started"]:
            room["started"] = True
            asyncio.create_task(self.game_loop(room))
        else:
            await self.send(text_data=json.dumps({ "type": "waiting" }))

    async def disconnect(self, code):
        # Cleanup player and room if empty
        room = GameConsumer.rooms.get(self.room_name)
        if room and self.channel_name in room["players"]:
            room["players"].pop(self.channel_name)
            room["names"].pop(self.channel_name, None)
            if not room["players"]:
                GameConsumer.rooms.pop(self.room_name)

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        room = GameConsumer.rooms[self.room_name]
        player_id = room["players"].get(self.channel_name)

        if player_id is None:
            return

        if data["type"] == "move":
            room["directions"][player_id] = data["direction"]

        elif data["type"] == "end":
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "game_end"
            })

        elif data["type"] == "reset":
            self.reset_game(room)
            asyncio.create_task(self.game_loop(room))
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update_state",
                "ball": room["ball"],
                "paddle1_y": room["paddle1_y"],
                "paddle2_y": room["paddle2_y"],
                "score": room["score"]
            })

        elif data["type"] == "set_name":
            # Save player name and broadcast both names
            room["names"][self.channel_name] = data["name"]
            ordered = [None, None]
            for ch, pid in room["players"].items():
                ordered[pid] = room["names"].get(ch, f"Player {pid + 1}")
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "player_names",
                "names": ordered
            })

    async def player_names(self, event):
        # Send player names to client
        await self.send(text_data=json.dumps({
            "type": "names",
            "names": event["names"]
        }))

    async def timer_update(self, event):
        # Send remaining time to client
        await self.send(text_data=json.dumps({
            "type": "timer",
            "value": event["timer"]
        }))

    async def update_state(self, event):
        # Send full game state to client
        await self.send(text_data=json.dumps({
            "type": "state",
            "ball": event["ball"],
            "paddle1_y": event["paddle1_y"],
            "paddle2_y": event["paddle2_y"],
            "score": event["score"]
        }))

    async def game_end(self, event):
        # End game for all clients
        room = GameConsumer.rooms.get(self.room_name)
        if room:
            room["started"] = False
        await self.send(text_data=json.dumps({ "type": "end" }))

    async def game_loop(self, room):
        while room in GameConsumer.rooms.values() and room["started"]:
            # Update paddle positions
            room["paddle1_y"] += room["directions"][0] * 5
            room["paddle2_y"] += room["directions"][1] * 5
            room["paddle1_y"] = max(0, min(240, room["paddle1_y"]))
            room["paddle2_y"] = max(0, min(240, room["paddle2_y"]))

            # Update ball position
            ball = room["ball"]
            ball["x"] += ball["vx"]
            ball["y"] += ball["vy"]

            if ball["y"] <= 0 or ball["y"] >= 300:
                ball["vy"] *= -1

            if ball["x"] <= 8 and room["paddle1_y"] <= ball["y"] <= room["paddle1_y"] + 60:
                ball["vx"] *= -1
            elif ball["x"] >= 492 and room["paddle2_y"] <= ball["y"] <= room["paddle2_y"] + 60:
                ball["vx"] *= -1

            if ball["x"] <= 0:
                room["score"][1] += 1
                self.reset_ball(room)
            elif ball["x"] >= 500:
                room["score"][0] += 1
                self.reset_ball(room)

            # Countdown timer logic
            room["timer"] -= 1 / 60
            if int(room["timer"]) != int(room["_last_timer"]):
                room["_last_timer"] = int(room["timer"])
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "timer_update",
                    "timer": int(room["timer"])
                })

            if room["timer"] <= 0:
                room["started"] = False
                await self.channel_layer.group_send(self.room_group_name, {
                    "type": "game_end"
                })
                break

            # Broadcast game state
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "update_state",
                "ball": ball,
                "paddle1_y": room["paddle1_y"],
                "paddle2_y": room["paddle2_y"],
                "score": room["score"]
            })

            await asyncio.sleep(1 / 60)

    def reset_game(self, room):
        # Reset game to initial state
        room["ball"] = {"x": 250, "y": 150, "vx": 3, "vy": 3}
        room["paddle1_y"] = 100
        room["paddle2_y"] = 100
        room["score"] = [0, 0]
        room["directions"] = [0, 0]
        room["timer"] = 60
        room["_last_timer"] = 60
        room["started"] = True

    def reset_ball(self, room):
        # Recenter and reverse ball direction
        room["ball"] = {"x": 250, "y": 150, "vx": -room["ball"]["vx"], "vy": 3}
