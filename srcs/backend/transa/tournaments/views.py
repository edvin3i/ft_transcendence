from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
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
        tour: Tournament = get_object_or_404(Tournament, pk=pk, is_started=False)
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

class TournamentStartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tour: Tournament = get_object_or_404(Tournament, pk=pk)
        if tour.creator_id != request.user.id and not request.user.is_staff:
            return Response(
                {'detail': "Only creator has permission to start tournament."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            generate_tour_bracket(tour)
        except ValidationError as e:
            return Response(
                {'detail': f"{str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {'detail': "Tournament is running."},
            status=status.HTTP_200_OK,
        )

class TournamentMatchReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        match: Match = get_object_or_404(Match, pk=pk, is_finished=False)
        serializer: MatchSerializer = MatchSerializer(
            match, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        match = serializer.save()

        # chose a winner
        if match.score_p1 is not None and match.score_p2 is not None:
            if match.score_p1 == match.score_p2:
                match.is_draw = True
            else:
                match.winner = match.player1 if match.score_p1 > match.score_p2 else match.player2
            match.is_finished = True
            match.save()

            # push player to the next match
            next_match = Match.objects.filter(
                prev_match_1=match
            ).first() or Match.objects.filter(prev_match_2=match).first()
            if next_match:
                field = 'player1' if next_match.prev_match_1_id == match.id else 'player2'
                setattr(next_match, field, match.winner)
                next_match.save()
        return Response(
            MatchSerializer(match).data, status=status.HTTP_200_OK
        )