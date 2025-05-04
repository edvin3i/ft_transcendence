import json
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from .moshpit_logic import MoshpitGame

from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError
from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from moshpit.utils import get_user_profile 

_matches = {}  # match_id -> {game, players, loop_task, started}
_rooms = {}    # room_id -> {players: {player_id: channel_name}, game_started}
               

class MoshpitConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 🔐 Authentification JWT
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            print("❌ Aucun token JWT fourni.")
            await self.close()
            return

        try:
            validated_token = UntypedToken(token)
            user = self.scope.get("user")
            if user is None or not user.is_authenticated:
                await self.close()
                return

            self.user_profile = await get_user_profile(user.id)
            self.player_id = await sync_to_async(lambda: self.user_profile.user.username)()

            for room in _rooms.values():
                if self.player_id in room['players']:
                    await self.send_error("Tu es déjà dans une partie en cours ! 🤖⛔")
                    return

            for match in _matches.values():
                if self.player_id in match['players']:
                    await self.send_error("Tu es déjà dans une partie en cours ! 🤖⛔")
                    return

        except TokenError as e:
            print("❌ Token JWT invalide :", e)
            await self.close()

        self.room_id = None
        self.group_name = None

        # 🔍 Trouver une room avec de la place
        maxNumber = 2
        for room_id, room in _rooms.items():
            if len(room['players']) < maxNumber and not room.get('game_started'):
                self.room_id = room_id
                self.group_name = f"room_{room_id}"
                break

        # 🆕 Créer une nouvelle room si besoin
        if not self.room_id:
            print("room created")
            self.room_id = str(uuid.uuid4())
            self.group_name = f"room_{self.room_id}"
            _rooms[self.room_id] = {'players': {}, 'game_started': False}

        # Ajouter le joueur à la room
        _rooms[self.room_id]['players'][self.player_id] = self.channel_name

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # 🎮 Démarrer la partie si la salle est pleine
        if len(_rooms[self.room_id]['players']) == maxNumber and not _rooms[self.room_id]['game_started']:
            print("room started")
            _rooms[self.room_id]['game_started'] = True
            asyncio.create_task(self.start_game())
        else:
            await self.send(text_data=json.dumps({"type": "waiting", "message": "En attente d'autres joueurs..."}))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            "type": "error",
            "message": message
        }))
        await self.close()

    async def start_game(self):
        match_id = str(uuid.uuid4())
        self.match_id = match_id  # Pour accéder plus tard

        game = MoshpitGame()

        players_info = []
        for username, channel_name in _rooms[self.room_id]['players'].items():
            game.add_player(username)
            color = game.players[username]['color']
            players_info.append({
                'username': username,
                'channel_name': channel_name,
                'color': color
            })


        loop_task = asyncio.create_task(self.run_game_loop(match_id))

        _matches[match_id] = {
            'game': game,
            'players': [p['username'] for p in players_info],  # On stocke les noms seulement
            'loop_task': loop_task,
            'started': True
        }

        # 📨 Envoie personnalisé à chaque joueur
        for info in players_info:
            await self.channel_layer.send(
                info['channel_name'],
                {
                    'type': 'start_match',
                    'match_id': match_id,
                    'player_id': info['username'],
                    'color': info['color'],
                    'players': players_info
                }
            )

        # 🎮 Envoie du 1er état de jeu
        # _matches[match_id]['started'] = True
        await self.send_game_state(match_id)


    async def start_match(self, event):
        self.match_id = event['match_id']
        await self.send(text_data=json.dumps({
            'type': 'start_match',
            'match_id': event['match_id'],
            'player_id': event['player_id'],
            'color': event['color'],
            'players': event['players']
        }))

    async def run_game_loop(self, match_id):
        firstTurn = 0
        match = _matches[match_id]
        game = match['game']  # ✅ Récupérer l'instance du jeu

        while match['started']:
            if firstTurn == 0:
                await asyncio.sleep(4.1)
                firstTurn = 1

            if not match['players']:  # Leave if no players
                match['started'] = False
                break

            if game.finished:  # ✅ Tester correctement la fin du jeu
                print(f"🛑 Game {match_id} terminé, arrêt de la boucle.")
                match['started'] = False
                break

            game.update()
            await self.send_game_state(match_id)
            await asyncio.sleep(1/60)  # 60 FPS

        await self.send_game_state(match_id)  # Dernier état avec "finished"
        if match_id in _matches:
            _matches.pop(match_id, None)

    async def send_game_state(self, match_id):
        match = _matches[match_id]
        state = match['game'].get_game_state()
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'game_update',
                'game_state': state
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if not hasattr(self, 'match_id'):  # Ignore si le match n'est pas encore lancé
            return 

        match = _matches.get(self.match_id)
        if not match:
            return

        if action == 'move':
            print(f"Joueur {self.player_id} a envoyé un mouvement.", flush=True)
            direction = {'left': -1, 'right': 1, 'stop': 0}.get(data.get('direction'), 0)
            match['game'].set_player_direction(self.player_id, direction)

        elif action == 'request_game_state':
            state = match['game'].get_game_state()
            await self.send(text_data=json.dumps({'type': 'game_update', 'game_state': state}))

        elif action == 'end_game':
            if match['loop_task']:
                match['loop_task'].cancel()
            match['started'] = False
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_update',
                    'game_state': {'ended': True}
                }
            )

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'game_state': event['game_state']
        }))

    async def disconnect(self, close_code):
        # 🔌 Retirer joueur de la room
        if hasattr(self, 'room_id') and self.room_id in _rooms:
            _rooms[self.room_id]['players'].pop(self.player_id, None)
            if not _rooms[self.room_id]['players']:
                _rooms.pop(self.room_id)

        # ❌ Retirer joueur du match
        if hasattr(self, 'match_id') and self.match_id in _matches:
            match = _matches[self.match_id]
            match['game'].remove_player(self.player_id)
            match['players'].remove(self.player_id)

            if not match['players']:
                if match['loop_task']:
                    match['loop_task'].cancel()
                _matches.pop(self.match_id)

        # ⛔ Quitter le groupe
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
