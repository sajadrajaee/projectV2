from django import forms
from .models import User
from captcha.fields import CaptchaField

class UserProfileUpdate(forms.ModelForm):
    class Meta:
        model = User
        fields = [
            'profile_pic',
            'first_name',
            'last_name',
            'phone',
            'gender'
        ]

class CaptchaForm(forms.ModelForm):
    name = forms.CharField(max_length=100)
    email = forms.EmailField()
    captcha = CaptchaField()