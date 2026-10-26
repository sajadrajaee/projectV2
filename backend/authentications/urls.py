from django.urls import path
from . import views_api
from rest_framework_simplejwt.views import TokenRefreshView


app_name = "authentications"

urlpatterns = [
    path('api/home/', views_api.home_api),
    path('api/auth/login/', views_api.login_api),
    path('api/auth/logout/', views_api.logout_api),
    path('api/auth/register/customer/', views_api.customer_register_api),
    path('api/auth/register/office/', views_api.office_register_api),
    path('api/auth/verify-email/<uidb64>/<token>/', views_api.verify_email_api, name="verify_email_api"),
    path('api/auth/change-password/', views_api.change_password_api, name="change_password_api"),
    path('api/auth/password-reset-request/', views_api.password_reset_request_api),
    
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),
    path(
        'api/auth/password_reset/<uidb64>/<token>/', 
        views_api.password_reset_confirm_api, 
        name="password_reset_confirm_api"
    ),

    path('api/auth/me/profile/', views_api.user_profile_api),
]