from rest_framework import serializers
from .models import Match
from uprofiles.models import UserProfile
from uprofiles.serializers import UserSimpleSerializer


class MatchSerializer(serializers.ModelSerializer):
    """
    Serializer for the Match model.

    This serializer converts Match model instances to JSON representations and vice versa.
    It includes all fields from the Match model.
    """

    player1 = UserSimpleSerializer(read_only=True)
    player2 = UserSimpleSerializer(read_only=True)
    winner = UserSimpleSerializer(read_only=True)

    player1_id = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(), write_only=True, source="player1"
    )

    player2_id = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(), write_only=True, source="player2"
    )

    class Meta:
        model = Match
        fields = "__all__"

    read_only_fields = ["winner", "is_finished", "prev_match_1", "prev_match_2"]

    def validate(self, data):
        if data.get("player1") == data.get("player2"):
            raise serializers.ValidationError("Game must have different players.")
        return data
