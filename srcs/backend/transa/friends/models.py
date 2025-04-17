from django.db import models
from uprofiles.models import UserProfile, User


class Friendship(models.Model):
    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendship_sent"
    )
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friendship_received"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("rejected", "Rejected"),
            ("blocked", "Blocked"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("from_user", "to_user")
