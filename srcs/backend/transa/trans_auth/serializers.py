import requests
import io, pyotp, qrcode, base64
from trans_auth.utils import get_unique_name
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from uprofiles.models import User, UserProfile
from transa.settings import (
    OA_CLIENT_ID,
    OA_SECRET,
    OA_REDIR_URL,
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
            "grant_type": "authorization_code",
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
        ft_id = str(user_data.get("id"))
        ft_login = user_data.get("login")
        ft_email = user_data.get("email")
        ft_fname = user_data.get("first_name")
        ft_lname = user_data.get("last_name")
        ft_avatar_url = user_data.get("image").get("link")
        #
        # user, _created = User.objects.get_or_create(
        #     username=ft_login,
        #     email=ft_email,
        #     first_name=ft_fname,
        #     last_name=ft_lname,
        # )

        # If user profile exist - just get it
        # user_profile, _created = UserProfile.objects.get_or_create(user=user)
        # user_profile.bio = ""
        # user_profile.avatar_url = ft_avatar_url
        # user_profile.save()

        try:
            user_profile = UserProfile.objects.select_related("user").get(ft_id=ft_id)
            user = user_profile.user
        except UserProfile.DoesNotExist:
            user = User.objects.create_user(
                username=get_unique_name(ft_login),
                email=ft_email,
                first_name=ft_fname,
                last_name=ft_lname,
            )
            user_profile = UserProfile.objects.create(
                user=user,
                ft_id=ft_id,
                avatar_url=ft_avatar_url,
                bio="",
            )

        user.email = ft_email if not user.email else user.email
        user.first_name = ft_fname
        user.last_name = ft_lname
        user.save()

        user_profile.avatar_url = ft_avatar_url
        user_profile.save()

        refresh = RefreshToken.for_user(user)
        access_jwt = str(refresh.access_token)
        refresh_jwt = str(refresh)

        return {
            "access": access_jwt,
            "refresh": refresh_jwt,
            "uprofile_id": user_profile.id,
            "username": user_profile.user.username,
            "user_avatar_url": user_profile.avatar_url,
            "user_avatar": user_profile.avatar.path if user_profile.avatar else None,
        }


class TwoFactorAuthSetupSerializer(serializers.Serializer):
    def create(self, validated_data):
        current_user = self.context["request"].user

        try:
            profile = UserProfile.objects.get(user=current_user)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found")

        new_secret = pyotp.random_base32()
        profile.totp_secret = new_secret
        profile.save()

        # Generate QR-code and transfer in response in base64
        qrcode_secret = qrcode.make(
            f"otpauth://totp/transCendenZ:{profile.user.username}?secret={new_secret}",
        )
        buffer = io.BytesIO()
        qrcode_secret.save(buffer, format="PNG")
        buffer.seek(0)

        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "detail": "TOTP secret generated, 2FA pending confirmation",
            "secret": new_secret,
            "qrcode": qr_base64,
        }


class TwoFactorAuthConfirmSerializer(serializers.Serializer):
    totp_code = serializers.CharField(write_only=True)

    def validate_totp_code(self, totp_code):
        current_user = self.context["request"].user

        try:
            profile = UserProfile.objects.get(user=current_user)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found")

        if not profile.totp_secret:
            raise serializers.ValidationError("TOTP is not configured for this user")

        totp = pyotp.TOTP(profile.totp_secret)
        if not totp.verify(totp_code):
            raise serializers.ValidationError("Invalid TOTP code")

        return totp_code

    def create(self, validated_data):
        current_user = self.context["request"].user
        profile = UserProfile.objects.get(user=current_user)

        profile.is_2fa_enabled = True
        profile.save()

        return {
            "detail": "2FA enabled successfully",
        }


class TwoFactorAuthDisableSerializer(serializers.Serializer):
    totp_code = serializers.CharField(write_only=True)

    def validate_totp_code(self, totp_code):
        current_user = self.context["request"].user

        try:
            profile = UserProfile.objects.get(user=current_user)
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("User profile not found")

        if not profile.is_2fa_enabled:
            raise serializers.ValidationError("2FA is not enabled for this user")

        if not profile.totp_secret:
            raise serializers.ValidationError("TOTP is not enabled for this user")

        totp = pyotp.TOTP(profile.totp_secret)
        if not totp.verify(totp_code):
            raise serializers.ValidationError("Invalid TOTP code")

        return totp_code

    def create(self, validated_data):
        current_user = self.context["request"].user
        profile = UserProfile.objects.get(user=current_user)

        profile.is_2fa_enabled = False
        profile.totp_secret = None
        profile.save()

        return {
            "detail": "2FA disabled successfully",
        }
