from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .models import UserProfile
from .serializers import UserProfileSerializer


# In the future, it might be refactored to use ViewSets and custom URLs,
# but for now, the code is still duplicated.
# I know it's not ideal, but it's clearer for novice teammates.


class UsersProfilesListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class UserDetailProfileAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "pk"


class UserProfileCreateAPIView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class UserProfileUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    # lookup_field = "user_id"
    def get_object(self):
        return self.request.user.userprofile


class UserProfileDestroyAPIView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    # lookup_field = "user_id"
    def get_object(self):
        return self.request.user.userprofile


class UserProfileDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"


class UserProfileSelfAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.userprofile
