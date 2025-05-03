import asyncio
import curses
import json
import ssl
import websockets
import requests
import os
import urllib3
from getpass import getpass
import jwt


DJANGO_EXT_PORT = os.getenv('DJANGO_EXT_PORT', 4443)

print(f" =================== {DJANGO_EXT_PORT} ===================")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

TOKENS_FILE = "cli/.tokens.json"
BASE_URL = f"https://localhost:{DJANGO_EXT_PORT}"
WIDTH, HEIGHT = 50, 20

state = {
    "paddle1_y": 10,
    "paddle2_y": 10,
    "ball_x": 25,
    "ball_y": 10,
    "score1": 0,
    "score2": 0,
    "playerId": None,
    "running": True,
    "waiting": True,
    "timer": 60,
    "last_dir": None,
}

def login_and_save_tokens(username: str, password: str):
    response = requests.post(
        f"{BASE_URL}/api/auth/token/",
        json={"username": username, "password": password},
        verify=False
    )
    if response.status_code != 200:
        print("❌ Login failed:", response.text)
        exit(1)
    tokens = response.json()
    with open(TOKENS_FILE, "w") as f:
        json.dump(tokens, f)
    print("✅ Login successful. Tokens saved.")

def get_access_token():
    if not os.path.exists(TOKENS_FILE):
        print("🔐 No saved token. Please log in.")
        username = input("Username: ")
        password = getpass("Password: ")
        login_and_save_tokens(username, password)

    with open(TOKENS_FILE) as f:
        tokens = json.load(f)

    response = requests.post(
        f"{BASE_URL}/api/auth/token/refresh/",
        json={"refresh": tokens["refresh"]},
        verify=False
    )

    if response.status_code != 200:
        print("❌ Failed to refresh token:", response.text)
        exit(1)

    tokens["access"] = response.json()["access"]
    with open(TOKENS_FILE, "w") as f:
        json.dump(tokens, f)

    return tokens["access"]

def get_user_info(token: str):
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return {"username": payload.get("username", "CLI_Player"), "id": payload.get("user_id", "?")}
    except Exception:
        return {"username": "CLI_Player", "id": "?"}

def draw_game(win):
    win.clear()
    win.border()
    win.addstr(0, 2, f"⏱️ {state['timer']}s")
    win.addstr(1, WIDTH // 2 - 5, f"{state['score1']} - {state['score2']}")

    if state["waiting"]:
        win.addstr(HEIGHT // 2, WIDTH // 2 - 12, "Waiting for opponent...")
    else:
        try:
            win.addch(int(state["ball_y"]), int(state["ball_x"]), "●")
        except curses.error:
            pass
        for i in range(5):
            win.addch(state["paddle1_y"] + i, 1, "█")
            win.addch(state["paddle2_y"] + i, WIDTH - 2, "█")
    win.refresh()

async def pong_loop(stdscr, room_name, token):
    curses.curs_set(0)
    stdscr.clear()
    stdscr.refresh()

    gamewin = curses.newwin(HEIGHT, WIDTH, 1, 1)
    gamewin.nodelay(True)
    gamewin.timeout(1)
    gamewin.keypad(True)

    stdscr.addstr(0, 2, f"🎮 Pong - Room: {room_name}")
    stdscr.refresh()

    uri = f"wss://localhost:{DJANGO_EXT_PORT}/ws/game/{room_name}/?token={token}"
    ssl_context = ssl._create_unverified_context()
    user = get_user_info(token)

    print(f"👤 Logged in as: {user.get('username')} (ID: {user.get('id')})")
    print(f"🔗 Joining room: {room_name}")

    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        await websocket.send(json.dumps({"type": "set_name", "name": user.get("username", "CLI_Player")}))

        async def receiver():
            try:
                async for msg in websocket:
                    data = json.loads(msg)
                    if data["type"] == "init":
                        state["playerId"] = data["playerId"]
                        state["waiting"] = False
                    elif data["type"] == "state":
                        state["waiting"] = False
                        state["paddle1_y"] = max(1, min(HEIGHT - 6, int(data["paddle1_y"] * HEIGHT / 300)))
                        state["paddle2_y"] = max(1, min(HEIGHT - 6, int(data["paddle2_y"] * HEIGHT / 300)))
                        state["ball_x"] = max(1, min(WIDTH - 2, int(data["ball"]["x"] * WIDTH / 500)))
                        state["ball_y"] = max(1, min(HEIGHT - 2, int(data["ball"]["y"] * HEIGHT / 300)))
                        state["score1"], state["score2"] = data["score"]
                    elif data["type"] == "timer":
                        state["timer"] = data["value"]
                    elif data["type"] == "waiting":
                        state["waiting"] = True
                    elif data["type"] == "end":
                        state["running"] = False
                        gamewin.addstr(HEIGHT // 2, WIDTH // 2 - 5, "GAME OVER")
                        gamewin.refresh()
                        await asyncio.sleep(2)
                        break
            except websockets.exceptions.ConnectionClosed:
                state["running"] = False

        async def sender():
            try:
                while state["running"]:
                    key = gamewin.getch()
                    if key == ord("q"):
                        state["running"] = False
                        break
                    dir = None
                    if state["playerId"] == 0 and key in [ord("w"), ord("s")]:
                        dir = -1 if key == ord("w") else 1
                    elif state["playerId"] == 1 and key in [curses.KEY_UP, curses.KEY_DOWN]:
                        dir = -1 if key == curses.KEY_UP else 1

                    if dir is not None and dir != state["last_dir"]:
                        await websocket.send(json.dumps({"type": "move", "direction": dir}))
                        state["last_dir"] = dir
                    elif key == -1 and not state["waiting"] and state["last_dir"] != 0:
                        await websocket.send(json.dumps({"type": "move", "direction": 0}))
                        state["last_dir"] = 0

                    await asyncio.sleep(1 / 60)
            except websockets.exceptions.ConnectionClosed:
                state["running"] = False

        async def renderer():
            while state["running"]:
                draw_game(gamewin)
                await asyncio.sleep(1 / 60)

        await asyncio.gather(receiver(), sender(), renderer())
        print("\n🏁 Session terminée.")
        await asyncio.sleep(1)

def start_curses(room_name, token):
    curses.wrapper(lambda stdscr: asyncio.run(pong_loop(stdscr, room_name, token)))

if __name__ == "__main__":
    token = get_access_token()
    room = input("🎯 Enter room name (default: myroom): ").strip() or "myroom"
    start_curses(room, token)
