from rest_framework import generics, permissions
from .models import Tournament
from .serializers import TournamentSerializer


class TournamentsListAPIView(generics.ListAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


class TournamentDetailAPIView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    # permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user.profile)


class TournamentCreateAPIView(generics.CreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


class TournamentDeleteAPIView(generics.DestroyAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


class TournamentUpdateAPIView(generics.UpdateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
