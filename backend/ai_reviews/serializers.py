from rest_framework import serializers
from .models import ReviewAnalysis, OzonReview


class ReviewAnalysisSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для анализа отзыва"""

    review_id = serializers.IntegerField(source='review.review_id', read_only=True)
    review_text = serializers.CharField(source='review.text', read_only=True)
    review_rating = serializers.IntegerField(source='review.rating', read_only=True)

    generated_response = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()
    response_preview = serializers.SerializerMethodField()

    detailed_analysis = serializers.SerializerMethodField()

    class Meta:
        model = ReviewAnalysis
        fields = [
            'id',
            'review_id',
            'review_text',
            'review_rating',
            'analysis_data',
            'generated_response',
            'sentiment',
            'issues_count',
            'response_preview',
            'detailed_analysis',
            'created_at',
            'updated_at',
            'tokens_used',
            'model_version',
            'is_success',
            'error_message'
        ]
        read_only_fields = fields

    def get_generated_response(self, obj):
        return obj.generated_response

    def get_sentiment(self, obj):
        return obj.sentiment

    def get_issues_count(self, obj):
        return obj.issues_count

    def get_response_preview(self, obj):
        return obj.response_preview

    def get_detailed_analysis(self, obj):
        """Возвращаем структурированный анализ"""
        analysis_data = obj.analysis_data

        if not analysis_data:
            return None

        return {
            'review_data': analysis_data.get('review_data', {}),
            'generated_response': analysis_data.get('generated_response', {}),
            'analysis': analysis_data.get('analysis', {}),
            'meta': analysis_data.get('meta', {})
        }


class OzonReviewSerializer(serializers.ModelSerializer):
    """Сериализатор для отзывов Ozon"""

    user = serializers.StringRelatedField(read_only=True)
    product_name = serializers.CharField(read_only=True)
    short_text = serializers.CharField(read_only=True)
    analysis_count = serializers.SerializerMethodField()
    latest_analysis = serializers.SerializerMethodField()

    class Meta:
        model = OzonReview
        fields = [
            'id', 'review_id', 'product_id', 'offer_id', 'sku',
            'text', 'short_text', 'rating', 'created_at',
            'product_name', 'product_characteristics', 'product_info',
            'has_answer', 'answer_text', 'answer_posted_at', 'answer_ozon_id',
            'moderation_status', 'created_local', 'updated_local',
            'user', 'analysis_count', 'latest_analysis'
        ]
        read_only_fields = [
            'user', 'created_local', 'updated_local'
        ]

    def get_analysis_count(self, obj):
        return obj.analyses.count()

    def get_latest_analysis(self, obj):
        latest = obj.analyses.filter(is_success=True).first()
        if latest:
            return {
                'id': latest.id,
                'sentiment': latest.sentiment,
                'response_preview': latest.response_preview,
                'created_at': latest.created_at
            }
        return None


class PriorityMatrixItemSerializer(serializers.Serializer):
    problem = serializers.CharField()
    impact = serializers.ChoiceField(choices=['Высокое', 'Среднее', 'Низкое'])
    difficulty = serializers.ChoiceField(choices=['Низкая', 'Средняя', 'Высокая'])


class QuickWinItemSerializer(serializers.Serializer):
    title = serializers.CharField()
    time = serializers.CharField()
    effect = serializers.CharField()


class TrendPointSerializer(serializers.Serializer):
    date = serializers.DateField(format='%Y-%m-%d')
    value = serializers.FloatField()


class AIRecommendationSerializer(serializers.Serializer):
    priority = serializers.ChoiceField(choices=['high', 'medium', 'low'])
    title = serializers.CharField()
    effect = serializers.CharField()
    difficulty = serializers.CharField()


class CardAnalysisSerializer(serializers.Serializer):
    match_description_pct = serializers.FloatField()
    photo_in_reviews_pct = serializers.FloatField()
    issues = serializers.ListField(child=serializers.CharField())


class ReturnReasonSerializer(serializers.Serializer):
    reason = serializers.CharField()
    pct = serializers.FloatField()
    cost_rub = serializers.FloatField()


class ReturnsAnalysisSerializer(serializers.Serializer):
    reasons = ReturnReasonSerializer(many=True)
    total_returns = serializers.IntegerField()
    total_cost_rub = serializers.FloatField()


class CustomerSegmentSerializer(serializers.Serializer):
    type = serializers.CharField()
    rating = serializers.FloatField()
    count = serializers.IntegerField()


class AssortmentItemSerializer(serializers.Serializer):
    sku = serializers.CharField()
    name = serializers.CharField()
    rating = serializers.FloatField()
    reviews = serializers.IntegerField()
    trend = serializers.CharField()


class ResponseEffectivenessSerializer(serializers.Serializer):
    with_answer_change_pct = serializers.FloatField()
    without_answer_change_pct = serializers.FloatField()
    avg_response_time_hours = serializers.FloatField()
    ai_generated_count = serializers.IntegerField()
    time_saved_hours = serializers.FloatField()


class OzonAnalyticsDashboardSerializer(serializers.Serializer):
    """Сериализатор ответа для эндпоинта /api/analytics/ozon/dashboard/"""
    period = serializers.ChoiceField(choices=['7d', '30d', '90d'])

    # Матрица приоритетов и quick wins — можно рассчитать из БД + эвристики
    priority_matrix = PriorityMatrixItemSerializer(many=True)
    quick_wins = QuickWinItemSerializer(many=True)

    # Критические алерты — расчёт на бэкенде по частоте негатива
    critical_alerts = serializers.ListField(child=serializers.CharField())

    # Динамика — чистый ORM-запрос
    rating_trend = TrendPointSerializer(many=True)
    reviews_volume = TrendPointSerializer(many=True)

    # AI-инсайты — здесь можно использовать кэшированный результат анализа
    ai_summary = serializers.CharField(allow_null=True)
    ai_recommendations = AIRecommendationSerializer(many=True)

    # Анализ карточки — расчёт из product_characteristics + отзывов
    card_analysis = CardAnalysisSerializer()

    # Возвраты — если нет прямых данных, рассчитываем эвристически
    returns_analysis = ReturnsAnalysisSerializer()

    # Сегментация клиентов — заглушка или расчёт по дате первого отзыва
    customer_segments = CustomerSegmentSerializer(many=True)

    # Ассортимент — группировка по product_id/SKU
    assortment = AssortmentItemSerializer(many=True)

    # Эффективность ответов — сравнение has_answer=True/False
    response_effectiveness = ResponseEffectivenessSerializer()