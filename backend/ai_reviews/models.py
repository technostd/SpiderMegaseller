from django.db import models
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
import json

User = get_user_model()


class ReviewAnalysis(models.Model):
    """
    Модель для сохранения результатов анализа отзывов
    """
    review = models.OneToOneField(
        OzonReview,
        on_delete=models.CASCADE,
        related_name='analysis',
        verbose_name='Отзыв',
        null=True,  # пока для миграции
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
        review_id = self.review.review_id if self.review else 'N/A'
        return f"Анализ отзыва Ozon #{review_id} от {self.review.user if self.review else '—'}"

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



class OzonReview(models.Model):
    """
    Отзыв из Ozon. Только Ozon. Максимально просто.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ozon_reviews',
        verbose_name='Пользователь'
    )

    # Ozon IDs
    review_id = models.BigIntegerField('ID отзыва в Ozon', db_index=True)
    product_id = models.BigIntegerField('ID товара в Ozon')
    offer_id = models.CharField('Offer ID', max_length=200, blank=True)
    sku = models.CharField('SKU', max_length=100, blank=True)

    # Отзыв
    text = models.TextField('Текст отзыва')
    rating = models.PositiveSmallIntegerField('Оценка', null=True)
    created_at = models.DateTimeField('Дата создания отзыва в Ozon')

    # Товар (копируем из API один раз)
    product_name = models.CharField('Название товара', max_length=500, blank=True)
    product_characteristics = models.JSONField('Характеристики товара', default=dict, blank=True)

    # Ответ
    has_answer = models.BooleanField('Есть ответ?', default=False)
    answer_text = models.TextField('Текст ответа', blank=True)
    answer_posted_at = models.DateTimeField('Ответ отправлен', null=True, blank=True)
    answer_ozon_id = models.CharField('ID комментария в Ozon', max_length=100, blank=True)

    # Статус
    moderation_status = models.CharField(
        'Статус модерации',
        max_length=20,
        choices=[
            ('not_submitted', 'Не отправлено'),
            ('pending', 'На модерации'),
            ('sent', 'Отправлено'),
        ],
        default='not_submitted',
        db_index=True
    )

    created_local = models.DateTimeField(auto_now_add=True)
    updated_local = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ozon отзыв'
        verbose_name_plural = 'Ozon отзывы'
        unique_together = [('user', 'review_id')]
        indexes = [
            models.Index(fields=['user', 'has_answer', 'created_at']),
            models.Index(fields=['moderation_status']),
        ]

    def __str__(self):
        return f"OzonReview #{self.review_id} — {self.user.email}"

    @property
    def short_text(self):
        return (self.text[:100] + '...') if len(self.text) > 100 else self.text