import requests
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from uprofiles.models import User, UserProfile
from transa.settings import (
    OA_CLIENT_ID,
    OA_SECRET,
    OA_REDIR_URL,
    OA_POST_LOUT_REDIR_URL,
    OA_TOKEN_URL,
)


class FortyTwoOpenAuthSerializer(serializers.Serializer):
    code = serializers.CharField(write_only=True)
    client_id = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)

    def validate_code(self, code):
        if not any(OA_CLIENT_ID or OA_SECRET or OA_REDIR_URL):
            raise serializers.ValidationError("OAuth config params was not provided")

        token_url = OA_TOKEN_URL

        data = {
            "client_id": OA_CLIENT_ID,
            "client_secret": OA_SECRET,
            "redirect_uri": OA_REDIR_URL,
            "code": code,
            "grant_type": "autorization_code",
        }

        resp = requests.post(token_url, data=data)

        if resp.status_code != 200:
            raise serializers.ValidationError("Failed exchange the code for token")

        token_info = resp.json()
        access_token = token_info.get("access_token")
        if not access_token:
            raise serializers.ValidationError("No access token returned from 42")

        userinfo_url = "https://api.intra.42.fr/v2/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        resp_user = requests.get(userinfo_url, headers=headers)
        if resp_user.status_code != 200:
            raise serializers.ValidationError("Failed get user data from 42")
        user_data = resp_user.json()

        self.context["42_access_token"] = access_token
        self.context["42_user_data"] = user_data

    def create(self, validated_data):
        user_data = self.context["42_user_data"]
        ft_login = user_data.get("login")
        ft_email = user_data.get("email")
        ft_fname = user_data.get("first_name")
        ft_lname = user_data.get("last_name")
        ft_avatar = user_data.get("image").get("link")

        user, _created = User.objects.get_or_create(
            username=ft_login,
            email=ft_email,
            first_name=ft_fname,
            last_name=ft_lname,
        )

        # If user profile exist - just get it
        user_profile, _created = UserProfile.objects.get_or_create(user=user)
        user_profile.bio = ""
        user_profile.avatar = ft_avatar
        user_profile.save

        refresh = RefreshToken.for_user(user)
        access_jwt = str(refresh.access_token)
        refresh_jwt = str(refresh)

        return {
            "access_token": access_jwt,
            "refresh_token": refresh_jwt,
            "uprofile_id": user_profile.id,
            "username": user_profile.user.username,
        }
