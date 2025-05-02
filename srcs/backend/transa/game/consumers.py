import asyncio, json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from game.utils import get_user_profile, create_match, finish_match
import logging


logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    rooms = {}
    profiles = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_profile = None

    async def setup(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"pong_{self.room_name}"

    async def connect(self):
        await self.setup()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        user = self.scope["user"]
        if not user or not user.is_authenticated:
            logger.warning(
                "[❌ CONNECT BLOCKED] Unauthenticated user tried to connect."
            )
            await self.close()
            return
        logger.info(
            f"[🔌 CONNECT] USER IN WEBSOCKET CONNECT: {user} {user.id} {user.is_authenticated}"
        )

        self.user_profile = await get_user_profile(user.id)
        username = await sync_to_async(lambda: self.user_profile.user.username)()
        GameConsumer.profiles[self.channel_name] = self.user_profile

        room = GameConsumer.rooms.setdefault(
            self.room_name,
            {
                "players": {},
                "names": {},
                "ball": {"x": 250, "y": 150, "vx": 3, "vy": 3},
                "paddle1_y": 100,
                "paddle2_y": 100,
                "directions": [0, 0],
                "score": [0, 0],
                "timer": 60,
                "_last_timer": 60,
                "started": False,
                "loop_task": None,
            },
        )
        room["names"][self.channel_name] = username

        if self.channel_name not in room["players"]:
            if len(room["players"]) >= 2:
                await self.close()
                return
            self.player_id = len(room["players"])
            room["players"][self.channel_name] = self.player_id
        else:
            self.player_id = room["players"][self.channel_name]

        await self.send(
            text_data=json.dumps({"type": "init", "playerId": self.player_id})
        )

        if len(room["players"]) == 2 and not room["started"]:
            room["started"] = True

            p1 = self.user_profile
            p2 = None
            for ch, pid in room["players"].items():
                if pid != self.player_id:
                    p2 = GameConsumer.profiles.get(ch)
            if self.player_id == 1:
                p1, p2 = p2, p1

            if p1 and p2:
                match = await create_match(p1, p2)
                room["match"] = match
                await self.start_game_loop(room)

        else:
            await self.send(text_data=json.dumps({"type": "waiting"}))

    async def disconnect(self, code):
        room = GameConsumer.rooms.get(self.room_name)
        if room:
            room["players"].pop(self.channel_name, None)
            room["names"].pop(self.channel_name, None)
            if not room["players"]:
                task = room.get("loop_task")
                if task and not task.done():
                    task.cancel()
                GameConsumer.profiles.pop(self.channel_name, None)
                GameConsumer.rooms.pop(self.room_name, None)

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
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "game_end"}
            )

        elif data["type"] == "reset":
            await self.reset_game(room)
            await self.start_game_loop(room)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_state",
                    "ball": room["ball"],
                    "paddle1_y": room["paddle1_y"],
                    "paddle2_y": room["paddle2_y"],
                    "score": room["score"],
                },
            )

        elif data["type"] == "set_name":
            name = data.get("name") or self.user_profile.user.username
            room["names"][self.channel_name] = name
            ordered = [None, None]
            for ch, pid in room["players"].items():
                ordered[pid] = room["names"].get(ch, f"Player {pid + 1}")
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "player_names", "names": ordered}
            )

    async def start_game_loop(self, room):
        # Cancel previous loop if still running
        task = room.get("loop_task")
        if task and not task.done():
            task.cancel()

        # Start new game loop
        room["loop_task"] = asyncio.create_task(self.game_loop(room))

    async def player_names(self, event):
        await self.send(
            text_data=json.dumps({"type": "names", "names": event["names"]})
        )

    async def timer_update(self, event):
        await self.send(
            text_data=json.dumps({"type": "timer", "value": event["timer"]})
        )

    async def update_state(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "state",
                    "ball": event["ball"],
                    "paddle1_y": event["paddle1_y"],
                    "paddle2_y": event["paddle2_y"],
                    "score": event["score"],
                }
            )
        )

    async def game_end(self, event):
        room = GameConsumer.rooms.get(self.room_name)
        if room:
            room["started"] = False
            score = room["score"]
            is_draw = False

            if "match" not in room or room["match"] is None:
                await self.send(text_data=json.dumps({"type": "end"}))
                return
            if score[0] > score[1]:
                winner = room["match"].player1_id
            elif score[1] > score[0]:
                winner = room["match"].player2_id
            else:
                winner = None
                is_draw = True
            await finish_match(room["match"], score[0], score[1], winner, is_draw)

        await self.send(text_data=json.dumps({"type": "end"}))

    async def game_loop(self, room):
        while room in GameConsumer.rooms.values() and room["started"]:
            room["paddle1_y"] += room["directions"][0] * 5
            room["paddle2_y"] += room["directions"][1] * 5
            room["paddle1_y"] = max(0, min(240, room["paddle1_y"]))
            room["paddle2_y"] = max(0, min(240, room["paddle2_y"]))

            ball = room["ball"]
            ball["x"] += ball["vx"]
            ball["y"] += ball["vy"]

            if ball["y"] <= 0 or ball["y"] >= 300:
                ball["vy"] *= -1

            if (
                ball["x"] <= 8
                and room["paddle1_y"] <= ball["y"] <= room["paddle1_y"] + 60
            ):
                ball["vx"] *= -1
            elif (
                ball["x"] >= 492
                and room["paddle2_y"] <= ball["y"] <= room["paddle2_y"] + 60
            ):
                ball["vx"] *= -1

            if ball["x"] <= 0:
                room["score"][1] += 1
                await self.reset_ball(room)
            elif ball["x"] >= 500:
                room["score"][0] += 1
                await self.reset_ball(room)

            room["timer"] -= 1 / 60
            if int(room["timer"]) != int(room["_last_timer"]):
                room["_last_timer"] = int(room["timer"])
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "timer_update", "timer": int(room["timer"])},
                )

            if room["timer"] <= 0:
                room["started"] = False
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "game_end"}
                )
                break

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_state",
                    "ball": ball,
                    "paddle1_y": room["paddle1_y"],
                    "paddle2_y": room["paddle2_y"],
                    "score": room["score"],
                },
            )

            await asyncio.sleep(1 / 60)

    async def reset_game(self, room):
        room["ball"] = {"x": 250, "y": 150, "vx": 3, "vy": 3}
        room["paddle1_y"] = 100
        room["paddle2_y"] = 100
        room["score"] = [0, 0]
        room["directions"] = [0, 0]
        room["timer"] = 60
        room["_last_timer"] = 60
        room["started"] = True

    async def reset_ball(self, room):
        room["ball"] = {"x": 250, "y": 150, "vx": -room["ball"]["vx"], "vy": 3}
