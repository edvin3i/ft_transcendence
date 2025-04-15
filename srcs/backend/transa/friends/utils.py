from .models import Friendship
from uprofiles.models import UserProfile


def get_all_friends(user):
    sent = Friendship.objects.filter(from_user=user, status="accepted").values_list(
        "to_user", flat=True
    )
    received = Friendship.objects.filter(to_user=user, status="accepted").values_list(
        "from_user", flat=True
    )
    friends_ids = set(sent) | set(received)
    return UserProfile.objects.filter(user__id__in=friends_ids)
