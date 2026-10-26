from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

admin.site.site_header = "مدیریت خانه یاب"
admin.site.site_title = "خانه یاب"


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):

    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type',)
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('اطلاعات شخصی', {
            'fields': ('first_name', 'last_name', 'phone', 'gender', 'profile_pic')
        }),
        ('نوع کاربر', {
            'fields': ('user_type',)
        }),
        ('حقوق و دسترسی‌ها', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
    )


    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2',
                'first_name', 'last_name', 'phone',
                'gender', 'user_type', 'is_staff', 'is_active',
            )
        }),
    )


    readonly_fields = ('email',)   