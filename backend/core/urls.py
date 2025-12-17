from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/ai-reviews/', include('ai_reviews.urls')),

    path('api/accounts/', include('accounts.urls')),
]
