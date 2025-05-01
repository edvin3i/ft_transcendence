from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from game.serializers import MatchSerializer
from game.models import Match


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


class MatchReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        match: Match = get_object_or_404(Match, pk=pk, is_finished=False)
        serializer: MatchSerializer = MatchSerializer(
            match, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        match = serializer.save()

        # chose a winner
        if match.score_p1 is not None and match.score_p2 is not None:
            if match.score_p1 == match.score_p2:
                match.is_draw = True
            else:
                match.winner = (
                    match.player1 if match.score_p1 > match.score_p2 else match.player2
                )
            match.is_finished = True
            match.save()

            # push player to the next match
            next_match = (
                Match.objects.filter(prev_match_1=match).first()
                or Match.objects.filter(prev_match_2=match).first()
            )
            if next_match:
                field = (
                    "player1" if next_match.prev_match_1_id == match.id else "player2"
                )
                setattr(next_match, field, match.winner)
                next_match.save()
        return Response(MatchSerializer(match).data, status=status.HTTP_200_OK)
