import urllib.request
import requests
from django.db import models
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from rest_framework.authtoken.models import Token
from PIL import Image


class UserProfile(models.Model):
    """
    The UserProfile model extends the base Django User model with additional information.

    This model maintains a one-to-one relationship with the Django User model and
    adds profile-specific fields such as avatar and bio. When a User is deleted,
    the associated UserProfile is also deleted (CASCADE).

    Attributes:
        user: One-to-one relationship with Django's User model
        avatar: Profile picture, automatically resized to 300x300 pixels
        bio: Short description of the user (optional)
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE
    )  # Delete profile when user is deleted
    ft_id = models.CharField(max_length=255, unique=True, null=True,  blank=True)
    avatar = models.ImageField(default="default.jpg", upload_to="avatars")
    avatar_url = models.URLField(null=True, blank=True)
    bio = models.CharField(max_length=300, blank=True)


    # TOTP support
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=128, default=None, null=True, blank=True)

    def __str__(self):
        """
        Returns a string representation of the UserProfile.

        Returns:
            str: A string in the format "{username} Profile"
        """
        return f"{self.user.username} Profile"

    def save(self, *args, **kwargs):
        """
        Overrides the default save method to resize the avatar image.

        This method first calls the parent class's save method to save the
        UserProfile, then opens the saved avatar image and resizes it to a
        maximum of 300x300 pixels if it exceeds those dimensions.

        Args:
            *args: Variable length argument list passed to parent's save method
            **kwargs: Arbitrary keyword arguments passed to parent's save
        """
        super().save(*args, **kwargs)

        # if we have the link to user pic on 42 and default avatar -> set the user pic from 42
        if self.avatar_url and self.avatar.file.name == "default.jpg":
            r = requests.get(self.avatar_url)
            if r.status_code == 200:
                file_name = f"avatar_{self.user.username}.jpg"
                self.avatar.save(file_name, ContentFile(r.content), save=False)

        try:
            img = Image.open(self.avatar.path)

            # resize img
            if img.height > 300 or img.width > 300:
                output_size = (300, 300)
                img.thumbnail(output_size)
                img.save(self.avatar.path)
        except Exception as e:
            print(e)  # temporary
