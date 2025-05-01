from urllib.parse import urlparse
from rest_framework import serializers
from rest_framework.serializers import ValidationError
from uprofiles.models import User, UserProfile

import logging


logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.

    This serializer converts User model instances to JSON representations and vice versa.
    It includes username, first_name, last_name, email, and password fields.
    Password field is write-only for security purposes.
    """

    email = serializers.EmailField(
        # validators=[UniqueValidator(queryset=User.objects.all())]
    )  # check the email field for unique

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_username(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            if User.objects.exclude(pk=user.pk).filter(username=value).exists():
                raise ValidationError(f"The username '{value}' is already in use.")
        else:
            if User.objects.filter(username=value).exists():
                raise ValidationError(f"The username '{value}' is already in use.")

        return value

    # Add custom create() for pass hashing
    def create(self, validated_data):
        """
        Custom create method to properly hash passwords when creating a User.

        Args:
            validated_data: The validated data from the request

        Returns:
            The created User instance with hashed password
        """
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserProfile model.

    This serializer handles the UserProfile model along with its related User model
    through a nested serializer approach. It includes user, avatar, and bio fields.
    """

    user = UserSerializer()

    avatar_url = serializers.SerializerMethodField()

    total_matches_played = serializers.IntegerField(read_only=True)
    total_wins = serializers.IntegerField(read_only=True)
    total_draws = serializers.IntegerField(read_only=True)
    total_losses = serializers.IntegerField(read_only=True)
    win_rate = serializers.FloatField(read_only=True)
    total_score = serializers.IntegerField(read_only=True)
    average_score = serializers.FloatField(read_only=True)
    match_history = serializers.SerializerMethodField()
    tournament_history = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user",
            "avatar",
            "avatar_url",
            "bio",
            "total_matches_played",
            "total_wins",
            "total_draws",
            "total_losses",
            "win_rate",
            "total_score",
            "average_score",
            "match_history",
            "tournament_history",
            "is_2fa_enabled",
            "totp_secret",
        ]

    def get_object(self):
        return self.request.user.userprofile

    def get_avatar_url(self, obj):
        request = self.context["request"]
        if not obj.avatar:
            return None

        avatar_url = str(obj.avatar.url or "")
        # parsed_url = urlparse(avatar_url)
        # if parsed_url.scheme in ("https",):
        #     logger.info(f"[FRIENDS Serializer]: parsed_url.scheme = {parsed_url.scheme}")
        #     return avatar_url
        return request.build_absolute_uri(avatar_url)

    def get_match_history(self, obj):
        from game.serializers import MatchSerializer

        matches = obj.all_matches
        return MatchSerializer(matches, many=True, context=self.context).data

    def get_tournament_history(self, obj):
        from tournaments.serializers import TournamentSerializer

        tours = obj.all_tournaments
        return TournamentSerializer(tours, many=True, context=self.context).data

    # Add custom create() for nested JSON save
    def create(self, validated_data):
        """
        Custom create method to handle nested User data when creating a UserProfile.

        This method extracts the nested user data, creates a User instance first,
        and then creates the UserProfile with a reference to that User.

        Args:
            validated_data: The validated data from the request

        Returns:
            The created UserProfile instance with associated User
        """
        user_data = validated_data.pop("user")
        user_serializer = UserSerializer()
        user_instance = user_serializer.create(user_data)
        user_profile = UserProfile.objects.create(user=user_instance, **validated_data)

        return user_profile

    def update(self, instance, validated_data):
        """
        Custom update method to handle User data when updating a UserProfile.
        This method updates both the UserProfile fields and the associated User fields.

        Args:
        instance: The existing UserProfile instance being updated.
        validated_data: The validated data from the request.

        Returns:
        The updated UserProfile instance.
        """

        user_data = validated_data.pop("user", None)
        user_instance = instance.user

        if user_data:

            user_instance.username = user_data.get("username", user_instance.username)
            user_instance.first_name = user_data.get(
                "first_name", user_instance.first_name
            )
            user_instance.last_name = user_data.get(
                "last_name", user_instance.last_name
            )
            user_instance.email = user_data.get("email", user_instance.email)

            password = user_data.get("password", None)
            if password:
                user_instance.set_password(password)

            user_instance.save()

        instance.avatar = validated_data.get("avatar", instance.avatar)
        instance.bio = validated_data.get("bio", instance.bio)
        instance.save()

        return instance


class UserSimpleSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = UserProfile
        fields = ("id", "username")
