from rest_framework import serializers
from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    """
    Serializer for the Match model.

    This serializer converts Match model instances to JSON representations and vice versa.
    It includes all fields from the Match model.
    """

    class Meta:
        model = Match
        fields = "__all__"
