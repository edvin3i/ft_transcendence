from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from tournaments.models import TournamentParticipant
from uprofiles.serializers import UserSimpleSerializer

channel_layer = get_channel_layer()


@receiver(post_save, sender=TournamentParticipant)
def notify_participant_join(sender, instance, created, **kwargs):
    if not created:
        return
    group = f"tour_{instance.tournament_id}"
    payload = UserSimpleSerializer(instance.player).data
    async_to_sync(channel_layer.group_send)(
        group,
        {"type": "participant_update", "player": payload},
    )
