from uprofiles.models import UserProfile
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user_profile(user_id):
    return UserProfile.objects.select_related("user").get(user__id=user_id)
