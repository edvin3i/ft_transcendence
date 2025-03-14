from rest_framework import serializers
from .models import TournamentParticipant, Tournament
from uprofiles.serializers import UserProfileSerializer


class TournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tournament model.

    This serializer converts Tournament model instances to JSON representations and vice versa.
    It includes all fields from the Tournament model.
    """

    # creator = serializers.PrimaryKeyRelatedField(read_only=True) # just ID of user
    creator = UserProfileSerializer(read_only=True)  # full data of user profile
    current_players_count = serializers.IntegerField(read_only=True)
    max_players = serializers.IntegerField(min_value=4)

    class Meta:
        model = Tournament
        fields = "__all__"
