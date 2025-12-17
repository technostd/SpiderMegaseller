# ai_reviews/views_ozon.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.integrations.ozon import OzonServiceFactory, OzonAPIError


class OzonTestConnectionView(APIView):
    """
    Тест подключения к Ozon API

    POST /api/ai-reviews/ozon/test/
    {
        "api_key": "ваш_api_ключ",
        "client_id": "ваш_client_id"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = request.data.get('api_key')
        client_id = request.data.get('client_id')

        if not api_key or not client_id:
            return Response(
                {'error': 'api_key и client_id обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = OzonServiceFactory.create_service(api_key, client_id)
            result = service.test_connection()

            return Response(result)

        except OzonAPIError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class OzonGetReviewsView(APIView):
    """
    Получить отзывы из Ozon

    POST /api/ai-reviews/ozon/reviews/
    {
        "api_key": "ваш_api_ключ",
        "client_id": "ваш_client_id",
        "status": "published",  # published, unpublished, all
        "limit": 100,
        "offset": 0,
        "with_product_info": true,
        "unanswered_only": false,
        "days_back": 30
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = request.data.get('api_key')
        client_id = request.data.get('client_id')

        if not api_key or not client_id:
            return Response(
                {'error': 'api_key и client_id обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = OzonServiceFactory.create_service(api_key, client_id)

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

        except OzonAPIError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class OzonCommentReviewView(APIView):
    """
    Ответить на отзыв в Ozon

    POST /api/ai-reviews/ozon/comment/
    {
        "api_key": "ваш_api_ключ",
        "client_id": "ваш_client_id",
        "review_id": 123456,
        "text": "Текст ответа...",
        "is_public": true
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = request.data.get('api_key')
        client_id = request.data.get('client_id')
        review_id = request.data.get('review_id')
        text = request.data.get('text')

        if not all([api_key, client_id, review_id, text]):
            return Response(
                {'error': 'api_key, client_id, review_id и text обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = OzonServiceFactory.create_service(api_key, client_id)

            result = service.comment_review(
                review_id=review_id,
                text=text,
                is_public=request.data.get('is_public', True)
            )

            return Response(result)

        except OzonAPIError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class OzonBatchCommentView(APIView):
    """
    Ответить на несколько отзывов в Ozon

    POST /api/ai-reviews/ozon/batch-comment/
    {
        "api_key": "ваш_api_ключ",
        "client_id": "ваш_client_id",
        "comments": [
            {
                "review_id": 123,
                "text": "Ответ 1",
                "is_public": true
            },
            {
                "review_id": 456,
                "text": "Ответ 2",
                "is_public": false
            }
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = request.data.get('api_key')
        client_id = request.data.get('client_id')
        comments = request.data.get('comments', [])

        if not api_key or not client_id:
            return Response(
                {'error': 'api_key и client_id обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not comments:
            return Response(
                {'error': 'comments обязателен и должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = OzonServiceFactory.create_service(api_key, client_id)

            result = service.batch_comment_reviews(comments)

            return Response(result)

        except OzonAPIError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )