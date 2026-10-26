from rest_framework.decorators import api_view, permission_classes
from django_ratelimit.decorators import ratelimit
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from office.permissions import IsOfficeUser, IsCustomerUser
from .models import User
from .serializers import (
    UserSerializer, 
    CustomerRegisterSerializer,
    OfficeRegisterSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from office.models import OfficeEnrollRequests, Office
from django.db.models import Q
from office.pagination import Paginations
from office.models import House
from office.serializers import HouseSerializer


@extend_schema(
        responses={
            200:HouseSerializer
        }
)
@api_view(["GET"])
def home_api(request):
    houses = House.objects.filter(
        status="AVAILABLE"
    ).select_related("office").prefetch_related("files")

    # -------------------------
    # Search
    # -------------------------
    search = request.query_params.get("search", "").strip()

    if search:
        houses = houses.filter(
            Q(area__icontains=search) |
            # Q(description__icontains=search) |
            Q(office__name__icontains=search)
        )


    # Exact filters

    listing_type = request.query_params.get("listing_type")
    property_type = request.query_params.get("property_type")
    # province = request.query_params.get("province")
    district = request.query_params.get("district")
    area = request.query_params.get("area")


    if listing_type:
        houses = houses.filter(listing_type=listing_type)

    if property_type:
        houses = houses.filter(property_type=property_type)

    # if province:
    #     houses = houses.filter(province=province)

    if district:
        houses = houses.filter(district=district)

    if area:
        houses = houses.filter(area__icontains=area)

    # Price filters

    min_price = request.query_params.get("min_price")
    max_price = request.query_params.get("max_price")

    if min_price:
        try:
            houses = houses.filter(price__gte=int(min_price))
        except ValueError:
            pass

    if max_price:
        try:
            houses = houses.filter(price__lte=int(max_price))
        except ValueError:
            pass

    # Sorting

    ordering = request.query_params.get("ordering", "newest")

    ordering_map = {
        "newest": "-created_at",
        "oldest": "created_at",
        "price_low": "price",
        "price_high": "-price",
    }

    houses = houses.order_by(
        ordering_map.get(ordering, "-created_at")
    )

    # Pagination

    paginator = Paginations()
    page = paginator.paginate_queryset(houses, request)

    serializer = HouseSerializer(page, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
def login_api(request):
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "")

    if not email or not password:
        return Response(
            {"error": "ایمیل و پسورد الزامی هستند."},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = authenticate(
        request,
        email=email,
        password=password
    )

    if user is None:
        return Response(
            {"error": "ایمیل یا پسورد اشتباه است."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if user.user_type == "PENDING":
        return Response(
            {"error": "حساب دفتر شما هنوز تایید نشده است."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user.user_type == "OFFICE" and not user.is_active:
        return Response(
            {"error": "ایمیل شما هنوز تایید نشده است."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user.user_type not in ["CUSTOMER", "OFFICE"]:
        return Response(
            {"error": "این حساب اجازه ورود ندارد."},
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "message": "ورود موفقانه بود.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "user_type": user.user_type,
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, IsCustomerUser])
def user_profile_api(request): 
    # normal users
    user = request.user
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = UserSerializer(
            user, 
            request.data,
            partial = request.method == 'PATCH'
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

@extend_schema(
        responses= {
            200:CustomerRegisterSerializer
        }
)
@api_view(['POST'])
def customer_register_api(request):
    serializer = CustomerRegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        verification_url = (
            f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
        )

        send_mail(
            subject="ایمیل خود را ویریفای کنید",
            message=(
                f"سلام {user.first_name}\n\n"
                f"برای تایید ایمیل خود روی لینک زیر کلیک کنید"
                f"\n\n{verification_url}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )

        return Response(
                {           
            "message":"حساب شما با موفقیت ایجاد شد",
            "user":
                {
                    "id":user.id,
                    "email":user.email,
                    "user_type":user.user_type
                }   
            },
            status=status.HTTP_201_CREATED
        )
    
    
    return Response(
        serializer.errors, status=status.HTTP_400_BAD_REQUEST
    )

@extend_schema(
        responses= {
            200:OfficeRegisterSerializer
        }
)
@api_view(['POST'])
def office_register_api(request):

    serializer = OfficeRegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )
    user = serializer.save()

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
    )

    send_mail(
        subject="ایمیل خود را ویریفای کنید",
        message=(
            f"سلام {user.first_name}\n\n"
            f"برای تایید ایمیل خود روی لینک زیر کلیک کنید"
            f"\n\n{verification_url}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False
    )

    OfficeEnrollRequests.objects.create(
                office=user,
                status="PENDING",
            )
    Office.objects.create(
                admin=user
            )
    return Response(
        {
            "message":"ثبت نام موفقانه انجام و لینک تایید به ایمیل شما ارسال شد",
        },
        status=status.HTTP_201_CREATED
    )


@extend_schema(
        responses={
            200:ChangePasswordSerializer
        }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_api(request):

    serializer = ChangePasswordSerializer(
        data=request.data,
        context={"request": request}
    )

    if serializer.is_valid():

        user = request.user

        user.set_password(
            serializer.validated_data["new_password"]
        )

        user.save()

        return Response(
            {"message": "پسورد با موفقیت تغییر کرد."},
            status=status.HTTP_200_OK
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["GET"])
def verify_email_api(request, uidb64, token):

    try:
        uid = force_str(
            urlsafe_base64_decode(uidb64)
        )

        user = User.objects.get(pk=uid)

    except (
        TypeError,
        ValueError,
        OverflowError,
        User.DoesNotExist,
    ):
        return Response(
            {"error": "لینک تایید نامعتبر است."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "لینک تایید نامعتبر یا منقضی شده است."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.is_active = True
    user.save(update_fields=["is_active"])

    return Response(
        {"message": "ایمیل شما با موفقیت تایید شد."},
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):

    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"error":"refresh token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()

    except Exception:
        return Response(
            {
                "error":"invalid refresh token",
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    return Response(
        {
            "message":"با موفقیت خارج شدید",
        },
        status=status.HTTP_200_OK
    )

@ratelimit(key='ip', rate='5/m', method='POST', block=True)
@ratelimit(key='post:email', rate='3/h', method='POST', group='reset_password', block=True)
@api_view(['POST'])
def password_reset_request_api(request):

    serializer = PasswordResetRequestSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    email = serializer.validated_data["email"]

    user = User.objects.filter(
        email__iexact=email,
        is_active=True
    ).first()

    if user:
        token = default_token_generator.make_token(user)

        uid = urlsafe_base64_encode(
            force_bytes(
                user.pk 
            )
        )

        verification_url = (
            f"{settings.FRONTEND_URL}/password-reset/{uid}/{token}"
        )

        send_mail(
            subject="لینک تغییر رمز عبور",
            message=f"برای تغییر رمز عبور روی لینک زیر کلیک کنید \n\n{verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email]
        )
    return Response(
        {
            "message":"در صورت درست بودن ایمیل، لینک تغییر رمز عبور به شما ارسال شده است"
        }
    )

@api_view(['POST'])
def password_reset_confirm_api(request, uidb64, token):

    try:
        uid = force_str(
            urlsafe_base64_decode(uidb64)
        )

        user = User.objects.get(pk=uid)

    except (
        TypeError,
        ValueError,
        OverflowError,
        User.DoesNotExist,
    ):
        return Response(
            {"error": "لینک نامعتبر است."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "لینک منقضی یا نامعتبر است."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = PasswordResetConfirmSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(
        serializer.validated_data["new_password"]
    )
    user.save()

    return Response({
        "message": "پسورد با موفقیت تغییر کرد."
    })
