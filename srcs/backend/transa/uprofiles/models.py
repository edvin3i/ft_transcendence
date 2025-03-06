from django.db import models
from django.contrib.auth.models import User
from PIL import Image


class UserProfile(models.Model):
    """
    User Profile Model class represents the user account
    nd inherits base Django User model
    """
    user = models.OneToOneField(
        User, on_delete=models.CASCADE
    )  # Delete profile when user is deleted
    avatar = models.ImageField(default="default.jpg", upload_to="avatars")
    bio = models.CharField(max_length=300, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        img = Image.open(self.avatar.path)

        # resize img
        if img.height > 300 or img.width > 300:
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.avatar.path)
