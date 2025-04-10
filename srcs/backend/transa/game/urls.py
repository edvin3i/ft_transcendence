from django.urls import path
from . import views


urlpatterns = [
    path(
        "all",
        views.MatchesListAPIView.as_view(),
        name="games_list",
    ),
    path(
        "details/<int:pk>/",
        views.MatchDetailAPIView.as_view(),
        name="game_details",
    ),
    path(
        "create/",
        views.MatchCreateAPIView.as_view(),
        name="game_create",
    ),
    path(
        "update/<int:pk>/",
        views.MatchUpdateAPIView.as_view(),
        name="game_update",
    ),
    path(
        "delete/<int:pk>/",
        views.MatchDeleteAPIView.as_view(),
        name="game_delete",
    ),
]
