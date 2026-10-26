from django.shortcuts import render, redirect, get_object_or_404
from .models import User
from office.models import OfficeEnrollRequests, Office, DISTRICTS, PROVINCE, House
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.db.models import Q
from .forms import UserProfileUpdate, CaptchaForm
from django.contrib.auth.forms import PasswordChangeForm, PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.conf import settings
from django.urls import reverse
from django.core.paginator import Paginator
        
def account_type(request):
    return render(request, 'authentications/accounts.html')



def home(request):
    if request.user.is_authenticated and request.user.user_type == "OFFICE":
        return redirect("office:office_home")

    listing_type = request.GET.get("listing_type")
    province = request.GET.get("province")
    area = request.GET.get("area")
    district = request.GET.get("district")

    houses = House.objects.filter(status='AVAILABLE')

    if listing_type:
        houses = houses.filter(listing_type=listing_type)

    if province:
        houses = houses.filter(province=province)

    if district:
        houses = houses.filter(district=district)

    if area:
        houses = houses.filter(area__icontains=area)

    # Newest listings first
    houses = houses.order_by("-id")

    # Pagination
    paginator = Paginator(houses, 15)
    houses = paginator.get_page(request.GET.get("page", 1))

    # Keep all filters when moving between pages
    query_params = request.GET.copy()
    query_params.pop("page", None)

    return render(
        request,
        "authentications/user_home.html",
        {
            "houses": houses,
            "province": PROVINCE,
            "district": DISTRICTS,
            "area": area,
            "query_params": query_params.urlencode(),
        },
    )


def user_profile(request): # done
    user = User.objects.get(email=request.user.email)
    return render(
        request, 'authentications/user_profile.html', {'customer':user}
    )
def user_profile_update(request, id): # done
    user = get_object_or_404(User, id=id)
    if request.method == 'POST':
        form = UserProfileUpdate(request.POST, request.FILES, instance=user)
        if form.is_valid():
            form.save()

            messages.success(request, 'نمایه موفقانه ویرایش شد')
            return redirect('authentications:user_profile')

    form = UserProfileUpdate(instance=user)
    return render(
        request, 'authentications/profile_update.html', {"form":form}
    )

def register_user(request): #done
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        password = request.POST.get('password')
        re_password = request.POST.get('re_password')

        if not email:
            messages.error(request, 'ایمیل الزامی است.')
            return redirect('authentications:register_user')

        if not password:
            messages.error(request, 'رمز عبور الزامی است.')
            return redirect('authentications:register_user')

        if password != re_password:
            messages.error(request, 'رمزهای عبور یکسان نیستند.')
            return redirect('authentications:register_user')

        if User.objects.filter(email=email).exists():
            messages.error(request, 'این ایمیل قبلاً ثبت شده است.')
            return redirect('authentications:register_user')

        user = User.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            password=password,
            user_type='CUSTOMER'
        )

        messages.success(request, 'حساب شما با موفقیت ایجاد شد.')
        return redirect('authentications:login_user')

    return render(request, 'authentications/register_user.html')

def register_off(request): # done

    # Email and username must be unique.
    if request.method == "POST":
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        phone = request.POST.get("phone", "").strip()
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        re_password = request.POST.get("re_password", "")

        if not email:
            messages.error(request, "ایمیل الزامی است.")
            return redirect("authentications:register_off")

        if not password:
            messages.error(request, "رمز عبور الزامی است.")
            return redirect("authentications:register_off")

        if not re_password:
            messages.error(request, "تکرار رمز عبور الزامی است.")
            return redirect("authentications:register_off")

        if password != re_password:
            messages.error(request, "رمزهای عبور یکسان نیستند.")
            return redirect("authentications:register_off")

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, "این ایمیل قبلاً ثبت شده است.")
            return redirect("authentications:register_off")

        # create_user() hashes the password automatically.
        user = User.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            password=password,
            user_type="PENDING",
        )

        # The account must remain inactive until email verification.
        user.is_active = False
        user.save(update_fields=["is_active"])
        
        # Create an enrollment request.
        OfficeEnrollRequests.objects.create(
            office=user,
            status="PENDING",
        )

        # create office
        Office.objects.create(
            admin=user
        )

        # Generate the token only after the user has been completely saved.
        token = default_token_generator.make_token(user)

        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        verification_url = request.build_absolute_uri(
            reverse(
                "authentications:verify_email",
                kwargs={
                    "uidb64": uid,
                    "token": token,
                },
            )
        )

        send_mail(
            subject="ایمیل خود را ویریفای کنید",
            message=(
                f"سلام {user.first_name or ''}،\n\n"
                "برای تأیید ایمیل خود روی لینک زیر کلیک کنید:\n\n"
                f"{verification_url}\n\n"
                "اگر شما این حساب را ایجاد نکرده‌اید، این ایمیل را نادیده بگیرید."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return render(
            request,
            "authentications/email_verification_sent.html",
        )

    return render(
        request,
        "authentications/register_off.html",
    )

def verify_email_view(request, uidb64, token): # done
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
        user = None

    if user is not None:
        token_is_valid = default_token_generator.check_token(
            user,
            token,
        )

        if token_is_valid:
            user.is_active = True
            user.save(update_fields=["is_active"])

            return render(
                request,
                "authentications/email_verify.html",
                {"success": True},
            )

    return render(
        request,
        "authentications/email_verify.html",
        {"success": False},
        status=400,
    )



def login_user(request): # done
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")

        if not email or not password:
            messages.error(
                request,
                "ایمیل و پسورد الزامی هستند."
            )
            return redirect("authentications:login_user")

        user = authenticate(
            request,
            email=email,
            password=password,
        )

        if user is None:
            messages.error(
                request,
                "پسورد یا ایمیل تان را اشتباه وارد نموده‌اید."
            )
            return redirect("authentications:login_user")

        # The user authenticated successfully, but still needs approval.
        if user.user_type == "PENDING":
            return render(
                request,
                "authentications/waiting.html",
            )

        # This is an unverified office account.
        if user.user_type == "OFFICE" and not user.is_active:
            return HttpResponse(
                "ایمیل شما تا کنون تایید نشده است"
            )

        if user.user_type == "CUSTOMER":
            login(request, user)
            return redirect("authentications:home")

        if user.user_type == "OFFICE" and user.is_active:
            login(request, user)

            # Use user, not request.user, immediately after login().
            if Office.objects.filter(admin=user).exists():
                return redirect("office:office_home")

            Office.objects.create(admin=user)
            return redirect("office:office_home")

        messages.error(
            request,
            "حساب کاربری شما اجازه ورود ندارد."
        )
        return redirect("authentications:login_user")

    return render(
        request,
        "authentications/login_user.html",
    )

def logout_user(request): # done
    logout(request)
    return redirect('authentications:home')

def change_password(request): # done
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'پسورد شما موفقانه اپدیت شد')
            return redirect('authentications:user_profile')
        messages.error(request, 'مشکلی رخ داده است')
        return redirect('authentications:user_profile')
    form = PasswordChangeForm(request.user)

    return render(
        request, 'authentications/change_password.html', {'form':form}
    )

def password_reset_request_view(request): # done
    if request.method == 'POST':
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']

            users = User.objects.filter(
                email__iexact=email,
                is_active=True
            )

            for user in users:
                token = default_token_generator.make_token(user)

                uid = urlsafe_base64_encode(
                    force_bytes(user.pk)
                )

                reset_url = request.build_absolute_uri(
                    reverse(
                        'authentications:password_reset_confirm',
                        kwargs={
                            "uidb64":uid, 
                            "token":token
                        }
                    )
                )

                send_mail(
                    subject="لینک تغییر رمز عبور",
                    message=(
                        f"your password reset link : \n\n {reset_url}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False 
                )

            return render(
                request, 'authentications/password_reset_sent.html'
            )

    else:
        form = PasswordResetForm()


    return render(
        request, 
        'authentications/password_reset_form.html', 
        {"form":form}
    )



def password_reset_confirm_view(request, uidb64, token): # done
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
        user = None

    if user is None:
        return render(
            request,
            "authentications/password_reset_confirm.html",
            {
                "valid_link": False
            },
            status=400
        )

    if not default_token_generator.check_token(user, token):
        return render(
            request,
            "authentications/password_reset_confirm.html",
            {
                "valid_link": False
            },
            status=400
        )

    if request.method == "POST":
        password = request.POST.get("password", "")
        password2 = request.POST.get("password2", "")

        if not password or not password2:
            return render(
                request,
                "authentications/password_reset_confirm.html",
                {
                    "valid_link": True,
                    "error": "هر دو فیلد پسورد ضروری هستند"
                }
            )

        if password != password2:
            return render(
                request,
                "authentications/password_reset_confirm.html",
                {
                    "valid_link": True,
                    "error": "پسوردها باید شبیه هم باشند"
                }
            )

        user.set_password(password)
        user.save()

        return render(
            request,
            "authentications/password_reset_complete.html"
        )

    return render(
        request,
        "authentications/password_reset_confirm.html",
        {
            "valid_link": True
        }
    )
