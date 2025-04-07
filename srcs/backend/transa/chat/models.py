from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.CharField(max_length=100)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.user.username} > {self.room}: {self.content}"


class UserBlock(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocker")
    blocked_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blocked")

    class Meta:
        unique_together = ("user", "blocked_user")

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"
