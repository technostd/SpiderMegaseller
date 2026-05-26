import logging
from datetime import timedelta
from typing import Optional, Dict, Any, List

from django.utils import timezone
from django.core.cache import cache
from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import OzonReview
from .services.analytics_service import OzonComprehensiveAnalyticsService

logger = logging.getLogger(__name__)


class OzonAnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', '30d')
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(period, 30)
        start_date = timezone.now() - timedelta(days=days)

        cache_key = f"ozon_dashboard:{request.user.id}:{period}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        reviews_qs = OzonReview.objects.filter(user=request.user, created_at__gte=start_date)
        ai_service = OzonComprehensiveAnalyticsService(request.user, period)
        ai_result = ai_service.get_or_generate()

        data = {
            "period": period,
            "priority_matrix": self._priority_matrix(ai_result),
            "quick_wins": self._quick_wins(ai_result),
            "critical_alerts": self._critical_alerts(reviews_qs, ai_result),
            "rating_trend": self._trends(reviews_qs, Avg('rating')),
            "reviews_volume": self._trends(reviews_qs, Count('id')),
            "ai_summary": self._ai_summary(ai_result),
            "ai_recommendations": self._ai_recommendations(ai_result),
            "card_analysis": self._card_analysis(reviews_qs),
            "returns_analysis": self._returns_analysis(reviews_qs),
            "customer_segments": self._customer_segments(reviews_qs),
            "assortment": self._assortment(reviews_qs, days),
            "response_effectiveness": self._response_effectiveness(reviews_qs)
        }

        cache.set(cache_key, data, timeout=3600)
        return Response(data)

    def _priority_matrix(self, ai: Optional[Dict]) -> List[Dict]:
        if not ai or 'priority_matrix' not in ai: return []
        return [{"problem": i.get('problem', ''), "impact": i.get('business_impact', 'Низкое'),
                 "difficulty": i.get('implementation_difficulty', 'Средняя')}
                for i in ai['priority_matrix'] if isinstance(i, dict) and i.get('problem')]

    def _quick_wins(self, ai: Optional[Dict]) -> List[Dict]:
        if not ai: return []
        recs = ai.get('recommendations', [])
        res = [{"title": r.get('title', ''), "time": r.get('estimated_time', ''),
                "effect": r.get('expected_business_effect', '')}
               for r in recs if isinstance(r, dict) and r.get('implementation_complexity') == 'Низкая']
        return res or [{"title": "Ответить на отзывы без ответов", "time": "30 мин", "effect": "+0.1★"}]

    def _ai_summary(self, ai: Optional[Dict]) -> str:
        if not ai: return "Недостаточно данных для формирования сводки."
        s = ai.get('summary', {})
        return f"Главная проблема: {s.get('main_problem', 'не выявлена')}. Риск: {s.get('business_risk_level', 'Низкий')}. Отзывов: {s.get('total_reviews', 0)}."

    def _ai_recommendations(self, ai: Optional[Dict]) -> List[Dict]:
        if not ai: return []
        p_map = {'Высокий': 'high', 'Средний': 'medium', 'Низкий': 'low'}
        return [{"priority": p_map.get(r.get('priority', 'Средний'), 'medium'), "title": r.get('title', ''),
                 "effect": r.get('expected_business_effect', ''), "difficulty": r.get('estimated_time', '')}
                for r in ai.get('recommendations', []) if isinstance(r, dict) and r.get('title')]

    def _critical_alerts(self, qs, ai: Optional[Dict]) -> List[str]:
        alerts = []
        if ai and isinstance(ai.get('critical_alerts'), list):
            for a in ai['critical_alerts']:
                alerts.append(a.get('description', str(a)) if isinstance(a, dict) else str(a))
        recent = qs.filter(rating__lte=2, created_at__gte=timezone.now() - timedelta(days=3)).count()
        if recent >= 5: alerts.append(f"⚠️ {recent} негативных отзыва за 3 дня — требуется внимание!")
        return alerts or ["Нет критических проблем"]

    def _trends(self, qs, func):
        data = qs.annotate(date=TruncDate('created_at')).values('date').annotate(val=func).order_by('date')
        return [{"date": r["date"].isoformat() if hasattr(r["date"], "isoformat") else str(r["date"]),
                 "value": float(r["val"]) if r["val"] is not None else 0} for r in data]

    def _card_analysis(self, qs) -> Dict:
        total = qs.count()
        if total == 0: return {"match_description_pct": 0, "photo_in_reviews_pct": 0, "issues": []}
        issues = qs.filter(rating__lte=3, text__iregex=r'цвет|размер|описание|характеристик|фото|размерн')
        cnt = issues.count()
        return {"match_description_pct": max(0, round(100 - (cnt / total * 100 * 1.5))), "photo_in_reviews_pct": 45,
                "issues": list(set(issues.values_list('text', flat=True)))[:5]}

    def _returns_analysis(self, qs) -> Dict:
        ret = qs.filter(rating__lte=2, text__iregex=r'вернул|возврат|брак|не подошёл|сломался|дефект')
        total = ret.count()
        if total == 0: return {"reasons": [], "total_returns": 0, "total_cost_rub": 0}
        reasons = {
            "Не подошёл размер": ret.filter(text__iregex=r'размер|велик|мал|фасон').count(),
            "Брак/Дефект": ret.filter(text__iregex=r'брак|дефект|сломал|нерабоч').count(),
            "Не соответствует описанию": ret.filter(text__iregex=r'цвет|фото|описание|не тот').count(),
        }
        reasons["Другое"] = max(0, total - sum(reasons.values()))
        avg_cost = 350
        data = [{"reason": k, "pct": round((v / total) * 100, 1), "cost_rub": round(v * avg_cost, 2)} for k, v in
                reasons.items() if v > 0]
        return {"reasons": sorted(data, key=lambda x: x['pct'], reverse=True), "total_returns": total,
                "total_cost_rub": round(total * avg_cost, 2)}

    def _customer_segments(self, qs) -> List[Dict]:
        if not qs.exists(): return []
        new_qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=7))
        loyal_qs = qs.exclude(created_at__gte=timezone.now() - timedelta(days=7))
        res = []
        if new_qs.exists(): res.append(
            {"type": "Новички", "rating": round(new_qs.aggregate(Avg('rating'))['rating__avg'] or 0, 2),
             "count": new_qs.count()})
        if loyal_qs.exists(): res.append(
            {"type": "Постоянные", "rating": round(loyal_qs.aggregate(Avg('rating'))['rating__avg'] or 0, 2),
             "count": loyal_qs.count()})
        return res

    def _assortment(self, qs, days: int) -> List[Dict]:
        if not qs.exists(): return []
        products = qs.values('product_id', 'product_name').annotate(rating=Avg('rating'), reviews=Count('id')).order_by(
            '-reviews')[:10]
        start = timezone.now() - timedelta(days=days)
        mid = start + timedelta(days=days / 2)
        res = []
        for p in products:
            pid = p['product_id']
            f1 = qs.filter(product_id=pid, created_at__gte=start, created_at__lt=mid).aggregate(avg=Avg('rating'))[
                'avg']
            f2 = qs.filter(product_id=pid, created_at__gte=mid).aggregate(avg=Avg('rating'))['avg']
            if f1 and f2:
                trend = f"{round(f2 - f1, 2):+.2f}"
            elif f2:
                trend = "new"
            else:
                trend = "0.00"
            res.append(
                {"sku": f"SKU-{pid}", "name": p['product_name'] or 'Без названия', "rating": round(p['rating'] or 0, 1),
                 "reviews": p['reviews'], "trend": trend})
        return res

    def _response_effectiveness(self, qs) -> Dict:
        answered = qs.filter(has_answer=True, answer_posted_at__isnull=False)
        hours = 0
        if answered.exists():
            diffs = [(p - c).total_seconds() / 3600 for c, p in answered.values_list('created_at', 'answer_posted_at')
                     if c and p]
            hours = round(sum(diffs) / len(diffs), 1) if diffs else 0

        a_tot = qs.filter(has_answer=True).count()
        a_pos = qs.filter(has_answer=True, rating__gte=4).count()
        w_pct = round((a_pos / a_tot) * 100, 1) if a_tot else 0

        u_tot = qs.filter(has_answer=False).count()
        u_pos = qs.filter(has_answer=False, rating__gte=4).count()
        wo_pct = round((u_pos / u_tot) * 100, 1) if u_tot else 0

        return {"with_answer_change_pct": w_pct, "without_answer_change_pct": wo_pct, "avg_response_time_hours": hours,
                "ai_generated_count": qs.filter(has_answer=True).count(),
                "time_saved_hours": round(qs.filter(has_answer=True).count() * 0.15, 1)}