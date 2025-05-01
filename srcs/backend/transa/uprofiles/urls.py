from django.urls import path
from . import views


urlpatterns = [
    path(
        "all/",
        views.UsersProfilesListAPIView.as_view(),
        name="users_list",
    ),
    path(
        "create/",
        views.UserProfileCreateAPIView.as_view(),
        name="user_create",
    ),
    path(
        "me/update/",
        views.UserProfileUpdateAPIView.as_view(),
        name="user_update",
    ),
    path(
        "me/delete/",
        views.UserProfileDestroyAPIView.as_view(),
        name="user_delete",
    ),
    path(
        "profile/<int:user_id>/",
        views.UserSelfProfileAPIView.as_view(),
        name="user_detail_profile",
    ),
    path(
        "profile/me/",
        views.UserProfileSelfAPIView.as_view(),
        name="me",
    ),
]
