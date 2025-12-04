from django.urls import path
from .views import ProtectedView

urlpatterns = [
    path('profile/', ProtectedView.as_view(), name='protected-profile'),
]