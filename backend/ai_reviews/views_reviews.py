# ai_reviews/views_reviews.py
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from .models import OzonReview, ReviewAnalysis
from .serializers import OzonReviewSerializer, ReviewAnalysisSerializer


class OzonReviewFilter(filters.FilterSet):
    """Фильтры для отзывов"""
    has_answer = filters.BooleanFilter(field_name='has_answer')
    moderation_status = filters.CharFilter(field_name='moderation_status')
    rating = filters.NumberFilter(field_name='rating')
    date_from = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = OzonReview
        fields = ['has_answer', 'moderation_status', 'rating']


class OzonReviewViewSet(viewsets.ModelViewSet):
    """
    API для работы с отзывами Ozon
    """
    serializer_class = OzonReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = OzonReviewFilter

    def get_queryset(self):
        return OzonReview.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_answer(self, request):
        """Отправить ответ на отзыв через Ozon API"""
        review = self.get_object()

        answer_text = request.data.get('text', '').strip()
        if not answer_text:
            return Response(
                {'error': 'Текст ответа не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from .services import OzonReviewProcessingService

        try:
            processor = OzonReviewProcessingService(request.user)

            ozon_resp = processor.ozon_service.comment_review(
                review_id=review.review_id,
                text=answer_text,
                is_public=True
            )

            if ozon_resp['success']:
                # Обновляем отзыв
                review.has_answer = True
                review.answer_text = answer_text
                review.answer_posted_at = timezone.now()
                review.moderation_status = 'sent'
                review.save()

                return Response({
                    'success': True,
                    'message': 'Ответ успешно отправлен',
                    'review_id': review.id
                })
            else:
                return Response({
                    'success': False,
                    'error': ozon_resp.get('error', 'Неизвестная ошибка')
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика по отзывам"""
        user_reviews = self.get_queryset()

        total = user_reviews.count()
        answered = user_reviews.filter(has_answer=True).count()
        pending = user_reviews.filter(moderation_status='pending').count()

        # Средний рейтинг
        ratings = user_reviews.exclude(rating__isnull=True).values_list('rating', flat=True)
        avg_rating = sum(ratings) / len(ratings) if ratings else 0

        return Response({
            'total': total,
            'answered': answered,
            'pending_moderation': pending,
            'answered_percentage': (answered / total * 100) if total > 0 else 0,
            'average_rating': round(avg_rating, 2)
        })

    @action(detail=True, methods=['get'], url_path='analyses')
    def analyses(self, request, pk=None):
        """Получить все анализы для отзыва"""
        review = self.get_object()
        analyses = review.analyses.all()

        from .serializers import ReviewAnalysisSerializer
        serializer = ReviewAnalysisSerializer(analyses, many=True)

        return Response(serializer.data)
