from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_list_or_404
from tournaments.models import Tournament, TournamentParticipant
from tournaments.serializers import TournamentSerializer
from tournaments.service import generate_tour_bracket
from game.serializers import MatchSerializer
from game.models import Match


class TournamentsListAPIView(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentDetailAPIView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user.profile)


class TournamentCreateAPIView(generics.CreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentDeleteAPIView(generics.DestroyAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAdminUser]


class TournamentUpdateAPIView(generics.UpdateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentJoinAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tour: Tournament = get_list_or_404(Tournament, pk=pk, is_started=False)
        if tour.current_players_count >= tour.max_players:
            return Response(
                {'detail': "Tournament is full."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, created = TournamentParticipant.objects.get_or_create(
            tournament=tour, player=request.user.profile
        )

        if not created:
            return Response(
                {'detail': "You are registered already."},
                status=status.HTTP_200_OK,
            )
        tour.current_players_count += 1
        tour.save(update_fields=['current_players_count'])
        return Response(
                {'detail': "You are rigistered succefully!"},
                status=status.HTTP_201_CREATED,
            )