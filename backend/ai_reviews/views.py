# ai_reviews/api/views.py
import json
import os
import sys
from pathlib import Path
from venv import logger

import requests
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import ReviewAnalysis
from .serializers import ReviewAnalysisSerializer
from .services import OzonReviewProcessingService

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.core.integrations.yandex_gpt import yandex_gpt, YandexGPTError


class TestConnectionView(APIView):
    """Тест подключения к Yandex GPT API"""
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Проверяем базовые настройки
            test_result = {
                "api_key_set": bool(yandex_gpt.api_key),
                "folder_id": yandex_gpt.folder_id,
                "model_name": yandex_gpt.model_name,
                "base_url": yandex_gpt.base_url,
                "model_uri": f"gpt://{yandex_gpt.folder_id}/{yandex_gpt.model_name}",
                "timestamp": timezone.now().isoformat()
            }

            # Пробуем реальный запрос к API
            try:
                api_test = yandex_gpt.test_connection()
                test_result.update(api_test)

                if api_test.get("success"):
                    test_result["status"] = "✅ API подключено успешно"
                else:
                    test_result["status"] = f"❌ Ошибка API: {api_test.get('error')}"

            except Exception as e:
                test_result["api_test_error"] = str(e)
                test_result["status"] = f"❌ Ошибка теста: {str(e)}"

            # Дополнительная информация
            test_result["python_version"] = os.sys.version
            test_result["django_version"] = "4.2.0"

            return Response(test_result)

        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "type": type(e).__name__,
                    "status": "❌ Критическая ошибка"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AnalyzeReviewView(APIView):
    """
    API для анализа отзыва через Yandex GPT

    POST /api/ai-reviews/analyze/
    {
        "review_text": "текст отзыва",
        "product_model": "название товара",
        "original_rating": 4
    }
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Валидация
        review_text = request.data.get('review_text')

        if not review_text:
            return Response(
                {'error': 'Поле review_text обязательно'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Подготовка данных для анализа
        analysis_data = {
            'review_text': review_text,
            'product_model': request.data.get('product_model'),
            'original_rating': request.data.get('original_rating')
        }

        try:
            # Вызываем сервис Yandex GPT
            result = yandex_gpt.analyze_review(analysis_data)

            # Сохраняем результат в БД
            review_analysis = ReviewAnalysis(
                user=request.user,
                review_text=analysis_data['review_text'],
                product_model=analysis_data.get('product_model'),
                original_rating=analysis_data.get('original_rating'),
                tokens_used=result.get('meta', {}).get('tokens_used', 0),
                model_version=result.get('meta', {}).get('model', 'unknown'),
                is_success=True,
                # Сохраняем анализ как JSON объект
                analysis_data=result.get('analysis', {})
            )

            review_analysis.save()

            # Возвращаем результат
            return Response({
                'success': True,
                'analysis_id': review_analysis.id,
                'data': ReviewAnalysisSerializer(review_analysis).data,
                'meta': result.get('meta', {})
            })

        except YandexGPTError as e:
            # Сохраняем ошибку в БД
            review_analysis = ReviewAnalysis.objects.create(
                user=request.user,
                review_text=analysis_data['review_text'],
                product_model=analysis_data.get('product_model'),
                original_rating=analysis_data.get('original_rating'),
                is_success=False,
                error_message=str(e)
            )

            return Response({
                'success': False,
                'error': str(e),
                'analysis_id': review_analysis.id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Internal server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnalysisHistoryView(APIView):
    """
    История анализов пользователя
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analyses = ReviewAnalysis.objects.filter(
            user=request.user
        ).order_by('-created_at')

        page = self.paginate_queryset(analyses)
        if page is not None:
            serializer = ReviewAnalysisSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ReviewAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)

    def paginate_queryset(self, queryset):
        """Простая пагинация"""
        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        paginator.page_size = 10
        return paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data):
        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        return paginator.get_paginated_response(data)


class AnalysisDetailView(APIView):
    """
    Детали конкретного анализа
    """

    authentication_classes = [SessionAuthentication]  # Явно указываем
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):


        try:
            analysis = ReviewAnalysis.objects.get(
                id=analysis_id,
                user=request.user  # Только свои анализы
            )
            serializer = ReviewAnalysisSerializer(analysis)
            return Response('Data: ' + serializer.data)
        except ReviewAnalysis.DoesNotExist:
            return Response(
                {'error': 'Анализ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


# ai_reviews/views.py - добавим новый класс
class DirectApiTestView(APIView):
    """Прямой тест API Yandex GPT"""
    permission_classes = [AllowAny]

    def post(self, request):
        """Прямой вызов API с кастомным промптом"""
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
                "messages": [
                    {
                        "role": "user",
                        "text": prompt
                    }
                ]
            }

            print(f"[DIRECT TEST] Sending request to {yandex_gpt.base_url}")
            print(f"[DIRECT TEST] Data: {json.dumps(data, indent=2)}")

            response = requests.post(
                yandex_gpt.base_url,
                headers=headers,
                json=data,
                timeout=30
            )

            result = {
                "success": response.status_code == 200,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "request_data": data
            }

            if response.status_code == 200:
                result["response"] = response.json()
            else:
                result["error"] = response.text

            return Response(result)

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": str(e),
                    "type": type(e).__name__
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProcessOzonReviewsView(APIView):
    """
    POST /api/ai-reviews/process-ozon/
    Обрабатывает неотвеченные отзывы в Ozon:
    - получает,
    - сохраняет,
    - анализирует,
    - отвечает (если премодерация выключена).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        days_back = int(request.data.get('days_back', 30))
        if days_back < 1 or days_back > 90:
            return Response(
                {'error': 'days_back must be between 1 and 90'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            processor = OzonReviewProcessingService(request.user)
            result = processor.run(days_back=days_back)
            return Response(result)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("ProcessOzonReviewsView failed")
            return Response(
                {'error': 'Internal error', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )