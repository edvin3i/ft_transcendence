from django.urls import path
from . import views


urlpatterns = [
    path("all", views.MatchesListAPIView, name="list_of_matches"),
]
