from rest_framework import serializers
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    
    This serializer converts User model instances to JSON representations and vice versa.
    It includes username, first_name, last_name, email, and password fields.
    Password field is write-only for security purposes.
    """
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    # Add custom create() for pass hashing
    def create(self, validated_data):
        """
        Custom create method to properly hash passwords when creating a User.
        
        Args:
            validated_data: The validated data from the request
            
        Returns:
            The created User instance with hashed password
        """
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserProfile model.
    
    This serializer handles the UserProfile model along with its related User model
    through a nested serializer approach. It includes user, avatar, and bio fields.
    """
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ["user", "avatar", "bio"]

    # Add custom create() for nested JSON save
    def create(self, validated_data):
        """
        Custom create method to handle nested User data when creating a UserProfile.
        
        This method extracts the nested user data, creates a User instance first,
        and then creates the UserProfile with a reference to that User.
        
        Args:
            validated_data: The validated data from the request
            
        Returns:
            The created UserProfile instance with associated User
        """
        user_data = validated_data.pop("user")
        # if user_data is None:
        #     raise serializers.ValidationError("User is not provided")
        user_serializer = UserSerializer()
        user_instance = user_serializer.create(user_data)
        user_profile = UserProfile.objects.create(user=user_instance, **validated_data)

        return user_profile
