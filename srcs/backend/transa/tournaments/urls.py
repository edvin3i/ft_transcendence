from django.urls import path
from . import views


urlpatterns = [
    path("all", views.TournamentsListAPIView.as_view(), name="tournaments_list"),
    path(
        "detail/<int:pk>",
        views.TournamentDetailAPIView.as_view(),
        name="tournament_details",
    ),
    path("create", views.TournamentCreateAPIView.as_view(), name="tournament_create"),
    path(
        "delete/<int:pk>",
        views.TournamentDeleteAPIView.as_view(),
        name="tournament_delete",
    ),
    path(
        "update/<int:pk>",
        views.TournamentUpdateAPIView.as_view(),
        name="tournament_update",
    ),
]
