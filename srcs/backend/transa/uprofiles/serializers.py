from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.

    This serializer converts User model instances to JSON representations and vice versa.
    It includes username, first_name, last_name, email, and password fields.
    Password field is write-only for security purposes.
    """

    email = serializers.EmailField(
        # validators=[UniqueValidator(queryset=User.objects.all())]
    )  # check the email field for unique

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "password"]
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
        fields = ["user", "avatar", "bio", "is_2fa_enabled", "totp_secret"]

    def get_object(self):
        return self.request.user.userprofile

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

    def update(self, instance, validated_data):
        """
        Custom update method to handle User data when updating a UserProfile.
        This method updates both the UserProfile fields and the associated User fields.

        Args:
        instance: The existing UserProfile instance being updated.
        validated_data: The validated data from the request.

        Returns:
        The updated UserProfile instance.
        """

        user_data = validated_data.pop("user", None)
        user_instance = instance.user

        if user_data:

            if "email" in user_data and user_instance.email != user_data["email"]:
                if (
                    User.objects.filter(email=user_data["email"])
                    .exclude(pk=user_instance.pk)
                    .exists()
                ):
                    raise serializers.ValidationError(
                        {"email": "This email is already in use."}
                    )

            user_instance.username = user_data.get("username", user_instance.username)
            user_instance.first_name = user_data.get(
                "first_name", user_instance.first_name
            )
            user_instance.last_name = user_data.get(
                "last_name", user_instance.last_name
            )
            user_instance.email = user_data.get("email", user_instance.email)

            password = user_data.get("password", None)
            if password:
                user_instance.set_password(password)

            user_instance.save()

        # instance.is_2fa_enabled = validated_data.get("is_2fa_enabled", instance.is_2fa_enabled)
        # if not instance.is_2fa_enabled:
        #     instance.totp_secret = None
        # if instance.is_2fa_enabled and not instance.totp_secret:
        #     instance.totp_secret = pyotp.random_base32()
        instance.avatar = validated_data.get("avatar", instance.avatar)
        instance.bio = validated_data.get("bio", instance.bio)
        instance.save()

        return instance
