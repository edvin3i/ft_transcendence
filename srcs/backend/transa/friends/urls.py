from django.urls import path
from . import views


urlpatterns = [
    path(
        "request/<int:pk>/",
        views.FriendsCreateRequestAPIView.as_view(),
        name="friends_request",
    ),
    path(
        "delete/<int:pk>/", views.FriendsDeleteAPIView.as_view(), name="friends_delete"
    ),
    path(
        "request/<int:pk>/accept/",
        views.FriendsRequestAcceptAPIView.as_view(),
        name="friends_request_accept",
    ),
    path(
        "request/<int:pk>/reject/",
        views.FriendsRequestRejectAPIView.as_view(),
        name="friends_request_reject",
    ),
    path("<int:pk>/block/", views.FriendsBlockAPIView.as_view(), name="friends_block"),
    path(
        "<int:pk>/unblock/",
        views.FriendsUnblockAPIView.as_view(),
        name="friends_unblock",
    ),
    path(
        "requests/incoming/",
        views.FriendRequestsIncomingListAPIView.as_view(),
        name="friends_requests_incoming",
    ),
    path(
        "requests/outgoing/",
        views.FriendRequestsOutgoingListAPIView.as_view(),
        name="friends_requests_outgoing",
    ),
    path(
        "all",
        views.FriendsAllListAPIView.as_view(),
        name="friends_all",
    ),
    path(
        "online",
        views.FriendsOnlineListAPIView.as_view(),
        name="friends_online",
    ),
    path("blocked", views.FriendsBlockedListAPIView.as_view(), name="friends_blocked"),
]
