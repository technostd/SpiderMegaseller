from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, MarketplaceCredentials


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'created_at']
    search_fields = ['user__email', 'company_name']
    raw_id_fields = ['user']


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name = "Профиль"
    verbose_name_plural = "Профиль"


class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(MarketplaceCredentials)
class CredentialsAdmin(admin.ModelAdmin):
    list_display = ['user', 'marketplace', 'created_at', 'updated_at']
    list_filter = ['marketplace']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at']
    exclude = ['client_id', 'api_key', 'api_secret']
