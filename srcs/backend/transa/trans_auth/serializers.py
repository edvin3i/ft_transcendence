from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from uprofiles.models import User, UserProfile
from transa.settings import (
    OA_CLIENT_ID,
    OA_SECRET,
    OA_REDIR_URLS,
    OA_POST_LOUT_REDIR_URLS
)


class FortyTwoAuthSerializer(serializers.Serializer):
    code = serializers.CharField(write_only=True)
    client_id = serializers.CharField(read_only=True)
    secret_key = serializers.CharField(read_only=True)
    redir_url = serializers.CharField(read_only=True)
