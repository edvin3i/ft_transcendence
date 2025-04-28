import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
# from .models import Match, UserProfile

class MoshpitConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # On récupère le match et le joueur en fonction des données
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.player_id = self.scope['user'].id  # Utilisation de l'utilisateur connecté
        self.match = await self.get_match(self.match_id)
        self.player = await self.get_player(self.player_id)

        if not self.match or not self.player:
            # Si on ne trouve pas le match ou le joueur, on ferme la connexion
            await self.close()
            return

        # On enregistre cette connexion dans le groupe du match
        self.group_name = f"match_{self.match_id}"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Ajout du joueur à la partie, envoyer l'état initial
        await self.send_game_state()

        # Confirmer la connexion
        await self.accept()

    async def disconnect(self, close_code):
        # Supprimer le joueur de la partie
        await self.remove_player_from_game()

        # Quitter le groupe du match
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Reçoit un message du client
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'move':
            await self.handle_move(data)
        elif action == 'end_game':
            await self.end_game()

    async def handle_move(self, data):
        # Traitement des mouvements des joueurs (exemple)
        direction = data.get('direction')
        # Mettre à jour l'état du joueur dans le match
        await self.update_player_position(direction)
        # Envoyer une mise à jour à tous les autres joueurs
        await self.send_game_state()

    async def send_game_state(self):
        # Récupérer l'état actuel du jeu (ex: position des joueurs, balle, etc.)
        game_state = await self.get_game_state()
        # Envoi de l'état du jeu à tous les joueurs
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'game_update',
                'game_state': game_state
            }
        )

    async def game_update(self, event):
        # Envoi d'un message de mise à jour du jeu à ce client
        game_state = event['game_state']
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'game_state': game_state
        }))

    # Méthodes utilitaires pour récupérer l'état du match et les joueurs
    async def get_match(self, match_id):
        # Récupérer l'instance de match depuis la base de données
        try:
            match = await database_sync_to_async(Match.objects.get)(id=match_id)
            return match
        except Match.DoesNotExist:
            return None

    async def get_player(self, player_id):
        # Récupérer l'instance du joueur depuis la base de données
        try:
            player = await database_sync_to_async(UserProfile.objects.get)(id=player_id)
            return player
        except UserProfile.DoesNotExist:
            return None

    async def update_player_position(self, direction):
        # Mettre à jour la position du joueur
        player = self.player
        if direction == 'left':
            player.angle -= 0.1  # Exemple de mouvement vers la gauche
        elif direction == 'right':
            player.angle += 0.1  # Exemple de mouvement vers la droite
        # Mettre à jour dans la DB
        await database_sync_to_async(player.save)()

    async def get_game_state(self):
        # Exemple de méthode pour obtenir l'état du jeu actuel
        state = {
            'players': [
                {
                    'id': player.id,
                    'angle': player.angle,
                    'color': player.color,
                }
                for player in self.match.players.all()
            ],
            'ball': {
                'x': self.match.ball_x,
                'y': self.match.ball_y,
                'angle': self.match.ball_angle,
                'speed': self.match.ball_speed,
            }
        }
        return state

    async def remove_player_from_game(self):
        # Retirer le joueur du match
        player = self.player
        self.match.players.remove(player)
        # Mettre à jour la base de données si nécessaire
        await database_sync_to_async(self.match.save)()

    async def end_game(self):
        # Fin de la partie, mettre à jour l'état dans la base de données
        self.match.status = 'ended'
        await database_sync_to_async(self.match.save)()

        # Informer tous les clients que la partie est terminée
        await self.send_game_state()
