from django.urls import path
from .views import ProtectedView, UserModuleConfigView, ModuleSchemaView, CredentialsView, UserProfileView

urlpatterns = [
    path('profile/', ProtectedView.as_view(), name='protected-profile'),
    path(
        'module-config/<str:module_name>/',
        UserModuleConfigView.as_view(),
        name='user-module-config'
    ),
    path(
        'module-config/schema/<str:module_name>/',
        ModuleSchemaView.as_view(),
        name='module-config-schema'
    ),
    path('credentials/', CredentialsView.as_view(), name='credentials'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
]