from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            'id',
            'profile_pic',
            'first_name',
            'last_name',
            'phone',
            'gender'
        )
        read_only_fields=("id",)

class CustomerRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    re_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "phone",
            "email",
            "password",
            "re_password",
        )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "این ایمیل قبلاً ثبت شده است."
            )

        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["re_password"]:
            raise serializers.ValidationError(
                {"password": "رمزهای عبور یکسان نیستند."}
            )

        return attrs
    
    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        validated_data.pop("re_password")

        user = User.objects.create_user(
            user_type="CUSTOMER",
            **validated_data
        )

        return user

class OfficeRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    re_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "phone",
            "email",
            "password",
            "re_password",
        )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "این ایمیل قبلاً ثبت شده است."
            )

        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["re_password"]:
            raise serializers.ValidationError(
                {"password": "رمزهای عبور یکسان نیستند."}
            )

        return attrs
    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        validated_data.pop("re_password")

        user = User.objects.create_user(
            user_type="PENDING",
            **validated_data
        )

        user.is_active = False
        user.save(update_fields=["is_active"])

        # OfficeEnrollRequests.objects.create(
        #     office=user,
        #     status="PENDING"
        # )

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "پسورد فعلی اشتباه است."
            )

        return value

    def validate_new_password(self, value):
        user = self.context["request"].user

        # Apply AUTH_PASSWORD_VALIDATORS
        validate_password(value, user=user)

        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "new_password": "پسوردهای جدید یکسان نیستند."
            })

        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError({
                "new_password": "پسورد جدید باید با پسورد قبلی متفاوت باشد."
            })

        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        user = self.context.get("user")

        validate_password(value, user=user)

        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "new_password": "پسوردهای جدید یکسان نیستند."
            })

        return attrs