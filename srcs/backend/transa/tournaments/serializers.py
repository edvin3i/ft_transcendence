from rest_framework import serializers
from .models import TournamentParticipant, Tournament


class TournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tournament model.

    This serializer converts Tournament model instances to JSON representations and vice versa.
    It includes all fields from the Tournament model.
    """
    creator = serializers.PrimaryKeyRelatedField(read_only=True)
    current_players_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tournament
        fields = "__all__"
