from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.forms import model_to_dict

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

    permission_classes = [IsAuthenticated] # need to think about registration


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


# class UserProfileAPIView(APIView):
#     def get(self, request):
#         return Response({'title': 'SomeOne'})

#     def post(self, request):
#         profile_new = UserProfile.objects.create(
#             user = None,
#             avatar = request.data['avatar'],
#             bio = request.data['bio'],
#         )
#         return Response({'bio': model_to_dict(profile_new)})
