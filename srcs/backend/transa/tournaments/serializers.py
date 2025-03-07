from rest_framework import serializers
from .models import TournamentParticipant, Tournament


class TournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tournament model.

    This serializer converts Tournament model instances to JSON representations and vice versa.
    It includes all fields from the Tournament model.
    """

    class Meta:
        model = Tournament
        fields = "__all__"
