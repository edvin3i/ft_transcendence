from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from friends.models import Friendship
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model

import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class FriendsRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ["to_user"]

    def validate_to_user(self, to_user):
        user = self.context["request"].user

        if to_user.pk == user.pk:
            raise ValidationError(
                "You are can't add yourself to friends"
            )  # ty sam sebe pizdaty drug already
        if Friendship.objects.filter(
            Q(from_user=user, to_user=to_user, status="accepted")
            | Q(from_user=to_user, to_user=user, status="accepted")
        ).exists():
            raise ValidationError("You are friends already!")
        if Friendship.objects.filter(
            from_user=user, to_user=to_user, status="pending"
        ).exists():
            raise ValidationError("Request is sent already!")
        return to_user

    # def validate_to_user(self, to_user):
    #     request = self.context["request"]
    #     if to_user == request.user:
    #         raise ValidationError(
    #             "You are can't add yourself to friends"
    #         )  # ty sam sebe pizdaty drug already
    #     friendship_exists = (
    #         Friendship.objects.filter(
    #             Q(from_user=request.user, to_user=to_user)
    #             | Q(from_user=to_user, to_user=request.user)
    #         )
    #         .exclude(status="rejected")
    #         .exists()
    #     )
    #     if friendship_exists:
    #         raise ValidationError("You are friends already!")
    #     return to_user

    def create(self, validated_data):
        request = self.context["request"]
        from_user = request.user
        to_user = validated_data["to_user"]
        with transaction.atomic():
            try:
                mirror = Friendship.objects.select_for_update().get(
                    from_user=to_user,
                    to_user=from_user,
                    status="pending",
                )
                logger.info(f"SERIALIZER: mirror = {mirror}")

            except Friendship.DoesNotExist:
                logger.info(f"SERIALIZER: Friendship does not exist")

                return Friendship.objects.create(
                    from_user=from_user,
                    to_user=to_user,
                    status="pending",
                )

            mirror.status = "accepted"
            mirror.save(update_fields=["status"])

            # friendship, created = Friendship.objects.get_or_create(
            #     from_user=from_user,
            #     to_user=to_user,
            #     defaults={"status": "accepted"},
            # )
            # if not created and friendship.status != "accepted":
            #     friendship.status = "accepted"
            #     friendship.save(update_fields=["status"])

            # return mirror


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
            "from_user_username",
            "to_user",
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

class FriendsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']
