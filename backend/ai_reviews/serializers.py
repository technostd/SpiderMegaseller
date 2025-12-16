from rest_framework import serializers
from .models import ReviewAnalysis, OzonReview


class ReviewAnalysisSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для анализа отзыва"""

    # Добавляем поля для удобства
    review_id = serializers.IntegerField(source='review.review_id', read_only=True)
    review_text = serializers.CharField(source='review.text', read_only=True)
    review_rating = serializers.IntegerField(source='review.rating', read_only=True)

    # Поля из analysis_data для удобного доступа
    generated_response = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()
    response_preview = serializers.SerializerMethodField()

    # Полный анализ
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
            'product_name', 'product_characteristics',
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