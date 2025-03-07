from django.urls import path
from . import views


urlpatterns = [
    path("all", views.TournamentsListAPIView, name="list_of_tournaments"),
]
