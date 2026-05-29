# ai_reviews/api/views.py
from core.tasks import send_transactional_email

import json
import logging
from pathlib import Path
import sys

import requests
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OzonReview, ReviewAnalysis
from .serializers import ReviewAnalysisSerializer
from .services.ozon_review_processing_service import OzonReviewProcessingService

from core.integrations.yandex_gpt import yandex_gpt, YandexGPTError

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TestConnectionView(APIView):
    """Тест подключения к Yandex GPT API"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            test_result = {
                "api_key_set": bool(yandex_gpt.api_key),
                "folder_id": yandex_gpt.folder_id,
                "model_name": yandex_gpt.model_name,
                "base_url": yandex_gpt.base_url,
                "model_uri": f"gpt://{yandex_gpt.folder_id}/{yandex_gpt.model_name}",
                "timestamp": timezone.now().isoformat(),
                "python_version": sys.version,
                "django_version": "4.2.0"
            }

            try:
                api_test = yandex_gpt.test_connection()
                test_result.update(api_test)
                test_result["status"] = "Подключение выполнено" if api_test.get("success") else \
                    f"❌ Ошибка API: {api_test.get('error')}"
            except Exception as e:
                test_result["api_test_error"] = str(e)
                test_result["status"] = f"❌ Ошибка теста: {str(e)}"

            return Response(test_result)

        except Exception as e:
            logger.exception("TestConnectionView failed")
            return Response(
                {"error": str(e), "type": type(e).__name__, "status": "❌ Критическая ошибка"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DirectApiTestView(APIView):
    """Прямой тест API Yandex GPT"""
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            prompt = request.data.get('prompt', 'Привет! Как дела?')

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Api-Key {yandex_gpt.api_key}",
                "x-folder-id": yandex_gpt.folder_id,
            }

            data = {
                "modelUri": f"gpt://{yandex_gpt.folder_id}/{yandex_gpt.model_name}",
                "completionOptions": {
                    "stream": False,
                    "temperature": 0.2,
                    "maxTokens": "100"
                },
                "messages": [{"role": "user", "text": prompt}]
            }

            logger.info(f"[DIRECT TEST] Sending to {yandex_gpt.base_url}")
            response = requests.post(yandex_gpt.base_url, headers=headers, json=data, timeout=30)

            result = {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "request_data": data
            }

            if response.status_code == 200:
                result["response"] = response.json()
            else:
                result["error"] = response.text

            return Response(result)

        except Exception as e:
            logger.exception("DirectApiTestView failed")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalyzeReviewView(APIView):
    """
    Анализ существующего отзыва Ozon через Yandex GPT.
    POST /api/ai-reviews/analyze/
    {
        "ozon_review_id": 123456789   # ← review_id из Ozon (не pk!)
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        review_id = request.data.get('ozon_review_id')
        if not review_id:
            return Response(
                {'error': 'Поле ozon_review_id обязательно'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ozon_review = OzonReview.objects.get(
                user=request.user,
                review_id=review_id
            )
        except ObjectDoesNotExist:
            return Response(
                {'error': f'Отзыв с ID {review_id} не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        existing_analysis = ozon_review.analyses.filter(is_success=True).first()
        if existing_analysis:
            return Response({
                'message': 'Анализ уже существует',
                'analysis': ReviewAnalysisSerializer(existing_analysis).data
            })

        try:
            analysis_input = {
                'review_text': ozon_review.text,
                'product_model': ozon_review.product_name,
                'original_rating': ozon_review.rating,
                'product_characteristics': ozon_review.product_characteristics
            }

            result = yandex_gpt.analyze_review(analysis_input)

            analysis = ReviewAnalysis.objects.create(
                review=ozon_review,
                analysis_data=result.get('analysis', {}),
                tokens_used=result.get('meta', {}).get('tokens_used', 0),
                model_version=result.get('meta', {}).get('model', 'unknown'),
                is_success=True
            )

            return Response({
                'success': True,
                'analysis_id': analysis.id,
                'data': ReviewAnalysisSerializer(analysis).data,
                'meta': result.get('meta', {})
            }, status=status.HTTP_201_CREATED)

        except YandexGPTError as e:
            analysis = ReviewAnalysis.objects.create(
                review=ozon_review,
                is_success=False,
                error_message=str(e)
            )

            send_transactional_email.delay(
                request.user.id,
                "gpt_error",
                {
                    "error_title": "Ошибка Yandex GPT",
                    "error_message": str(e),
                    "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
                },
                "Ошибка AI-анализа"
            )

            return Response({
                'success': False,
                'error': str(e),
                'analysis_id': analysis.id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.exception("AnalyzeReviewView failed for review_id=%s", review_id)
            return Response({
                'success': False,
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalysisHistoryView(APIView):
    """История анализов пользователя (через связанные отзывы)"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        analyses = ReviewAnalysis.objects.filter(
            review__user=request.user
        ).select_related('review').order_by('-created_at')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(analyses, request)
        if page is not None:
            serializer = ReviewAnalysisSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ReviewAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)


class AnalysisDetailView(APIView):
    """Детали конкретного анализа"""
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            analysis = ReviewAnalysis.objects.select_related('review').get(
                id=analysis_id,
                review__user=request.user
            )
            serializer = ReviewAnalysisSerializer(analysis)
            return Response(serializer.data)
        except ReviewAnalysis.DoesNotExist:
            return Response(
                {'error': 'Анализ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


class ProcessOzonReviewsView(APIView):
    """
    POST /api/ai-reviews/process-ozon/
    Запуск полного цикла:
    - загрузка отзывов из Ozon за N дней,
    - сохранение в OzonReview,
    - анализ через Yandex GPT → ReviewAnalysis,
    - (опционально) отправка ответов.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        days_back = int(request.data.get('days_back', 30))
        if not (1 <= days_back <= 90):
            return Response(
                {'error': 'days_back must be between 1 and 90'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            processor = OzonReviewProcessingService(request.user)
            result = processor.run(days_back=days_back)

            total_count = (
                result.get("total_count")
                or result.get("total")
                or result.get("reviews_count")
                or result.get("processed_total")
                or 0
            )

            success_count = (
                result.get("success_count")
                or result.get("processed_count")
                or result.get("success")
                or 0
            )

            failed_count = (
                result.get("failed_count")
                or result.get("errors_count")
                or result.get("failed")
                or 0
            )

            send_transactional_email.delay(
                request.user.id,
                "processing_report",
                {
                    "total_count": total_count,
                    "success_count": success_count,
                    "failed_count": failed_count,
                    "dashboard_url": "http://localhost:5174/lk/module/ai-reviews/ozon-analytics",
                },
                "Обработка отзывов завершена"
            )

            return Response(result)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("ProcessOzonReviewsView failed")

            send_transactional_email.delay(
                request.user.id,
                "gpt_error",
                {
                    "error_title": "Ошибка обработки отзывов",
                    "error_message": str(e),
                    "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
                },
                "Ошибка AI-анализа"
            )

            return Response(
                {'error': 'Internal error', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DemoAnalyzeView(APIView):
    """
    Демо-анализ текста отзыва БЕЗ привязки к Ozon.
    Не сохраняет данные в БД (или сохраняет анонимно — см. ниже).
    Используется для фронтенда, демо, тестов.

    POST /api/ai-reviews/demo/analyze/
    {
        "review_text": "Ужасный товар, сломался через день!",
        "product_name": "Беспроводные наушники XYZ-200",
        "rating": 2
    }
    """
    permission_classes = [AllowAny]  # можно и IsAuthenticated — как нужно

    def post(self, request):
        review_text = request.data.get('review_text')
        product_name = request.data.get('product_name', '')
        rating = request.data.get('rating')

        if not review_text:
            return Response(
                {'error': 'review_text обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            analysis_input = {
                'review_text': review_text,
                'product_model': product_name,
                'original_rating': rating,
                'product_characteristics': {}
            }

            result = yandex_gpt.analyze_review(analysis_input)

            return Response({
                'success': True,
                'demo': True,
                'analysis': result.get('analysis', {}),
                'meta': result.get('meta', {}),
                'generated_response': result.get('analysis', {}).get('generated_response', {}).get('response_text', ''),
                'sentiment': result.get('analysis', {}).get('overall_sentiment', {}).get('sentiment', ''),
                'issues_count': len(result.get('analysis', {}).get('identified_issues', []))
            }, status=status.HTTP_200_OK)

        except YandexGPTError as e:
            return Response({
                'success': False,
                'demo': True,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("DemoAnalyzeView failed")
            return Response({
                'success': False,
                'demo': True,
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
