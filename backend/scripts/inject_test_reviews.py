# backend/scripts/inject_test_reviews.py
# !/usr/bin/env python
import os
import sys
import django
import random
from datetime import datetime, timedelta

# Настройка Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from ai_reviews.models import OzonReview, ReviewAnalysis

User = get_user_model()


def create_test_reviews(user_email=None, count=50, clear_existing=False):
    """
    Создает тестовые отзывы для указанного пользователя
    """
    # Получаем пользователя
    try:
        if user_email:
            user = User.objects.get(email=user_email)
        else:
            user = User.objects.first()
            if not user:
                print("❌ Нет пользователей в системе")
                return
    except User.DoesNotExist:
        print(f"❌ Пользователь {user_email} не найден")
        return

    print(f"🎯 Создание {count} тестовых отзывов для пользователя: {user.email}")

    # Очистка существующих тестовых отзывов
    if clear_existing:
        deleted_count = OzonReview.objects.filter(user=user, review_id__lt=1000000).delete()[0]
        print(f"🧹 Удалено {deleted_count} тестовых отзывов")

    # Тестовые данные (более разнообразные)
    products = [
        # Электроника
        {"name": "iPhone 15 Pro Max", "category": "smartphone", "price": 120000},
        {"name": "Samsung Galaxy S24", "category": "smartphone", "price": 90000},
        {"name": "Xiaomi Redmi Note 13", "category": "smartphone", "price": 25000},

        # Ноутбуки
        {"name": "MacBook Air M3", "category": "laptop", "price": 150000},
        {"name": "Lenovo IdeaPad 5", "category": "laptop", "price": 60000},
        {"name": "ASUS ROG Strix", "category": "laptop", "price": 180000},

        # Наушники
        {"name": "AirPods Pro 2", "category": "headphones", "price": 25000},
        {"name": "Sony WH-1000XM5", "category": "headphones", "price": 35000},
        {"name": "JBL Tune 510BT", "category": "headphones", "price": 5000},

        # Часы
        {"name": "Apple Watch Series 9", "category": "watch", "price": 40000},
        {"name": "Samsung Galaxy Watch 6", "category": "watch", "price": 30000},
        {"name": "Xiaomi Mi Band 8", "category": "watch", "price": 5000},

        # Бытовая техника
        {"name": "Кофемашина DeLonghi", "category": "appliance", "price": 45000},
        {"name": "Робот-пылесос Xiaomi", "category": "appliance", "price": 30000},
        {"name": "Умная колонка Яндекс", "category": "appliance", "price": 10000},
    ]

    review_templates = {
        "positive": [
            {"text": "Отличный товар! Превысил все ожидания. Качество на высшем уровне, доставка быстрая.",
             "rating": 5},
            {"text": "Очень доволен покупкой. Работает идеально, дизайн прекрасный. Рекомендую!", "rating": 5},
            {"text": "Лучшая покупка за последнее время. Функционал впечатляет, цена справедливая.", "rating": 5},
            {"text": "Товар соответствует описанию на 100%. Упаковка целая, все работает отлично.", "rating": 5},
            {"text": "Быстрая доставка, отличная связь с продавцом. Товар качественный, всем доволен.", "rating": 5},
        ],
        "neutral": [
            {"text": "Нормальный товар за свои деньги. Есть небольшие недочеты, но в целом неплохо.", "rating": 3},
            {"text": "Среднестатистический продукт. Ничего выдающегося, но и нареканий особых нет.", "rating": 3},
            {"text": "Работает, но ожидал большего. Качество сборки могло бы быть лучше.", "rating": 3},
            {"text": "Цена соответствует качеству. Не идеально, но пользоваться можно.", "rating": 3},
        ],
        "negative": [
            {"text": "Ужасное качество! Сломалось через 2 дня использования. Не рекомендую никому.", "rating": 1},
            {"text": "Товар пришел с дефектами. Не соответствует описанию. Очень разочарован.", "rating": 2},
            {"text": "Долгая доставка, плохая упаковка. Сам товар работает через раз.", "rating": 2},
            {"text": "Ожидал намного большего за такие деньги. Качество материалов низкое.", "rating": 2},
            {"text": "Не работает как заявлено. Постоянные глюки и сбои. Деньги на ветер.", "rating": 1},
        ],
        "detailed": [
            {"text": "Камера снимает отлично, автономность на высоте, но интерфейс немного тормозит.", "rating": 4},
            {"text": "Звук чистый, басы глубокие, но наушники неудобно сидят при длительном ношении.", "rating": 4},
            {"text": "Мощный процессор, хороший экран, но сильно греется при нагрузках.", "rating": 4},
            {"text": "Дизайн стильный, сборка качественная, но батарея садится слишком быстро.", "rating": 3},
            {"text": "Функционал богатый, много настроек, но интерфейс сложный для новичков.", "rating": 3},
        ],
        "logistics": [
            {"text": "Товар отличный, но доставили на 3 дня позже обещанного срока.", "rating": 4},
            {"text": "Качество хорошее, но курьер был невежлив и бросил посылку у двери.", "rating": 3},
            {"text": "Быстрая доставка, аккуратная упаковка, товар в идеальном состоянии.", "rating": 5},
            {"text": "Долго ждал доставки, заказ потеряли, пришлось заказывать заново.", "rating": 1},
        ]
    }

    created_reviews = []

    for i in range(count):
        product = random.choice(products)
        review_type = random.choice(list(review_templates.keys()))
        review_data = random.choice(review_templates[review_type])

        # Генерируем уникальный review_id
        review_id = 1000000 + i

        # Случайная дата отзыва (от 1 до 90 дней назад)
        days_ago = random.randint(1, 90)
        created_date = datetime.now() - timedelta(days=days_ago)

        # Характеристики товара
        characteristics = {
            "Бренд": product["name"].split()[0],
            "Категория": product["category"],
            "Цена": f"{product['price']} ₽",
            "Гарантия": "12 месяцев",
            "Страна": "Китай" if "Xiaomi" in product["name"] else "Южная Корея" if "Samsung" in product[
                "name"] else "США"
        }

        # Создаем отзыв
        ozon_review = OzonReview.objects.create(
            user=user,
            review_id=review_id,
            product_id=1000000 + i,  # Уникальный product_id
            offer_id=f"OFFER-{review_id}",
            sku=f"SKU-{product['category'].upper()}-{review_id}",
            text=review_data["text"],
            rating=review_data["rating"],
            created_at=created_date,
            product_name=product["name"],
            product_characteristics=characteristics,
            has_answer=random.choice([True, False]) if review_data["rating"] >= 4 else False,
            moderation_status=random.choice(['not_submitted', 'pending', 'sent'])
        )

        # Если статус 'sent' и есть ответ, заполняем поля ответа
        if ozon_review.moderation_status == 'sent' and ozon_review.has_answer:
            response_texts = [
                "Спасибо за ваш отзыв! Мы рады, что наш товар вам понравился.",
                "Благодарим за обратную связь. Ваше мнение очень важно для нас.",
                "Спасибо за оценку! Мы постоянно работаем над улучшением качества наших товаров.",
                "Благодарим за подробный отзыв. Мы учтем ваши замечания.",
                "Спасибо за выбор нашего товара! Надеемся на дальнейшее сотрудничество."
            ]

            ozon_review.answer_text = random.choice(response_texts)
            ozon_review.answer_posted_at = created_date + timedelta(days=random.randint(1, 3))
            ozon_review.answer_ozon_id = f"comment_{review_id}"
            ozon_review.save()

        # Для 40% отзывов создаем анализ
        if random.random() < 0.4:
            create_analysis_for_review(ozon_review, review_data)

        created_reviews.append(ozon_review)

        # Прогресс
        if (i + 1) % 10 == 0:
            print(f"📝 Создано {i + 1} отзывов...")

    print(f"\n✅ Успешно создано {len(created_reviews)} тестовых отзывов")
    print_statistics(user)


def create_analysis_for_review(review, review_data):
    """Создает анализ для отзыва"""
    sentiment = "positive" if review_data["rating"] >= 4 else "negative" if review_data["rating"] <= 2 else "neutral"

    analysis_data = {
        "review_data": {
            "product_model": review.product_name,
            "original_rating": review.rating,
            "review_text": review.text,
            "review_date": review.created_at.isoformat(),
            "extracted_rating_change": None
        },
        "generated_response": {
            "response_text": generate_response_text(review, sentiment),
            "response_tone": get_response_tone(sentiment),
            "response_purpose": get_response_purpose(sentiment),
            "key_points_addressed": ["качество", "доставка", "сервис"]
        },
        "analysis": {
            "overall_sentiment": {
                "sentiment": get_russian_sentiment(sentiment),
                "sentiment_score": get_sentiment_score(sentiment),
                "main_emotion": get_main_emotion(sentiment)
            },
            "mentioned_aspects": extract_aspects(review.text),
            "identified_issues": extract_issues(review.text, sentiment),
            "key_phrases": extract_key_phrases(review.text),
            "summary": generate_summary(review, sentiment)
        }
    }

    ReviewAnalysis.objects.create(
        review=review,
        analysis_data=analysis_data,
        tokens_used=random.randint(150, 800),
        model_version="yandexgpt/latest",
        is_success=True
    )


def generate_response_text(review, sentiment):
    """Генерирует текст ответа"""
    templates = {
        "positive": [
            f"Уважаемый клиент, большое спасибо за ваш отзыв о товаре '{review.product_name}'! Мы рады, что наш продукт вас не разочаровал и вы остались довольны покупкой.",
            f"Благодарим вас за положительный отзыв о '{review.product_name}'! Ваше мнение очень важно для нас и мотивирует нас становиться лучше.",
            f"Спасибо за высокую оценку товара '{review.product_name}'! Мы ценим ваше доверие и надеемся, что наш продукт будет радовать вас долгое время."
        ],
        "neutral": [
            f"Уважаемый клиент, благодарим за ваш отзыв о товаре '{review.product_name}'. Мы учтем ваши замечания и постараемся улучшить наш продукт.",
            f"Спасибо за обратную связь по товару '{review.product_name}'. Мы внимательно изучаем все отзывы для улучшения качества наших товаров."
        ],
        "negative": [
            f"Уважаемый клиент, приносим искренние извинения за неудобства с товаром '{review.product_name}'. Наша служба поддержки готова помочь решить возникшие вопросы.",
            f"Сожалеем, что товар '{review.product_name}' не оправдал ваших ожиданий. Мы обязательно разберемся в ситуации и примем меры для улучшения качества."
        ]
    }

    return random.choice(templates.get(sentiment, templates["neutral"]))


def get_response_tone(sentiment):
    tones = {
        "positive": "Благодарный",
        "neutral": "Нейтральный",
        "negative": "Извиняющийся"
    }
    return tones.get(sentiment, "Нейтральный")


def get_response_purpose(sentiment):
    purposes = {
        "positive": "Поблагодарить",
        "neutral": "Прояснить",
        "negative": "Извиниться"
    }
    return purposes.get(sentiment, "Поблагодарить")


def get_russian_sentiment(sentiment):
    sentiments = {
        "positive": "Позитивный",
        "neutral": "Нейтральный",
        "negative": "Негативный"
    }
    return sentiments.get(sentiment, "Нейтральный")


def get_sentiment_score(sentiment):
    scores = {
        "positive": random.uniform(0.6, 1.0),
        "neutral": random.uniform(-0.2, 0.2),
        "negative": random.uniform(-1.0, -0.4)
    }
    return round(scores.get(sentiment, 0), 2)


def get_main_emotion(sentiment):
    emotions = {
        "positive": ["Доволен", "Счастлив", "Восхищен"],
        "neutral": ["Нейтрален", "Удовлетворен", "Спокоен"],
        "negative": ["Разочарован", "Расстроен", "Раздражен"]
    }
    return random.choice(emotions.get(sentiment, ["Нейтрален"]))


def extract_aspects(text):
    """Извлекает аспекты из текста отзыва"""
    aspects = {
        "product_related": [],
        "service_related": [],
        "logistics_related": []
    }

    text_lower = text.lower()

    # Проверяем наличие ключевых слов
    product_keywords = ["качество", "дизайн", "функции", "работает", "сборка", "материал"]
    service_keywords = ["поддержка", "продавец", "консультация", "помощь", "сервис"]
    logistics_keywords = ["доставка", "курьер", "упаковка", "срок", "почта"]

    for keyword in product_keywords:
        if keyword in text_lower:
            aspects["product_related"].append(keyword)

    for keyword in service_keywords:
        if keyword in text_lower:
            aspects["service_related"].append(keyword)

    for keyword in logistics_keywords:
        if keyword in text_lower:
            aspects["logistics_related"].append(keyword)

    return aspects


def extract_issues(text, sentiment):
    """Извлекает проблемы из текста отзыва"""
    if sentiment != "negative":
        return []

    issues = []
    issue_categories = ["Качество товара", "Логистика", "Обслуживание", "Цена"]

    # Создаем случайную проблему для негативного отзыва
    issue = {
        "issue_category": random.choice(issue_categories),
        "issue_description": "Проблема с качеством товара" if random.choice(
            issue_categories) == "Качество товара" else "Проблема с доставкой",
        "mentioned_in_text": text[:50] + "...",
        "severity_level": random.choice(["Критическая", "Высокая", "Средняя"]),
        "potential_solutions": ["Замена товара", "Возврат средств", "Ремонт"]
    }

    issues.append(issue)
    return issues


def extract_key_phrases(text):
    """Извлекает ключевые фразы из текста"""
    # Простая реализация - разбиваем текст на слова и берем первые 5 существительных/прилагательных
    words = text.split()[:10]
    return {
        "positive_phrases": [w for w in words if len(w) > 3][:3],
        "negative_phrases": [],
        "suggestions": []
    }


def generate_summary(review, sentiment):
    """Генерирует краткое резюме"""
    if sentiment == "positive":
        return {
            "main_problem": "",
            "priority_level": "Низкий",
            "recommended_action": "Без действий"
        }
    else:
        return {
            "main_problem": "Требуется улучшение качества продукции",
            "priority_level": "Средний",
            "recommended_action": "Мониторинг"
        }


def print_statistics(user):
    """Выводит статистику по отзывам"""
    total = OzonReview.objects.filter(user=user).count()
    with_answers = OzonReview.objects.filter(user=user, has_answer=True).count()
    pending = OzonReview.objects.filter(user=user, moderation_status='pending').count()
    analyses = ReviewAnalysis.objects.filter(review__user=user).count()

    print(f"\n📊 Статистика тестовых данных:")
    print(f"   Всего отзывов: {total}")
    print(f"   Отзывов с ответами: {with_answers}")
    print(f"   На модерации: {pending}")
    print(f"   Анализов: {analyses}")

    # Распределение по рейтингам
    ratings = OzonReview.objects.filter(user=user).values_list('rating', flat=True)
    rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    for rating in ratings:
        if rating:
            rating_counts[rating] = rating_counts.get(rating, 0) + 1

    print(f"\n   Распределение по рейтингам:")
    for rating in range(1, 6):
        count = rating_counts.get(rating, 0)
        percentage = (count / total * 100) if total > 0 else 0
        stars = "★" * rating + "☆" * (5 - rating)
        print(f"     {stars} ({rating}): {count} ({percentage:.1f}%)")


if __name__ == "__main__":
    # Параметры можно менять
    create_test_reviews(
        user_email=None,  # None - первый пользователь в системе
        count=100,  # Количество отзывов
        clear_existing=True  # Удалить существующие тестовые отзывы
    )