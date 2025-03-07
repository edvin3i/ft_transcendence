from django.shortcuts import render
from rest_framework import generics
from .models import Tournament
from .serializers import TournamentSerializer


class TournamentsListAPIView(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
