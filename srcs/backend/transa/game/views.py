from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Match
from .serializers import MatchSerializer


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
