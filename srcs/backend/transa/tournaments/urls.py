from django.urls import path
from . import views


urlpatterns = [
    path("all", views.TournamentsListAPIView.as_view(), name="list_of_tournaments"),
]
