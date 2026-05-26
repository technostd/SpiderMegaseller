from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import OzonReview, ReviewAnalysis


@receiver([post_save, post_delete], sender=OzonReview)
@receiver([post_save, post_delete], sender=ReviewAnalysis)
def invalidate_cache(sender, instance, **kwargs):
    uid = getattr(instance, 'user_id', None)
    if not uid and hasattr(instance, 'review'):
        uid = instance.review.user_id

    if uid:
        # LocMemCache не поддерживает delete_pattern, удаляем ключи явно
        for period in ['7d', '30d', '90d']:
            cache.delete(f"ozon_dashboard:{uid}:{period}")
            cache.delete(f"ozon_ai_analytics:{uid}:{period}")