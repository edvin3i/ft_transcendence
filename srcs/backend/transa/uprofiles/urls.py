from django.urls import path
from . import views


urlpatterns = [
    path("all", views.UsersProfilesListAPIView.as_view(), name="list_of_users"),
]
