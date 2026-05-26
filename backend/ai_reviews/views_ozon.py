# ai_reviews/views_ozon.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.integrations.ozon import OzonServiceFactory, OzonAPIError
from accounts.models import MarketplaceCredentials  # ← добавили импорт


def _get_ozon_service(user):
    """Вспомогательная функция: получает сервис с ключами из БД"""
    cred = MarketplaceCredentials.objects.filter(
        user=user,
        marketplace='ozon'
    ).first()

    if not cred or not cred.client_id or not cred.api_key:
        raise ValueError("Ozon credentials not configured. Please set API keys in Integrations.")

    return OzonServiceFactory.create_service(
        api_key=cred.api_key,
        client_id=cred.client_id
    )


class OzonTestConnectionView(APIView):
    """
    Тест подключения к Ozon API
    POST /api/ai-reviews/ozon/test/
    (ключи берутся из настроек пользователя)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            service = _get_ozon_service(request.user)
            result = service.test_connection()
            return Response(result)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except OzonAPIError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OzonGetReviewsView(APIView):
    """
    Получить отзывы из Ozon
    POST /api/ai-reviews/ozon/reviews/
    {
        "status": "published",
        "limit": 100,
        "offset": 0,
        "with_product_info": true,
        "unanswered_only": false,
        "days_back": 30
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            service = _get_ozon_service(request.user)

            unanswered_only = request.data.get('unanswered_only', False)

            if unanswered_only:
                result = service.get_unanswered_reviews(
                    limit=request.data.get('limit', 100),
                    offset=request.data.get('offset', 0),
                    days_back=request.data.get('days_back', 30)
                )
            else:
                result = service.get_reviews(
                    status=request.data.get('status', 'published'),
                    limit=request.data.get('limit', 100),
                    offset=request.data.get('offset', 0),
                    with_product_info=request.data.get('with_product_info', True),
                    with_ratings=request.data.get('with_ratings', True)
                )
            return Response(result)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except OzonAPIError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OzonCommentReviewView(APIView):
    """
    Ответить на отзыв в Ozon
    POST /api/ai-reviews/ozon/comment/
    {
        "review_id": 123456,
        "text": "Текст ответа...",
        "is_public": true
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        review_id = request.data.get('review_id')
        text = request.data.get('text')

        if not review_id or not text:
            return Response(
                {'error': 'review_id и text обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = _get_ozon_service(request.user)
            result = service.comment_review(
                review_id=review_id,
                text=text,
                is_public=request.data.get('is_public', True)
            )
            return Response(result)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except OzonAPIError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OzonBatchCommentView(APIView):
    """
    Ответить на несколько отзывов в Ozon
    POST /api/ai-reviews/ozon/batch-comment/
    {
        "comments": [
            {"review_id": 123, "text": "Ответ 1", "is_public": true},
            {"review_id": 456, "text": "Ответ 2", "is_public": false}
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        comments = request.data.get('comments', [])

        if not comments:
            return Response(
                {'error': 'comments обязателен и должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = _get_ozon_service(request.user)
            result = service.batch_comment_reviews(comments)
            return Response(result)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except OzonAPIError as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)