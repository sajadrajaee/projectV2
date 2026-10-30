from .models import House, Office, Note, HouseFile, OfficeDeal
from rest_framework import serializers
from django.db import transaction
from .validators import validate_house_file
from django.core.exceptions import ValidationError as DjangoValidationError

from django.http import QueryDict


def make_mutable_data(data):
    if isinstance(data, QueryDict):
        mutable_data = QueryDict('', mutable=True)

        for key in data:
            mutable_data.setlist(key, data.getlist(key))

        return mutable_data

    return data.copy()

class HouseFileValidationMixin:

    def validate_files(self, files):
        for file in files:
            try:
                validate_house_file(file)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.messages)

        return files


class HouseFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseFile
        fields = ['id', 'file']


class OfficeSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()

    class Meta:
        model = Office
        fields = (
            'id',
            'profile',
            'name',
            'admin_name',
            'address',
            'introduction'
        )

    def get_admin_name(self, obj) -> str:
        return f"{obj.admin.first_name} {obj.admin.last_name}".strip()


class OfficeProfileSerializer(OfficeSerializer):
    admin_phone = serializers.CharField(
        source='admin.phone', required=False, allow_null=True, allow_blank=True
    )
    admin_whatsapp = serializers.CharField(
        source='admin.whatsapp', required=False, allow_null=True, allow_blank=True
    )

    class Meta(OfficeSerializer.Meta):
        fields = OfficeSerializer.Meta.fields + ('admin_phone', 'admin_whatsapp')

    def update(self, instance, validated_data):
        admin_data = validated_data.pop('admin', {})
        admin = instance.admin
        for field, value in admin_data.items():
            setattr(admin, field, value)
        if admin_data:
            admin.save(update_fields=list(admin_data))
        return super().update(instance, validated_data)


class PublicOfficeProfileSerializer(OfficeSerializer):
    admin_phone = serializers.CharField(source='admin.phone', read_only=True, allow_null=True)
    admin_whatsapp = serializers.CharField(source='admin.whatsapp', read_only=True, allow_null=True)

    class Meta(OfficeSerializer.Meta):
        fields = OfficeSerializer.Meta.fields + ('admin_phone', 'admin_whatsapp')


class HouseSerializer(serializers.ModelSerializer):
    files = HouseFileSerializer(many=True, read_only=True)
    office = OfficeSerializer(read_only=True)

    class Meta:
        model = House
        fields = (
            'id',
            'listing_type',
            'property_type',
            'description',
            'price',
            'province',
            'district',
            'area',
            'status',
            'created_at',
            'files',
            'office',
        )


class HouseCreateSerializer(HouseFileValidationMixin, serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = House
        exclude = ['office']
    def validate_files(self, files):
        for file in files:
            try:
                validate_house_file(file)
            except DjangoValidationError as e:
                raise serializers.ValidationError(e.messages)

        return files
    def to_internal_value(self, data):
        data = make_mutable_data(data)

        # Remove empty file values sent by the frontend
        if data.get('files') == '':
            data.pop('files', None)

        return super().to_internal_value(data)
    
    def create(self, validated_data):
        files = validated_data.pop('files', [])
        house = House.objects.create(**validated_data)

        for file in files:
            HouseFile.objects.create(
                house=house,
                file=file
            )

        return house

class HouseUpdateSerializer(HouseFileValidationMixin, serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
        max_length=9,
    )

    delete_file_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = House
        exclude = ['office']

    def to_internal_value(self, data):
        data = make_mutable_data(data)

        # Remove empty file values sent by the frontend
        if data.get('files') == '':
            data.pop('files', None)

        return super().to_internal_value(data)

    @transaction.atomic
    def update(self, instance, validated_data):
        files = validated_data.pop('files', [])
        delete_file_ids = validated_data.pop('delete_file_ids', [])

        # Delete selected existing files
        if delete_file_ids:
            instance.files.filter(id__in=delete_file_ids).delete()

        # Update the house's other fields
        instance = super().update(instance, validated_data)

        # Append newly uploaded files
        for file in files:
            HouseFile.objects.create(
                house=instance,
                file=file,
            )

        return instance

class NoteSerialzier(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = (
            'id',
            'title',
            'description',
            'create_at',
            'updated_at',
        )


class OfficeDealSerializer(serializers.ModelSerializer):
    # property = serializers.PrimaryKeyRelatedField(
    #     queryset=House.objects.all()
    # )

    class Meta:
        model = OfficeDeal
        fields = (
            'id',
            # 'property',
            'sata_number',
            'deal_type',
            'owner_name',
            'owner_phone',
            'customer_name',
            'customer_phone',
            'total_price',
            'advance_payment',
            'currency',
            'office_commission',
            'deal_contract',
            'status',
            'description',
            'created_at',
            'updated_at',
        )
