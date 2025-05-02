from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Match
from .serializers import MatchSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .consumers import GameConsumer

class MatchesListAPIView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]


class MatchDetailAPIView(generics.RetrieveAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]


class MatchCreateAPIView(generics.CreateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]


class MatchUpdateAPIView(generics.UpdateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, args, kwargs)


class MatchDeleteAPIView(generics.DestroyAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAdminUser]


class OpenRoomsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        open_rooms = []
        for room_name, room in GameConsumer.rooms.items():
            players = room.get("players", {})
            if len(players) < 2:
                open_rooms.append({
                    "name": room_name,
                    "players": len(players),
                })
        return Response(open_rooms)
