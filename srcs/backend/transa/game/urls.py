from django.urls import path
from . import views


urlpatterns = [
    path("all", views.MatchesListAPIView.as_view(), name="list_of_matches"),
]
