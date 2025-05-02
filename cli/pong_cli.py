import asyncio
import curses
import json
import ssl
import websockets
import requests
import os
import urllib3
from getpass import getpass

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

TOKENS_FILE = "cli/.tokens.json"
BASE_URL = "https://localhost"
WIDTH, HEIGHT = 60, 20

state = {
    "paddle1_y": 10,
    "paddle2_y": 10,
    "ball_x": 30,
    "ball_y": 10,
    "score1": 0,
    "score2": 0,
    "playerId": None,
    "running": True,
    "waiting": True,
}

# 🔐 Login si pas de .tokens.json
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

# 🔁 Refresh token
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

# 🧠 Optionnel : affichage de l'utilisateur (si /api/users/me/ existe)
def get_user_info(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/users/me/", headers=headers, verify=False)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return {"username": "unknown", "id": "?"}

def draw_game(stdscr):
    stdscr.clear()
    stdscr.border()
    stdscr.addstr(0, WIDTH // 2 - 5, f"{state['score1']} - {state['score2']}")

    if state["waiting"]:
        stdscr.addstr(HEIGHT // 2, WIDTH // 2 - 12, "Waiting for opponent...")
    else:
        stdscr.addch(state["ball_y"], state["ball_x"], "O")
        for i in range(5):
            stdscr.addch(state["paddle1_y"] + i, 2, "|")
            stdscr.addch(state["paddle2_y"] + i, WIDTH - 3, "|")

    stdscr.refresh()

async def pong_loop(stdscr, room_name):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.timeout(50)

    token = get_access_token()
    uri = f"wss://localhost/ws/game/{room_name}/?token={token}"
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
                        state["paddle1_y"] = max(1, min(HEIGHT - 6, data["paddle1_y"] // 5))
                        state["paddle2_y"] = max(1, min(HEIGHT - 6, data["paddle2_y"] // 5))
                        state["ball_x"] = max(1, min(WIDTH - 2, data["ball"]["x"] // 10))
                        state["ball_y"] = max(1, min(HEIGHT - 2, data["ball"]["y"] // 5))
                        state["score1"], state["score2"] = data["score"]
                    elif data["type"] == "waiting":
                        state["waiting"] = True
                    elif data["type"] == "end":
                        state["running"] = False
                        stdscr.addstr(HEIGHT // 2, WIDTH // 2 - 5, "GAME OVER")
                        stdscr.refresh()
                        await asyncio.sleep(2)
                        break
            except websockets.exceptions.ConnectionClosed:
                state["running"] = False

        async def sender():
            try:
                while state["running"]:
                    key = stdscr.getch()
                    if key in [ord("q")]:
                        state["running"] = False
                        break
                    elif state["playerId"] == 0 and key in [ord("w"), ord("s")]:
                        dir = -1 if key == ord("w") else 1
                        await websocket.send(json.dumps({"type": "move", "direction": dir}))
                    elif state["playerId"] == 1 and key in [curses.KEY_UP, curses.KEY_DOWN]:
                        dir = -1 if key == curses.KEY_UP else 1
                        await websocket.send(json.dumps({"type": "move", "direction": dir}))
                    elif key == -1 and not state["waiting"]:
                        await websocket.send(json.dumps({"type": "move", "direction": 0}))
                    await asyncio.sleep(0.05)
            except websockets.exceptions.ConnectionClosed:
                state["running"] = False

        async def renderer():
            while state["running"]:
                draw_game(stdscr)
                await asyncio.sleep(1 / 30)

        await asyncio.gather(receiver(), sender(), renderer())
        await asyncio.sleep(2)

def start_curses(room_name):
    curses.wrapper(lambda stdscr: asyncio.run(pong_loop(stdscr, room_name)))

if __name__ == "__main__":
    room = input("🎯 Enter room name (default: myroom): ").strip() or "myroom"
    start_curses(room)
