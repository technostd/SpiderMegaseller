# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='profile.company_name', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'company_name', 'date_joined']
        read_only_fields = fields


class ExtendedUserProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.SerializerMethodField()
    phone = serializers.CharField(read_only=True, allow_null=True, default='')
    plan = serializers.CharField(read_only=True, default='Бизнес')  # Можно динамически определять
    registrationDate = serializers.SerializerMethodField()
    stores = serializers.SerializerMethodField()
    subscriptionEnd = serializers.CharField(read_only=True, allow_null=True, default='15.01.2025')

    def get_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.email.split('@')[0]  # fallback на часть email до @

    def get_registrationDate(self, obj):
        if obj.date_joined:
            return obj.date_joined.strftime('%d.%m.%Y')
        return ''

    def get_stores(self, obj):
        return obj.credentials.count() if hasattr(obj, 'credentials') else 0