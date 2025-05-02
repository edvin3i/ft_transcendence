import asyncio
import websockets
import json
import ssl
import requests
import os

TOKENS_FILE = "cli/.tokens.json"
ROOM_NAME = "myroom"
BASE_URL = "https://localhost"

# 🔁 Lire et rafraîchir le token d'accès
def get_access_token():
    if not os.path.exists(TOKENS_FILE):
        print(f"❌ Token file not found: {TOKENS_FILE}")
        exit(1)

    with open(TOKENS_FILE) as f:
        tokens = json.load(f)

    refresh = tokens.get("refresh")
    if not refresh:
        print("❌ Refresh token not found in token file.")
        exit(1)

    response = requests.post(
        f"{BASE_URL}/api/auth/token/refresh/",
        json={"refresh": refresh},
        verify=False  # 🚨 à désactiver en production
    )

    if response.status_code != 200:
        print("❌ Failed to refresh access token.")
        print(response.text)
        exit(1)

    access = response.json()["access"]
    tokens["access"] = access

    with open(TOKENS_FILE, "w") as f:
        json.dump(tokens, f)

    return access

# 🔐 Initialisation
token = get_access_token()
ws_url = f"wss://localhost/ws/game/{ROOM_NAME}/?token={token}"
ssl_context = ssl._create_unverified_context()

# 🎮 Fonction principale
async def play():
    async with websockets.connect(ws_url, ssl=ssl_context) as websocket:
        print("🕹️  Connected to Pong!")
        await websocket.send(json.dumps({"type": "set_name", "name": "CLI_Player"}))

        async def sender():
            while True:
                cmd = input("Déplacement [w/s] ou [Entrée] pour stop : ").strip().lower()
                direction = -1 if cmd == "w" else 1 if cmd == "s" else 0
                await websocket.send(json.dumps({"type": "move", "direction": direction}))

        async def receiver():
            async for msg in websocket:
                try:
                    data = json.loads(msg)
                    print(f"📡 {data}")
                except Exception as e:
                    print(f"⚠️  Message mal formé : {msg}")

        await asyncio.gather(sender(), receiver())

if __name__ == "__main__":
    asyncio.run(play())
