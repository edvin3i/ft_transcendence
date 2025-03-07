from django.urls import path
from . import views


urlpatterns = [
    path("all/", views.UsersProfilesListAPIView.as_view(), name="list_of_users"),
    path(
        "create/", views.UserProfileCreateAPIView.as_view(), name="add_new_user_profile"
    ),
    path(
        "update/<pk>/",
        views.UserProfileUpdateAPIView.as_view(),
        name="update_user_profile",
    ),
    path(
        "delete/<pk>/",
        views.UserProfileDestroyAPIView.as_view(),
        name="delete_user_profile",
    ),
]
