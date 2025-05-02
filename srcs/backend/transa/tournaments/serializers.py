from rest_framework import serializers
from rest_framework.serializers import ValidationError
from .models import TournamentParticipant, Tournament
from uprofiles.serializers import UserProfileSerializer
from game.serializers import MatchSerializer


class TournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tournament model.

    This serializer converts Tournament model instances to JSON representations and vice versa.
    It includes all fields from the Tournament model.
    """

    # creator = serializers.PrimaryKeyRelatedField(read_only=True) # just ID of user
    creator = UserProfileSerializer(read_only=True)  # full data of user profile
    current_players_count = serializers.IntegerField(read_only=True)
    max_players = serializers.IntegerField(min_value=2)
    participants = UserProfileSerializer(
        source="participants__player", many=True, read_only=True
    )
    matches = MatchSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = "__all__"
        read_only_fields = [
            'id', 'creator', 'created_at', 'current_players_count',
            'is_started', 'is_finished',
        ]

    def validate_max_players(self, value):
        if value & (value - 1) != 0:
            raise ValidationError("Max users count must be power of 2")
        return value
