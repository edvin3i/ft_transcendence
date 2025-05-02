from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from game.models import Match
from game.serializers import MatchSerializer

import logging

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()


@receiver(post_save, sender=Match)
def push_tournament_events(sender, instance: Match, created, **kwargs):
    if instance.tournament_id is None:
        return

    group = f"tour_{instance.tournament_id}"

    logger.info(
        f"[SIGNAL] Sending participant_update to tour_{instance.tournament_id}")

    async_to_sync(channel_layer.group_send)(
        group,
        {
            "type": "match_update",
            "payload": MatchSerializer(instance).data,
        },
    )

    if instance.player1_id and instance.player2_id and not instance.is_finished:
        room_name = f"tour_{instance.tournament_id}_m{instance.id}"
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "match_ready",
                "match_id": instance.id,
                "room": room_name,
            },
        )

    _check_round_completion(instance)

    _check_tournament_completion(instance)


def _check_round_completion(match: Match):
    qs = Match.objects.filter(
        tournament_id=match.tournament_id,
        round_number=match.round_number,
    )
    if qs.filter(is_finished=False).exists():
        return
    async_to_sync(channel_layer.group_send)(
        f"tour_{match.tournament_id}",
        {
            "type": "round_finished",
            "round": match.round_number,
        },
    )


def _check_tournament_completion(match: Match):
    qs = Match.objects.filter(tournament_id=match.tournament_id)
    if qs.filter(is_finished=False).exists():
        return
    final = qs.order_by("-round_number").first()
    winner_username = final.winner.user.username if final and final.winner else None
    async_to_sync(channel_layer.group_send)(
        f"tour_{match.tournament_id}",
        {
            "type": "tournament_finished",
            "winner": winner_username,
        },
    )
