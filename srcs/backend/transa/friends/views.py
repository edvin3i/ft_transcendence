from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser


class FriendsCreateRequestAPIView(generics.CreateAPIView):
    pass


class FriendsDeleteAPIView(generics.DestroyAPIView):
    pass


class FriendsRequestAcceptAPIView(generics.UpdateAPIView):
    pass


class FriendsRequestRejectAPIView(generics.UpdateAPIView):
    pass


class FriendsRequestsIncomingListAPIView(generics.ListAPIView):
    """
    incoming
    """

    pass


class FriendsRequestsOutgoingListAPIView(generics.ListAPIView):
    """
    outgoing
    """

    pass


class FriendsBlockAPIView(generics.UpdateAPIView):
    pass


class FriendsUnblockAPIView(generics.UpdateAPIView):
    pass


class FriendsAllListAPIView(generics.ListAPIView):
    """
    all
    """

    pass


class FriendsOnlineListAPIView(generics.ListAPIView):
    """
    online
    """

    pass


class FriendsBlockedListAPIView(generics.ListAPIView):
    """
    blocked
    """

    pass
