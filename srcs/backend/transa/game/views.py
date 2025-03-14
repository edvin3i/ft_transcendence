from rest_framework import generics
from .models import Match
from .serializers import MatchSerializer


class MatchesListAPIView(generics.ListAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer


class MatchDetailAPIView(generics.RetrieveAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer


class MatchCreateAPIView(generics.CreateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer


class MatchUpdateAPIView(generics.UpdateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, args, kwargs)


class MatchDeleteAPIView(generics.DestroyAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
