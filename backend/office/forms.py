from django import forms
from .models import House, HouseFile, Office, OfficeDeal, Note


class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Office
        fields = '__all__'
        exclude = ['admin']

class CreateForm(forms.ModelForm):
    class Meta:
        model = House
        exclude = ["office"]


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        if not data:
            return []

        if isinstance(data, (list, tuple)):
            return [
                super(MultipleFileField, self).clean(file, initial)
                for file in data
            ]

        return [super(MultipleFileField, self).clean(data, initial)]


class CreateFileForm(forms.ModelForm):

    files = MultipleFileField(
        required=False,
        label="تصاویر و ویدیوها"
    )

    class Meta:
        model = HouseFile
        fields = ["files"]

class DealCreationForm(forms.ModelForm):
    class Meta:
        model = OfficeDeal
        fields = '__all__'
        exclude = ["office", "created_at", "updated_at", "property"]

class DealUpdateFrom(forms.ModelForm):
    class Meta:
        model = OfficeDeal
        fields = '__all__'
        exclude = ['updated_at', 'created_at', 'office']
        
class NoteUpdateForm(forms.ModelForm):
    class Meta:
        model = Note    
        fields = '__all__'
        exclude = ['admin', 'create_at', 'updated_at']