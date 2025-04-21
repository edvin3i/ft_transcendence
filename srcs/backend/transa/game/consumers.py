import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    players = {}
    game_started = False
    ball = {"x": 250, "y": 150, "vx": 3, "vy": 3}
    paddle1_y = 100
    paddle2_y = 100
    paddle_speed = 5
    paddle_height = 60
    score = [0, 0]

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"pong_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Register player
        GameConsumer.players[self.channel_name] = len(GameConsumer.players)
        self.player_id = GameConsumer.players[self.channel_name]

        await self.send(text_data=json.dumps({"type": "init", "playerId": self.player_id}))

        if len(GameConsumer.players) == 2 and not GameConsumer.game_started:
            GameConsumer.game_started = True
            asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        GameConsumer.players.pop(self.channel_name, None)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "move":
            if self.player_id == 0:
                GameConsumer.paddle1_y += data["direction"] * GameConsumer.paddle_speed
            elif self.player_id == 1:
                GameConsumer.paddle2_y += data["direction"] * GameConsumer.paddle_speed

    async def game_loop(self):
        while True:
            # Move ball
            GameConsumer.ball["x"] += GameConsumer.ball["vx"]
            GameConsumer.ball["y"] += GameConsumer.ball["vy"]

            # Bounce off top/bottom
            if GameConsumer.ball["y"] <= 0 or GameConsumer.ball["y"] >= 300:
                GameConsumer.ball["vy"] *= -1

            # Bounce off paddles
            if GameConsumer.ball["x"] <= 8 and GameConsumer.paddle1_y <= GameConsumer.ball["y"] <= GameConsumer.paddle1_y + GameConsumer.paddle_height:
                GameConsumer.ball["vx"] *= -1
            elif GameConsumer.ball["x"] >= 492 and GameConsumer.paddle2_y <= GameConsumer.ball["y"] <= GameConsumer.paddle2_y + GameConsumer.paddle_height:
                GameConsumer.ball["vx"] *= -1

            # Score
            if GameConsumer.ball["x"] <= 0:
                GameConsumer.score[1] += 1
                self.reset_ball()
            elif GameConsumer.ball["x"] >= 500:
                GameConsumer.score[0] += 1
                self.reset_ball()

            # Broadcast game state
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "update_state",
                    "ball": GameConsumer.ball,
                    "paddle1_y": GameConsumer.paddle1_y,
                    "paddle2_y": GameConsumer.paddle2_y,
                    "score": GameConsumer.score,
                }
            )
            await asyncio.sleep(1/60)  # 60 FPS

    def reset_ball(self):
        GameConsumer.ball = {"x": 250, "y": 150, "vx": -GameConsumer.ball["vx"], "vy": 3}

    async def update_state(self, event):
        await self.send(text_data=json.dumps({
            "type": "state",
            "ball": event["ball"],
            "paddle1_y": event["paddle1_y"],
            "paddle2_y": event["paddle2_y"],
            "score": event["score"]
        }))
