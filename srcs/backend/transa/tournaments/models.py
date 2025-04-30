from django.db import models
from uprofiles.models import UserProfile


class Tournament(models.Model):
    """
    Tournaments model represents the tournament :)
    """

    name = models.CharField(max_length=32)
    creator = models.ForeignKey(
        UserProfile,
        related_name="tournaments_created",
        null=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="created at")
    max_players = models.PositiveIntegerField(default=4)
    current_players_count = models.PositiveIntegerField(default=0)
    description = models.CharField(max_length=128, blank=True)
    is_started = models.BooleanField(default=False)
    is_finished = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name}. Max players: {self.max_players}. Created at: {self.created_at}"


class TournamentParticipant(models.Model):
    """
    The TournamentParticipant model represents the association
    of a specific player with a tournament.
    """

    player = models.ForeignKey(
        UserProfile, related_name="tournament_participations", on_delete=models.CASCADE
    )
    tournament = models.ForeignKey(
        Tournament, related_name="participants", on_delete=models.CASCADE
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tournament", "player")
