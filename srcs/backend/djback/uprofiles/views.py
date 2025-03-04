from rest_framework import generics
from .models import User, UserProfile
from .serializers import UserProfileSerializer

class UserProfileAPIView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer