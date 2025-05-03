from rest_framework.authtoken.models import Token

import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

class TournamentConsumer(AsyncWebsocketConsumer):
    tour_id = None
    room_group_name = None

    async def connect(self):

        self.tour_id = int(self.scope["url_route"]["kwargs"]["tour_id"])
        self.room_group_name = f"tour_{self.tour_id}"

        user = self.scope["user"]
        if not getattr(user, "is_authenticated", False):
            logger.warning(f"[TOUR WS] forbidden, user={user}")
            await self.close(code=4003)
            return


        self.room_group_name = f"tour_{self.tour_id}"


        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.info(f"[TOUR WS] user {user} joined group {self.room_group_name}")


        payload = await sync_to_async(self._get_initial_payload)(self.tour_id)
        await self.send(text_data=json.dumps({
            "type":    "init",
            "payload": payload,
        }))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)


    async def match_update(self, event):
        await self.send(text_data=json.dumps({"type": "match_update", "payload": event["payload"]}))

    async def round_finished(self, event):
        await self.send(text_data=json.dumps({"type": "round_finished", "round": event["round"]}))

    async def match_ready(self, event):
        await self.send(text_data=json.dumps({"type": "match_ready", "match_id": event["match_id"],
                                              "room": event["room"]}))

    async def tournament_finished(self, event):
        await self.send(text_data=json.dumps({"type": "tournament_finished", "winner": event["winner"]}))

    async def participant_update(self, event):
        logger.info(f"[WS->CLIENT] participant_update: {event}")
        await self.send(text_data=json.dumps({"type": "participant_update", "player": event["player"]}))

    # --- helpers ---
    @staticmethod
    def _user_from_token(key):
        try:
            return Token.objects.select_related("user").get(key=key).user
        except Token.DoesNotExist:
            return None


    def _get_initial_payload(self, tour_id):
        from tournaments.models import Tournament
        from tournaments.serializers import TournamentSerializer

        tour = Tournament.objects.prefetch_related("matches").get(pk=tour_id)
        return TournamentSerializer(tour, context={}).data