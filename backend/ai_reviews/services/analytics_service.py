import json
import logging
from datetime import timedelta
from typing import Optional, Dict

from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.utils import timezone

from core.prompts.comprehensive_analytics_prompt import COMPREHENSIVE_ANALYTICS_PROMPT
from ai_reviews.models import OzonReview, ReviewAnalysis
from core.integrations.yandex_gpt import yandex_gpt

logger = logging.getLogger(__name__)
AI_CACHE_TTL = 6 * 3600


class OzonComprehensiveAnalyticsService:
    def __init__(self, user, period: str = '30d'):
        self.user = user
        self.period = period
        self.days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 30)
        self.start_date = timezone.now() - timedelta(days=self.days)

    def get_or_generate(self) -> Optional[Dict]:
        key = f"ozon_ai_analytics:{self.user.id}:{self.period}"
        cached = cache.get(key)
        if cached: return cached
        result = self._generate()
        if result: cache.set(key, result, AI_CACHE_TTL)
        return result

    def _generate(self) -> Optional[Dict]:
        qs = OzonReview.objects.filter(user=self.user, created_at__gte=self.start_date)
        if not qs.exists():
            print(f"[DEBUG] No reviews for user {self.user.id}")
            return None

        reviews = list(
            qs.values('id', 'rating', 'text', 'created_at', 'product_id', 'product_name', 'sku', 'has_answer').order_by(
                '-created_at')[:50])  # Уменьшили до 50 для теста
        agg = qs.aggregate(total=Count('id'), avg=Avg('rating'), neg=Count('id', filter=Q(rating__lte=2)))

        input_context = {
            "period": self.period, "days": self.days,
            "aggregates": {"total": agg['total'], "avg_rating": round(agg['avg'] or 0, 2),
                           "neg_pct": round((agg['neg'] or 0) / max(1, agg['total']) * 100, 1)},
            "reviews": [{"rating": r['rating'], "text": r['text'][:200], "date": r['created_at'].isoformat()[:10]} for r
                        in reviews]  # Обрезаем текст до 200 символов
        }

        prompt = COMPREHENSIVE_ANALYTICS_PROMPT + "\n\n# ВХОДНЫЕ ДАННЫЕ ДЛЯ АНАЛИЗА:\n" + json.dumps(input_context,
                                                                                                     ensure_ascii=False)

        print(f"[DEBUG] Prompt length: {len(prompt)} chars")  # <-- Смотрим длину промпта

        try:
            resp = yandex_gpt.client.chat.completions.create(
                model=f"gpt://{yandex_gpt.folder_id}/{yandex_gpt.model_name}",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=4000,
                stream=False
            )

            raw_text = resp.choices[0].message.content
            print(
                f"[DEBUG] Raw response ({len(raw_text)} chars): {raw_text[:500]}...")  # <-- Показываем первые 500 символов ответа

            # Чистим от markdown
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            if not cleaned:
                print("[DEBUG] ERROR: Cleaned response is EMPTY")
                return None

            data = json.loads(cleaned)
            ReviewAnalysis.objects.update_or_create(
                review=None, user=self.user, model_version='dashboard_comprehensive',
                defaults={'is_success': True, 'analysis_data': data, 'updated_at': timezone.now()}
            )
            print(f"[DEBUG] Successfully saved analysis")
            return data

        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON ERROR: {e}")
            print(f"[DEBUG] Failed to parse: {raw_text[:1000]}")
            return None
        except Exception as e:
            print(f"[DEBUG] Unexpected error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _save_analysis(self, result: Dict[str, any], input_data: Dict[str, any]) -> None:
        """
        Сохраняет результат анализа в БД как 'global' запись пользователя.
        """

        container, created = ReviewAnalysis.objects.get_or_create(
            review=None,
            model_version='dashboard_comprehensive',
            defaults={
                'is_success': True,
                'analysis_data': result,
                'tokens_used': input_data.get('tokens_used', 0),
            }
        )

        if not created:
            # Если запись уже была — обновляем данные
            container.analysis_data = result
            container.is_success = True
            container.save(update_fields=['analysis_data', 'is_success', 'updated_at'])
            print(f"[Analytics] Updated dashboard analysis for user via review=None")
        else:
            print(f"[Analytics] Created new dashboard analysis for user via review=None")