from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.forms import model_to_dict

from .models import User, UserProfile
from .serializers import UserProfileSerializer


class UsersProfilesListAPIView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class UserProfileCreateAPIView(generics.CreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class UserProfileUpdateAPIView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"


class UserProfileDestroyAPIView(generics.DestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"


class UserProfileDetailAPIView(generics.RetrieveAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"


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
