# backend/scripts/import_reviews_from_json.py
import os
import sys
import json
import argparse
from datetime import datetime
from django.utils import timezone
from django.conf import settings

# Настройка Django
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django

django.setup()

from django.contrib.auth import get_user_model
from ai_reviews.models import OzonReview

User = get_user_model()


def parse_iso_date(date_str: str) -> datetime:
    """Безопасный парсинг ISO 8601 даты с учётом настройки USE_TZ"""
    if not date_str:
        dt = timezone.now()
    else:
        try:
            # Python < 3.11 не понимает 'Z', заменяем на '+00:00'
            if date_str.endswith("Z"):
                date_str = date_str[:-1] + "+00:00"
            dt = datetime.fromisoformat(date_str)
        except ValueError:
            dt = timezone.now()

    # Если USE_TZ выключен (как в вашей конфигурации SQLite),
    # убираем информацию о часовом поясе, чтобы избежать ошибки "SQLite backend does not support timezone-aware datetimes"
    if not getattr(settings, 'USE_TZ', True):
        return dt.replace(tzinfo=None)
    return dt


def import_reviews(json_file_path: str, user_email: str = None, clear_existing: bool = False):
    # 1. Загрузка JSON
    if not os.path.exists(json_file_path):
        print(f"❌ Файл не найден: {json_file_path}")
        return

    with open(json_file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Поддержка форматов: {"reviews": [...]} или прямой массив [...]
    reviews_data = data.get("reviews", data) if isinstance(data, dict) else data
    if not isinstance(reviews_data, list):
        print("❌ Ошибка формата JSON: ожидается массив или объект с ключом 'reviews'")
        return

    print(f"📖 Найдено {len(reviews_data)} записей в JSON.")

    # 2. Определение пользователя
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

    # 3. Опциональная очистка
    if clear_existing:
        target_ids = [r.get("review_id") for r in reviews_data if "review_id" in r]
        if target_ids:
            deleted_count, _ = OzonReview.objects.filter(
                user=user, review_id__in=target_ids
            ).delete()
            print(f"🧹 Удалено {deleted_count} существующих отзывов для обновления.")

    # 4. Импорт
    imported, updated, errors = 0, 0, 0
    for idx, r in enumerate(reviews_data, 1):
        try:
            # Валидация минимально необходимых полей
            for field in ("review_id", "product_id", "text"):
                if field not in r:
                    raise ValueError(f"Отсутствует обязательное поле: {field}")

            created_at = parse_iso_date(r.get("created_at"))

            obj, created = OzonReview.objects.update_or_create(
                user=user,
                review_id=r["review_id"],
                defaults={
                    "product_id": r["product_id"],
                    "offer_id": r.get("offer_id", ""),
                    "sku": r.get("sku", ""),
                    "text": r["text"],
                    "rating": r.get("rating"),
                    "created_at": created_at,
                    "product_name": r.get("product_name", ""),
                    "product_characteristics": r.get("product_characteristics", {}),
                    "has_answer": r.get("has_answer", False),
                    "moderation_status": r.get("moderation_status", "not_submitted"),
                }
            )

            if created:
                imported += 1
            else:
                updated += 1

        except Exception as e:
            errors += 1
            print(f"  ⚠️ [{idx}] Ошибка импорта отзыва #{r.get('review_id', '?')}: {e}")

    # 5. Статистика
    print(f"\n✅ Импортировано: {imported}")
    print(f"🔄 Обновлено: {updated}")
    print(f"❌ Ошибок: {errors}")
    print(f"📊 Всего обработано: {len(reviews_data)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Импорт тестовых отзывов из JSON в БД")
    parser.add_argument("--json-file", required=True, help="Путь к файлу reviews.json")
    parser.add_argument("--user-email", help="Email пользователя (по умолчанию берётся первый в БД)")
    parser.add_argument("--clear-existing", action="store_true",
                        help="Удалить существующие отзывы с такими review_id перед импортом")

    args = parser.parse_args()
    import_reviews(args.json_file, args.user_email, args.clear_existing)