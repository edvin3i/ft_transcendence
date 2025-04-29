from django.db import models
from django.contrib.auth.models import User

# class MoshpitMatch(models.Model):
#     player1 = models.ForeignKey(User, related_name='moshpit_player1', on_delete=models.CASCADE)
#     player2 = models.ForeignKey(User, related_name='moshpit_player2', on_delete=models.CASCADE)
#     player3 = models.ForeignKey(User, related_name='moshpit_player3', null=True, blank=True, on_delete=models.CASCADE)
#     player4 = models.ForeignKey(User, related_name='moshpit_player4', null=True, blank=True, on_delete=models.CASCADE)
#     status = models.CharField(max_length=20, choices=[('active', 'Active'), ('finished', 'Finished')], default='active')
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     def __str__(self):
#         return f"Moshpit Match {self.id} - Status: {self.status}"
