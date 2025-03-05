from rest_framework.response import Response
from rest_framework import serializers
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    # Add custom create() for pass hashing
    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ["user", "avatar", "bio"]
    
    # Add custom create() for nested JSON save
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        # if user_data is None:
        #     raise serializers.ValidationError("User is not provided")
        user_serializer = UserSerializer()
        user_instance = user_serializer.create(user_data)
        user_profile = UserProfile.objects.create(user=user_instance, **validated_data)
        
        return user_profile
