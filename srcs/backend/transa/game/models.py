from django.db import models
from uprofiles.models import UserProfile
from tournaments.models import Tournament


class Match(models.Model):
    """
    The Match model represents a game match between two players.
    It can be a standalone match (tournament=None) or part of a tournament.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    player1 = models.ForeignKey(
        UserProfile, related_name="matches_as_p1", on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        UserProfile, related_name="matches_as_p2", on_delete=models.CASCADE
    )
    score_p1 = models.PositiveIntegerField(default=0)
    score_p2 = models.PositiveIntegerField(default=0)
    tournament = models.ForeignKey(
        Tournament,
        related_name="matches",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    winner = models.ForeignKey(
        UserProfile,
        related_name="matches_won",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    round_number = models.PositiveIntegerField(default=1)
    is_finished = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.created_at} | {self.player1} vs {self.player2}, winner: {self.winner}"
