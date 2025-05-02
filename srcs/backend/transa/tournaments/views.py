from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError
from tournaments.models import Tournament, TournamentParticipant
from tournaments.serializers import TournamentSerializer
from tournaments.service import generate_tour_bracket


class TournamentsListAPIView(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentDetailAPIView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentCreateAPIView(generics.CreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user.profile)


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
        try:
            with transaction.atomic():
                # block tour for player counting
                tour = Tournament.objects.select_for_update().get(pk=pk, is_started=False)

                if tour.current_players_count >= tour.max_players:
                    return Response(
                        {"detail": "Tournament is full."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # try to create participant; IntegrityError if doublicate
                TournamentParticipant.objects.create(
                    tournament=tour,
                    player=request.user.profile
                )

                tour.current_players_count += 1
                tour.save(update_fields=["current_players_count"])

        except Tournament.DoesNotExist:
            return Response(
                {"detail": "Tournament not found or already started."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            # last registration
            return Response(
                {"detail": "You are already registered."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"detail": "Registered successfully."},
            status=status.HTTP_201_CREATED,
        )


class TournamentStartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tour = get_object_or_404(Tournament, pk=pk)
        if tour.creator.user_id != request.user.id and not request.user.is_staff:
            return Response(
                {"detail": "Only creator has permission to start tournament."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if tour.current_players_count != tour.max_players:
            return Response(
                {"detail": (
                    f"To start tournament you need {tour.max_players} "
                    f"but you have {tour.current_players_count} right now."
                )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            generate_tour_bracket(tour)
        except ValidationError as e:
            return Response(
                {"detail": f"{str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"detail": "Tournament is running."},
            status=status.HTTP_200_OK,
        )
