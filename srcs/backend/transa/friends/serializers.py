from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from friends.models import Friendship
from django.db.models import Q
from django.db import IntegrityError


class FriendsRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ("to_user",)

        def validate_to_user(self, to_user):
            request = self.context["request"]
            if to_user == request.user:
                raise ValidationError(
                    "You are can't add yourself to friends"
                )  # ty sam sebe pizdaty drug already

            friendship_exists = Friendship.objects.filter(
                (
                    Q(from_user=request.user, to_user=to_user)
                    | Q(from_user=to_user, to_user=request.user)
                )
                & ~Q(status="rejected")
            ).exist()
            if friendship_exists:
                raise ValidationError("You are friends already!")
            return to_user

        def create(self, validated_data):
            request = self.context["request"]
            try:
                return Friendship.objects.create(
                    from_user=request.user,
                    to_user=validated_data["to_user"],
                    status="pending",
                )
            except IntegrityError:
                raise ValidationError("Request is present already")


class FriendshipSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(
        source="from_user.username", read_only=True
    )
    to_user_username = serializers.CharField(source="to_user.username", read_only=True)

    class Meta:
        model = Friendship
        fields = (
            "id",
            "from_user",
            "from_user_username" "to_user",
            "to_user_username",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "from_user",
            "from_user_username",
            "status",
            "created_at",
            "updated_at",
        )
