from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import User, UserProfile
from .serializers import UserProfileSerializer


# In the future, it might be refactored to use ViewSets and custom URLs,
# but for now, the code is still duplicated.
# I know it's not ideal, but it's clearer for novice teammates.


class UsersProfilesListAPIView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class UserProfileCreateAPIView(generics.CreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    permission_classes = [IsAuthenticated]  # need to think about registration


class UserProfileUpdateAPIView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"
    permission_classes = [IsAuthenticated]


class UserProfileDestroyAPIView(generics.DestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"
    permission_classes = [IsAdminUser]


class UserProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"
    permission_classes = [IsAuthenticated]
