from rest_framework import serializers
from .models import ReviewAnalysis


class ReviewAnalysisSerializer(serializers.ModelSerializer):
    """Сериализатор для анализа отзывов"""

    user = serializers.StringRelatedField(read_only=True)

    # Динамические поля
    generated_response = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()

    # Поля для вложенных данных
    review_data = serializers.SerializerMethodField()
    analysis_results = serializers.SerializerMethodField()
    generated_response_full = serializers.SerializerMethodField()

    class Meta:
        model = ReviewAnalysis
        fields = [
            'id', 'user', 'review_text', 'product_model', 'original_rating',
            'generated_response', 'sentiment', 'issues_count',
            'analysis_data', 'created_at', 'updated_at',
            'tokens_used', 'model_version', 'is_success', 'error_message',
            'review_data', 'analysis_results', 'generated_response_full'
        ]
        read_only_fields = [
            'user', 'analysis_data', 'created_at', 'updated_at',
            'tokens_used', 'model_version', 'is_success', 'error_message'
        ]

    def get_generated_response(self, obj):
        return obj.generated_response

    def get_sentiment(self, obj):
        return obj.sentiment

    def get_issues_count(self, obj):
        return obj.issues_count

    def get_review_data(self, obj):
        return obj.review_data

    def get_analysis_results(self, obj):
        return obj.analysis_results

    def get_generated_response_full(self, obj):
        return obj.generated_response_full