# backend/scripts/batch_analyze_reviews.py
import os
import sys
import django
import logging

# Настройка путей
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()

from django.contrib.auth import get_user_model
from ai_reviews.models import OzonReview, ReviewAnalysis
from core.integrations.yandex_gpt import yandex_gpt, YandexGPTError

User = get_user_model()
logger = logging.getLogger(__name__)


def batch_analyze(user_email: str = None, limit: int = 0, skip_existing: bool = True):
    # 1. Определение пользователя
    try:
        if user_email:
            user = User.objects.get(email=user_email)
        else:
            user = User.objects.first()
            if not user:
                print("❌ В системе нет пользователей. Укажите --user-email.")
                return
    except User.DoesNotExist:
        print(f"❌ Пользователь {user_email} не найден.")
        return

    print(f"🎯 Целевой пользователь: {user.email}")

    # 2. Формируем queryset отзывов для обработки
    queryset = OzonReview.objects.filter(user=user, has_answer=False)

    if skip_existing:
        # Исключаем отзывы, у которых уже есть успешный анализ
        # Мы используем subquery, чтобы найти review_id, у которых есть успешный анализ
        reviewed_ids = ReviewAnalysis.objects.filter(
            review__user=user,
            is_success=True
        ).values_list('review_id', flat=True)

        queryset = queryset.exclude(review_id__in=reviewed_ids)
        print("📝 Исключены отзывы с существующим анализом.")

    # Применяем лимит (если 0 - без лимита)
    if limit > 0:
        queryset = queryset[:limit]

    total_to_process = queryset.count()
    print(f"🔍 Найдено {total_to_process} отзывов для анализа.")

    if total_to_process == 0:
        print("✅ Все отзывы уже проанализированы.")
        return

    success_count = 0
    error_count = 0

    # 3. Запуск анализа
    for review in queryset:
        try:
            print(f"  ⚙️ Анализирую отзыв #{review.review_id} ({review.product_name})...")

            # Подготовка данных для GPT
            gpt_input = {
                'review_text': review.text,
                'product_model': review.product_name,
                'original_rating': review.rating,
                'product_characteristics': review.product_characteristics
            }

            # Вызов сервиса Yandex GPT
            result = yandex_gpt.analyze_review(gpt_input)

            # Сохранение анализа
            ReviewAnalysis.objects.create(
                review=review,
                analysis_data=result.get('analysis', {}),
                tokens_used=result.get('meta', {}).get('tokens_used', 0),
                model_version=result.get('meta', {}).get('model', 'unknown'),
                is_success=True,
                error_message=''
            )
            success_count += 1

        except YandexGPTError as e:
            logger.error(f"GPT error for review {review.review_id}: {e}")
            # Можно сохранять и ошибки, чтобы видеть их в UI
            ReviewAnalysis.objects.create(
                review=review,
                is_success=False,
                error_message=str(e)
            )
            error_count += 1
        except Exception as e:
            print(f"  ⚠️ Ошибка: {e}")
            error_count += 1

    print(f"\n✅ Успешно: {success_count}")
    print(f"❌ Ошибок: {error_count}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Пакетный анализ отзывов из БД")
    parser.add_argument("--user-email", help="Email пользователя")
    parser.add_argument("--limit", type=int, default=0, help="Лимит отзывов (0 = все)")
    parser.add_argument("--process-all", action="store_true", help="Анализировать даже если есть существующий анализ")

    args = parser.parse_args()

    batch_analyze(
        user_email=args.user_email,
        limit=args.limit,
        skip_existing=not args.process_all
    )