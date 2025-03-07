from django.shortcuts import render
from rest_framework import generics
from .models import Match
from .serializers import MatchSerializer


class MatchesListAPIView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
