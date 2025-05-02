import asyncio, json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from game.utils import get_user_profile, create_match, finish_match
import logging
import random, math, time

logger = logging.getLogger(__name__)


class GameConsumer(AsyncWebsocketConsumer):
    rooms = {}
    profiles = {}

    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
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
            logger.warning("[❌ CONNECT BLOCKED] Unauthenticated user tried to connect.")
            await self.close()
            return

        logger.info(f"[🔌 CONNECT] USER: {user} ID: {user.id} AUTH: {user.is_authenticated}")

        self.user_profile = await get_user_profile(user.id)
        username = await sync_to_async(lambda: self.user_profile.user.username)()
        GameConsumer.profiles[self.channel_name] = self.user_profile

        # Get or create room
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

        # 🔥 Clean up stale players
        stale_channels = [ch for ch in list(room["players"].keys()) if ch not in GameConsumer.profiles]
        for ch in stale_channels:
            room["players"].pop(ch, None)
            room["names"].pop(ch, None)
            logger.warning(f"[🧹 CLEANUP] Removed stale channel {ch} from room {self.room_name}")

        # ✅ Reset room if not exactly 1 player present
        if len(room["players"]) != 1:
            logger.info(f"[🔁 RESET] Resetting room {self.room_name} (player count: {len(room['players'])})")
            task = room.get("loop_task")
            if task and not task.done():
                task.cancel()

            GameConsumer.rooms[self.room_name] = {
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
            }
            room = GameConsumer.rooms[self.room_name]

        room["names"][self.channel_name] = username

        # Register this player
        self.player_id = len(room["players"])
        room["players"][self.channel_name] = self.player_id

        await self.send(text_data=json.dumps({"type": "init", "playerId": self.player_id}))

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

            if "match" not in room or room["match"] is None:
                await self.send(text_data=json.dumps({"type": "end"}))
                return
            is_draw = score[0] == score[1]
            if not is_draw:
                winner = room["match"].player1_id if score[0] > score[1] else room["match"].player2_id
            else:
                winner = None

            try:
                await finish_match(room["match"], score[0], score[1], winner, is_draw)
            except Exception as e:
                logger.error(f"[🔥 ERROR] During match finalization: {e}")


        result = {"type": "end"}
        if "match" in room and room["match"] is not None:
            score = room["score"]
            if score[0] > score[1]:
                result["winner"] = "left"
            elif score[1] > score[0]:
                result["winner"] = "right"
            else:
                result["winner"] = "draw"

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast_end",
                "result": result,
            }
        )

    async def broadcast_end(self, event):
        await self.send(text_data=json.dumps(event["result"]))

    async def game_loop(self, room):
        import math, time

        room["last_rally_time"] = time.time()
        paddle_height = 80
        canvas_height = 300
        canvas_width = 500
        paddle_thickness = 12
        ball_size = 16

        def bounce(ball_y, paddle_y, paddle_height, vx_sign):
            intersect = (ball_y - (paddle_y + paddle_height / 2)) / (paddle_height / 2)
            intersect = max(-1, min(1, intersect))
            max_angle = math.pi / 3
            angle = intersect * max_angle
            speed = math.hypot(room["ball"]["vx"], room["ball"]["vy"])
            vx = vx_sign * speed * math.cos(angle)
            vy = speed * math.sin(angle)
            return vx, vy

        while room in GameConsumer.rooms.values() and room["started"]:
            now = time.time()

            # Move paddles
            room["paddle1_y"] += room["directions"][0] * 5
            room["paddle2_y"] += room["directions"][1] * 5
            room["paddle1_y"] = max(0, min(canvas_height - paddle_height, room["paddle1_y"]))
            room["paddle2_y"] = max(0, min(canvas_height - paddle_height, room["paddle2_y"]))

            ball = room["ball"]
            ball["x"] += ball["vx"]
            ball["y"] += ball["vy"]

            # Top/bottom wall collision
            if ball["y"] <= 0 or ball["y"] + ball_size >= canvas_height:
                ball["vy"] *= -1

            # Left paddle
            if ball["x"] <= paddle_thickness:
                if room["paddle1_y"] <= ball["y"] <= room["paddle1_y"] + paddle_height:
                    ball["vx"], ball["vy"] = bounce(ball["y"], room["paddle1_y"], paddle_height, 1)
                    room["last_rally_time"] = now
                else:
                    room["score"][1] += 1
                    await self.reset_ball(room)
                    continue

            # Right paddle
            if ball["x"] + ball_size >= canvas_width - paddle_thickness:
                if room["paddle2_y"] <= ball["y"] <= room["paddle2_y"] + paddle_height:
                    ball["vx"], ball["vy"] = bounce(ball["y"], room["paddle2_y"], paddle_height, -1)
                    room["last_rally_time"] = now
                else:
                    room["score"][0] += 1
                    await self.reset_ball(room)
                    continue

            # Rally acceleration every second
            if now - room["last_rally_time"] >= 1.0:
                rally_boost = 0.15
                speed = math.hypot(ball["vx"], ball["vy"]) + rally_boost
                angle = math.atan2(ball["vy"], ball["vx"])
                ball["vx"] = speed * math.cos(angle)
                ball["vy"] = speed * math.sin(angle)
                room["last_rally_time"] = now

            # Timer update
            room["timer"] -= 1 / 60
            if int(room["timer"]) != int(room["_last_timer"]):
                room["_last_timer"] = int(room["timer"])
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "timer_update", "timer": int(room["timer"])}
                )

            # End of game if time runs out
            if room["timer"] <= 0:
                room["started"] = False
                await self.channel_layer.group_send(self.room_group_name, {"type": "game_end"})
                break

            # Send game state
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
        ball = room["ball"]

        # Centre la balle au milieu du canvas
        ball["x"] = 250 - 4  # si 8x8
        ball["y"] = 150 - 4

        # Génère un angle raisonnable (ni trop horizontal, ni trop vertical)
        while True:
            angle = random.uniform(0, 2 * math.pi)
            if abs(math.cos(angle)) >= 0.25 and abs(math.sin(angle)) >= 0.15:
                break

        speed = 3  # 💡 vitesse de départ
        ball["vx"] = speed * math.cos(angle)
        ball["vy"] = speed * math.sin(angle)

        room["last_rally_time"] = time.time()
