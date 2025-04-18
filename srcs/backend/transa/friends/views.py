from autobahn.wamp import serializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from friends.models import Friendship
from friends.serializers import FriendshipSerializer, FriendsRequestCreateSerializer


class FriendsCreateRequestAPIView(generics.CreateAPIView):
    queryset = Friendship.objects.all()
    serializer_class = FriendsRequestCreateSerializer
    permission_classes = [IsAuthenticated,]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["to_user_id"] = self.kwargs["pk"]
        return context

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data["to_user"] = self.kwargs["pk"]
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        out = FriendshipSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)


class FriendsDeleteAPIView(generics.DestroyAPIView):
    queryset = Friendship.objects.all()
    permission_classes = [IsAuthenticated,]  # IsParticipant create later


class FriendsRequestAcceptAPIView(generics.UpdateAPIView):
    queryset = Friendship.objects.filter(status="pending")
    permission_classes = [IsAuthenticated,]  # IsReciever need to create
    serializer_class = FriendshipSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = "accepted"
        instance.updated_at = timezone.now()
        instance.save(update_fields=["status", "updated_at"])
        serrializer = self.get_serializer(instance)
        return Response(serializer.data)


class FriendsRequestRejectAPIView(generics.UpdateAPIView):
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = "rejected"
        instance.updated_at = timezone.now()
        instance.save(update_fields=["status", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FriendsRequestsIncomingListAPIView(generics.ListAPIView):
    """
    incoming
    """

    def get_queryset(self):
        return Friendship.objects.filter(
            to_user=self.request.user, status="pending"
        ).select_related("from_user")


class FriendsRequestsOutgoingListAPIView(generics.ListAPIView):
    """
    outgoing
    """

    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated,]

    def get_queryset(self):
        return Friendship.objects.filter(
            from_user=self.request.user, status="pending"
        ).select_related("to_user")



class FriendsBlockAPIView(generics.UpdateAPIView):
    queryset = Friendship.objects.all()
    permission_classes = [IsAuthenticated,]  # IsParticipant need to create
    serializer_class = FriendshipSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = "blocked"
        instance.updated_at = timezone.now()
        instance.save(update_fields=["status", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FriendsUnblockAPIView(generics.UpdateAPIView):
    queryset = Friendship.objects.all()
    permission_classes = [IsAuthenticated,]  # IsParticipant need to create
    serializer_class = FriendshipSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = None
        instance.updated_at = timezone.now()
        instance.save(update_fields=["status", "updated_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FriendsAllListAPIView(generics.ListAPIView):
    """
    all
    """

    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated,]

    def get_queryset(self):
        return Friendship.objects.filter(
            from_user=self.request.user, status="accepted"
        ).select_related("to_user")



class FriendsOnlineListAPIView(generics.ListAPIView):
    """
    online
    """

    serrial_class = FriendshipSerializer
    permission_classes = [IsAuthenticated,]

    def get_queryset(self):
        friends =  Friendship.objects.filter(
            from_user=self.request.user,
        ).select_related("to_user")
        users_ids = [f.to_user_id for f in friends]
        online_ids = [uid for uid in users_ids if is_online(uid)] # need to implement is_online
        return friends.filter(to_user__in=online_ids)


class FriendsBlockedListAPIView(generics.ListAPIView):
    """
    blocked
    """

    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated,]

    def get_queryset(self):
        return Friendship.objects.filter(
            from_user=self.request.user, status="blocked"
        ).select_related("to_user")
