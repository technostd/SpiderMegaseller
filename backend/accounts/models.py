# accounts/models.py
from django.conf import settings
from django.db import models
from django_cryptography.fields import encrypt


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    company_name = models.CharField("Название компании", max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} — {self.company_name or '—'}"

    class Meta:
        verbose_name = "Профиль"
        verbose_name_plural = "Профили"


class MarketplaceCredentials(models.Model):
    MARKETPLACE_CHOICES = [
        ('ozon', 'Ozon'),
        ('wb', 'Wildberries'),
        ('ym', 'Yandex Market'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='credentials'
    )
    marketplace = models.CharField(
        "Маркетплейс",
        max_length=10,
        choices=MARKETPLACE_CHOICES
    )

    # 🔒 Поля шифруются автоматически через django-cryptography
    client_id = encrypt(models.CharField(
        "Client ID", max_length=255, blank=True,
        help_text="Требуется для Ozon"
    ))
    api_key = encrypt(models.CharField(
        "API Key", max_length=255
    ))
    api_secret = encrypt(models.CharField(
        "API Secret", max_length=255, blank=True,
        help_text="Для WB и Яндекс.Маркет"
    ))

    created_at = models.DateTimeField("Создано", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлено", auto_now=True)

    class Meta:
        verbose_name = "Учётные данные маркетплейса"
        verbose_name_plural = "Учётные данные маркетплейсов"
        unique_together = ('user', 'marketplace')

    def __str__(self):
        return f"{self.user.email} — {self.get_marketplace_display()}"