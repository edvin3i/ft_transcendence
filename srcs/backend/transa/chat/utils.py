from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from friends.models import Friendship
import redis # for sync client

redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)


@database_sync_to_async
def friendship_action(me, target_username, action):
    user = get_user_model()
    target_username = user.objects.get(username=target_username)

    if action == "add":
        Friendship.objects.get_or_create(
            from_user=me,
            to_user=target_username,
            defaults={"status": "pending"},
        )
    elif action == "accept":
        Friendship.objects.filter(
            from_user=target_username,
            to_user=me,
            status="pending",
        ).update(status="accepted")
    elif action == "reject":
        Friendship.objects.filter(
            from_user=target_username,
            to_user=me,
            status="pending",
        ).update(status="rejected")
    elif action == "block":
        Friendship.objects.update_or_create(
            from_user=me,
            to_user=target_username,
            defaults={"status": "blocked"},
        )
    elif action == "unblock":
        Friendship.objects.filter(
            from_user=me,
            to_user=target_username,
            status="blocked",
        ).delete()


@database_sync_to_async
def is_blocked(from_user, sender_username):
    """
    Checking the user is blocked
    reurns True or False
    """
    user = get_user_model()
    try:
        sender = user.objects.get(username=sender_username)
    except user.DoesNotExist:
        return False

    return Friendship.objects.filter(
        from_user=from_user, to_user=sender, status="blocked"
    ).exists()


@database_sync_to_async
def are_friends(user1, user2_name):
    """
    Checking the users are friends
    reurns True or False
    """
    user = get_user_model()
    try:
        user2 = user.objects.get(username=user2_name)
    except user.DoesNotExist:
        return False

    return (
        Friendship.objects.filter(
            from_user=user1, to_user=user2, status="accepted"
        ).exists()
        or Friendship.objects.filter(
            from_user=user2, to_user=user1, status="accepted"
        ).exists()
    )

def is_online(user_id):
    return redis_client.exists(f"user_online:{user_id}") == 0