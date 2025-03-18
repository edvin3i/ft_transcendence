from rest_framework import request
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from uprofiles.models import User, UserProfile
from transa.settings import (
    OA_CLIENT_ID,
    OA_SECRET,
    OA_REDIR_URL,
    OA_POST_LOUT_REDIR_URLS,
    OA_TOKEN_URL
)


class FortyTwoAuthSerializer(serializers.Serializer):
    code = serializers.CharField(write_only=True)
    client_id = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)

    def validate_code(self, request):
        if not any(OA_CLIENT_ID or OA_SECRET or OA_REDIR_URL):
            raise serializers.ValidationError("Client ID or Secret was not provided")




