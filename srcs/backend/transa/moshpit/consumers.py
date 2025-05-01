import json
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from .moshpit_logic import MoshpitGame

from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import TokenError
from urllib.parse import parse_qs


# In-memory storage for all matches: match_id -> {{ game, players, loop_task }}
_matches = {}

class MoshpitConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# 🔐 Authentification JWT sans accès au modèle User
		query_string = self.scope['query_string'].decode()
		query_params = parse_qs(query_string)
		token = query_params.get('token', [None])[0]

		if token is None:
			print("❌ Aucun token JWT fourni.")
			await self.close()
			return

		try:
			validated_token = UntypedToken(token)
			self.player_id = str(validated_token['user_id'])  # Utilise juste l'ID
			print(f"✅ Joueur authentifié : ID {self.player_id}")
		except TokenError as e:
			print("❌ Token JWT invalide :", e)
			await self.close()
			return

		# 🎮 Setup de la partie
		self.match_id = self.scope['url_route']['kwargs']['match_id']
		self.group_name = f"match_{self.match_id}"

		if self.match_id not in _matches:
			_matches[self.match_id] = {
				'game': MoshpitGame(),
				'players': {},        # player_id -> channel_name
				'loop_task': None,
				'started': False,
			}
		match = _matches[self.match_id]

		# Ajouter le joueur au jeu
		match['game'].add_player(self.player_id)
		match['players'][self.player_id] = self.channel_name

		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()

		required_players = 4#number of awaaited players
		if len(match['players']) == required_players and not match['started']:
			match['started'] = True
			match['loop_task'] = asyncio.create_task(self._game_loop())
			print(f"🎮 Match {self.match_id} démarré avec {len(match['players'])} joueurs.")
		else:
			await self.send(text_data=json.dumps({
				"type": "waiting",
				"players": list(match['players'].keys())
			}))

		# Envoyer l'état initial
		initial = match['game'].get_game_state()
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'game_update',
				'game_state': initial
			}
		)

	async def disconnect(self, close_code):
		# Remove player
		if self.match_id in _matches:
			match = _matches[self.match_id]
			# Clean game state
			match['game'].remove_player(self.player_id)
			match['players'].pop(self.player_id, None)

			# Leave group
			await self.channel_layer.group_discard(
				self.group_name,
				self.channel_name
			)
			# If no players left, cancel loop
			if not match['players']:
				if match['loop_task']:
					match['loop_task'].cancel()
				_matches.pop(self.match_id, None)

	async def receive(self, text_data):
		data = json.loads(text_data)
		action = data.get('action')

		if action == 'move':
			# direction: 'left' or 'right'
			dir_str = data.get('direction')
			direction = -1 if dir_str == 'left' else 1
			_matches[self.match_id]['game'].set_player_direction(self.player_id, direction)

		elif action == 'request_game_state':
			# Send back current state
			state = _matches[self.match_id]['game'].get_game_state()
			await self.send(text_data=json.dumps({'type': 'game_update', 'game_state': state}))

		elif action == 'end_game':
			# Cancel loop and broadcast end
			match = _matches[self.match_id]
			if match['loop_task']:
				match['loop_task'].cancel()
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'game_update',
					'game_state': {'ended': True}
				}
			)

	async def game_update(self, event):
		# Forward game state to WebSocket
		await self.send(text_data=json.dumps({
			'type': 'game_update',
			'game_state': event['game_state']
		}))

	async def _game_loop(self):
		"""
		Runs at ~60 FPS, updates game and broadcasts state.
		"""
		try:
			while True:
				match = _matches.get(self.match_id)
				if not match:
					break
				game = match['game']
				game.update()
				state = game.get_game_state()
				await self.channel_layer.group_send(
					self.group_name,
					{
						'type': 'game_update',
						'game_state': state
					}
				)
				await asyncio.sleep(1/60)
		except asyncio.CancelledError:
			# Loop cancelled when match ends
			pass
