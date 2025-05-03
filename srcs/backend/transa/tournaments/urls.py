from django.urls import path
from . import views


urlpatterns = [
    path(
        "all",
        views.TournamentsListAPIView.as_view(),
        name="tournaments_list",
    ),
    path(
        "details/<int:pk>/",
        views.TournamentDetailAPIView.as_view(),
        name="tournament_details",
    ),
    path(
        "create",
        views.TournamentCreateAPIView.as_view(),
        name="tournament_create",
    ),
    path(
        "update/<int:pk>/",
        views.TournamentUpdateAPIView.as_view(),
        name="tournament_update",
    ),
    path(
        "delete/<int:pk>/",
        views.TournamentDeleteAPIView.as_view(),
        name="tournament_delete",
    ),
    path(
        "join/<int:pk>/", views.TournamentJoinAPIView.as_view(), name="tournament_join"
    ),
    path(
        "start/<int:pk>/",
        views.TournamentStartAPIView.as_view(),
        name="tournament_start",
    ),
]
