from uprofiles.models import UserProfile
from game.models import Match
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model


@database_sync_to_async
def get_user_profile(user_id):
    return UserProfile.objects.get(user__id=user_id)

@database_sync_to_async
def create_match(player_1, player_2):
    return Match.objects.create(player_1, player_2)

@database_sync_to_async
def finish_match(match, score_p1, score_p2, winner_id):
    match.score_p1 = score_p1
    match.score_p2 = score_p2
    match.winner_id = winner_id
    match.is_finished = True
    match.save()