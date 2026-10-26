from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from datetime import datetime


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("email is required!")
        email = self.normalize_email(email=email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db) 
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Meta:
        verbose_name="کاربر"
        verbose_name_plural = "کاربران"
    USER_TYPE = [
            ("OFFICE", 'دفتر رهنما'), # email, phone -+
            ("CUSTOMER", 'مشتری'),
            ("PENDING", "در انتظار تایید")
        ]
    GENDER_CHOICE = [
        ('MALE', 'مرد'),
        ('FEMALE', 'زن')
    ]

    profile_pic = models.ImageField(
        upload_to='avatars/', null=True, blank=True, verbose_name="عکس نمایه"
    )
    email = models.EmailField(
        unique=True, null=False, blank=False, verbose_name="ایمیل"
    )
    first_name = models.CharField(max_length=69, verbose_name="اسم")
    last_name = models.CharField(max_length=69, verbose_name="فامیلی")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, verbose_name="شماره تماس", null=True, blank=True)
    whatsapp = models.CharField(max_length=20, null=True, blank=True, verbose_name="WhatsApp")
    gender = models.CharField(
        choices=GENDER_CHOICE, 
        default='MALE', 
        null=True, 
        blank=True,
        verbose_name="جنسیت",
        max_length=10
    )

    user_type = models.CharField(
        choices=USER_TYPE, max_length=20,default="CUSTOMER", null=False, blank=False, verbose_name="نوع کاربر"
    )
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    def __str__(self):
        return self.email 
