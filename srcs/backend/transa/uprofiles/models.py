import requests
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from rest_framework.authtoken.models import Token
from PIL import Image
from django.apps import apps


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
    ft_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    avatar = models.ImageField(default="default.jpg", upload_to="avatars")
    avatar_url = models.URLField(null=True, blank=True)
    bio = models.CharField(max_length=300, blank=True)

    # tournaments_joined = models.ManyToManyField(
    #     "tournaments.Tournament",
    #     through='tournaments.TournamentParticipant',
    #     related_name="joined_users",
    #     blank=True,
    # )

    @property
    def all_matches(self):
        Match = apps.get_model("game", "Match")
        return Match.objects.filter(
            Q(player1=self) | Q(player2=self),
        ).order_by("-created_at")

    @property
    def all_tournaments(self):
        Tournament = apps.get_model("tournaments", "Tournament")
        return Tournament.objects.filter(Q(participants__player=self)).order_by(
            "-created_at"
        )
        # return self.tournaments_joined.order_by("-created_at")

    @property
    def tournaments_won(self):
        Tournament = apps.get_model("tournaments", "Tournament")
        return Tournament.objects.filter(winner=self)

    def get_tournament_stats(self, tournament):
        TournamentParticipant = apps.get_model("tournaments", "TournamentParticipant")
        try:
            participant = self.tournament_participations.get(tournament=tournament)
            matches = self.all_matches.filter(tournament=tournament)
            wins = matches.filter(winner=self).count()
            draws = (
                matches.filter(is_draw=True)
                .filter(Q(player1=self) | Q(player2=self))
                .count()
            )
            losses = matches.count() - wins - draws

            return {
                "joined_at": participant.joined_at,
                "wins": wins,
                "draws": draws,
                "losses": losses,
                "matches_played": matches.count(),
            }
        except TournamentParticipant.DoesNotExist:
            return None

    @property
    def total_matches_played(self):
        return self.all_matches.count()

    @property
    def total_draws(self):
        Match = apps.get_model("game", "Match")
        return Match.objects.filter(
            Q(player1=self) | Q(player2=self), is_draw=True
        ).count()

    @property
    def total_wins(self):
        Match = apps.get_model("game", "Match")
        return Match.objects.filter(Q(winner=self)).count()

    @property
    def total_losses(self):
        return self.total_matches_played - self.total_wins - self.total_draws

    @property
    def win_rate(self):
        total = self.total_matches_played
        if total == 0:
            return 0
        return round((self.total_wins / total) * 100, 2)

    @property
    def total_score(self):
        Match = apps.get_model("game", "Match")
        matches_as_p1 = (
            Match.objects.filter(player1=self).aggregate(total=models.Sum("score_p1"))[
                "total"
            ]
            or 0
        )
        matches_as_p2 = (
            Match.objects.filter(player2=self).aggregate(total=models.Sum("score_p2"))[
                "total"
            ]
            or 0
        )
        return matches_as_p1 + matches_as_p2

    @property
    def average_score(self):
        total_matches = self.total_matches_played
        if total_matches == 0:
            return 0
        return round(self.total_score / total_matches, 2)

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
        if self.avatar_url and self.avatar.name == "default.jpg":
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
