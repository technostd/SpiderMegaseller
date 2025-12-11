from django.db import models
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
import json

User = get_user_model()


class ReviewAnalysis(models.Model):
    """
    Модель для сохранения результатов анализа отзывов
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_analyses',
        verbose_name='Пользователь'
    )

    # Исходные данные
    review_text = models.TextField(verbose_name='Текст отзыва')
    product_model = models.CharField(
        max_length=255,
        verbose_name='Модель товара',
        null=True,
        blank=True
    )
    original_rating = models.IntegerField(
        verbose_name='Исходная оценка',
        null=True,
        blank=True
    )

    # Результат анализа от Yandex GPT (храним как JSONField)
    analysis_data = models.JSONField(
        verbose_name='Данные анализа',
        encoder=DjangoJSONEncoder,
        default=dict,
        blank=True
    )

    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    tokens_used = models.IntegerField(
        default=0,
        verbose_name='Использовано токенов'
    )
    model_version = models.CharField(
        max_length=100,
        verbose_name='Версия модели',
        default='unknown'
    )

    # Флаги
    is_success = models.BooleanField(default=True, verbose_name='Успешный анализ')
    error_message = models.TextField(
        verbose_name='Сообщение об ошибке',
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Анализ отзыва'
        verbose_name_plural = 'Анализы отзывов'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_success', 'created_at']),
        ]

    def __str__(self):
        return f"Анализ отзыва #{self.id} от {self.user}"

    @property
    def generated_response(self) -> str:
        """Сгенерированный ответ"""
        return self.analysis_data.get('generated_response', {}).get('response_text', '')

    @property
    def sentiment(self) -> str:
        """Тональность отзыва"""
        return self.analysis_data.get('analysis', {}).get('overall_sentiment', {}).get('sentiment', '')

    @property
    def issues_count(self) -> int:
        """Количество выявленных проблем"""
        return len(self.analysis_data.get('analysis', {}).get('identified_issues', []))

    @property
    def summary(self) -> dict:
        """Краткое резюме"""
        return self.analysis_data.get('analysis', {}).get('summary', {})

    @property
    def review_data(self) -> dict:
        """Данные отзыва"""
        return self.analysis_data.get('review_data', {})

    @property
    def generated_response_full(self) -> dict:
        """Полные данные сгенерированного ответа"""
        return self.analysis_data.get('generated_response', {})

    @property
    def analysis_results(self) -> dict:
        """Результаты анализа"""
        return self.analysis_data.get('analysis', {})