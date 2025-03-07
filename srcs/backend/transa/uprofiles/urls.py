from django.urls import path
from . import views


urlpatterns = [
    path("all", views.UsersProfilesListAPIView, name="list_of_users"),
]
