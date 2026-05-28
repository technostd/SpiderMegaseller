# accounts/models.py
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django_cryptography.fields import encrypt
import jsonschema

class ModuleConfigSchema:
    """
    Схемы конфигурации модулей.
    Обеспечивает строгую типизацию и расширяемость без изменения структуры БД.
    """
    SCHEMAS = {
        'ai_reviews': {
            "type": "object",
            "properties": {
                "premoderate": {"type": "boolean"},
                "auto_publish_positive": {"type": "boolean"},
                "default_tone": {
                    "type": "string",
                    "enum": ["нейтральный", "благодарный", "извиняющийся", "дружелюбный"]
                },
                "max_response_length": {
                    "type": "integer",
                    "minimum": 50,
                    "maximum": 10000
                }
            },
            "required": [],
            "additionalProperties": False
        },
    }

    @classmethod
    def get_schema(cls, module_name: str) -> dict:
        return cls.SCHEMAS.get(module_name, {})

    @classmethod
    def validate(cls, module_name: str, config: dict) -> bool:
        """
        Валидирует конфиг по схеме.
        Возвращает True или поднимает ValueError.
        """
        schema = cls.get_schema(module_name)
        if not schema:
            return True  # без схемы — проходит валидацию (opt-in)
        try:
            jsonschema.validate(instance=config, schema=schema)
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid config for '{module_name}': {e.message}")
        return True

    @classmethod
    def normalize(cls, module_name: str, config: dict) -> dict:
        """
        Приводит конфиг к ожидаемой структуре с fallback-значениями.
        """
        if module_name == 'ai_reviews':
            return {
                'premoderate': bool(config.get('premoderate', False)),
                'auto_publish_positive': bool(config.get('auto_publish_positive', True)),
                'default_tone': config.get('default_tone', 'нейтральный'),
                'max_response_length': int(config.get('max_response_length', 1000)),
            }
        return config.copy()


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

User = get_user_model()

class UserModuleConfig(models.Model):
    """
    Пользовательские настройки модулей.
    Пример:
      - module_name = 'ai_reviews'
        config_data = {
          "premoderate": true,
          "auto_publish_positive": false,
          "default_tone": "нейтральный",
          "max_response_length": 500
        }
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_configs'
    )
    module_name = models.CharField(
        max_length=100,
        help_text="Имя модуля (например, 'ai_reviews')"
    )
    config_data = models.JSONField(
        default=dict,
        encoder=DjangoJSONEncoder,
        blank=True,
        help_text="Конфигурация в формате JSON"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Конфигурация модуля"
        verbose_name_plural = "Конфигурации модулей"
        unique_together = ('user', 'module_name')
        indexes = [
            models.Index(fields=['user', 'module_name']),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.module_name}"

    @classmethod
    def get_config(cls, user, module_name: str, default: dict = None) -> dict:
        """
        Возвращает нормализованный конфиг модуля, подгружая из БД или возвращая default.
        """
        if default is None:
            default = {}

        try:
            obj = cls.objects.get(user=user, module_name=module_name)
            raw_config = obj.config_data or {}
            try:
                ModuleConfigSchema.validate(module_name, raw_config)
                return ModuleConfigSchema.normalize(module_name, raw_config)
            except ValueError:
                return ModuleConfigSchema.normalize(module_name, default)
        except cls.DoesNotExist:
            return ModuleConfigSchema.normalize(module_name, default)

    @classmethod
    def set_config(cls, user, module_name: str, config: dict) -> 'UserModuleConfig':
        """
        Сохраняет конфиг после валидации и нормализации.
        """
        if not ModuleConfigSchema.validate(module_name, config):
            raise ValueError("Validation skipped — should not happen")

        normalized = ModuleConfigSchema.normalize(module_name, config)

        obj, created = cls.objects.update_or_create(
            user=user,
            module_name=module_name,
            defaults={'config_data': normalized}
        )
        return obj
    
class UserEmailPreferences(models.Model):
    DIGEST_IMMEDIATE = "immediate"
    DIGEST_HOURLY = "hourly"
    DIGEST_DAILY = "daily"

    DIGEST_CHOICES = [
        (DIGEST_IMMEDIATE, "Мгновенно"),
        (DIGEST_HOURLY, "Раз в час"),
        (DIGEST_DAILY, "Раз в сутки"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_prefs",
    )

    is_active = models.BooleanField(
        "Активировать email-уведомления",
        default=True,
    )

    notify_integration_errors = models.BooleanField(
        "Ошибки интеграций",
        default=True,
    )

    notify_moderation_queue = models.BooleanField(
        "Новые ответы на модерации",
        default=True,
    )

    moderation_digest_interval = models.CharField(
        "Частота дайджеста модерации",
        max_length=20,
        choices=DIGEST_CHOICES,
        default=DIGEST_HOURLY,
    )

    notify_processing_report = models.BooleanField(
        "Отчёты обработки отзывов",
        default=True,
    )

    notify_security = models.BooleanField(
        "Безопасность аккаунта",
        default=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Настройки email-уведомлений"
        verbose_name_plural = "Настройки email-уведомлений"

    def __str__(self):
        return f"Email-настройки пользователя {self.user_id}"