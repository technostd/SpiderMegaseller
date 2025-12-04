# ai_reviews/serializers.py
from rest_framework import serializers
from .models import ReviewAnalysis


class ReviewAnalysisSerializer(serializers.ModelSerializer):
    """Сериализатор для анализа отзывов"""

    user = serializers.StringRelatedField(read_only=True)
    generated_response = serializers.SerializerMethodField()
    sentiment = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()
    analysis_data = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = ReviewAnalysis
        fields = [
            'id', 'user', 'review_text', 'product_model', 'original_rating',
            'generated_response', 'sentiment', 'issues_count',
            'analysis_data_json', 'analysis_data', 'created_at', 'updated_at',
            'tokens_used', 'model_version', 'is_success', 'error_message'
        ]
        read_only_fields = [
            'user', 'analysis_data_json', 'created_at', 'updated_at',
            'tokens_used', 'model_version', 'is_success', 'error_message'
        ]

    def get_generated_response(self, obj):
        return obj.generated_response

    def get_sentiment(self, obj):
        return obj.sentiment

    def get_issues_count(self, obj):
        return obj.issues_count

    def create(self, validated_data):
        # Удаляем analysis_data из validated_data, т.к. оно будет сохранено через setter
        validated_data.pop('analysis_data', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Удаляем analysis_data из validated_data
        validated_data.pop('analysis_data', None)
        return super().update(instance, validated_data)