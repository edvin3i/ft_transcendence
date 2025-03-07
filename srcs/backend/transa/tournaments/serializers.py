from rest_framework import serializers
from .models import TournamentParticipant, Tournament


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = "__all__"
