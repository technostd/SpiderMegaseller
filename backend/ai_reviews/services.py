# ai_reviews/services.py

import logging
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from backend.core.integrations.ozon import OzonServiceFactory, OzonAPIError
from backend.core.integrations.yandex_gpt import yandex_gpt, YandexGPTError
from backend.accounts.models import ModuleConfigSchema
from .models import ReviewAnalysis

User = get_user_model()
logger = logging.getLogger(__name__)


class OzonReviewProcessingService:
    """
    Сервис для полной автоматической обработки неотвеченных отзывов в Ozon:
    1. Получить отзывы
    2. Сохранить в БД (если новые)
    3. Проанализировать через Yandex GPT
    4. Сохранить анализ
    5. Отправить ответ в Ozon (если разрешено настройками)
    """

    def __init__(self, user: User):
        self.user = user
        # Получаем Ozon-учётные данные
        cred = self.user.credentials.filter(marketplace='ozon').first()
        if not cred:
            raise ValueError("Ozon credentials not found for user")

        self.ozon_service = OzonServiceFactory.create_service(
            api_key=cred.api_key,
            client_id=cred.client_id
        )
        # Читаем конфиг модуля ai_reviews
        self.config = ModuleConfigSchema.get_config(
            user=self.user,
            module_name='ai_reviews',
            default={'premoderate': False}
        )

    def run(self, days_back: int = 30, limit: int = 100):
        """
        Основной метод — запускает полный цикл обработки.
        Возвращает dict с результатами.
        """
        try:
            # 1. Получаем неотвеченных отзывов из Ozon
            ozon_data = self.ozon_service.get_unanswered_reviews(
                days_back=days_back,
                limit=limit
            )
            if not ozon_data.get('success'):
                raise ValueError(f"Failed to fetch reviews: {ozon_data.get('error')}")

            reviews = ozon_data['data']['reviews']
            logger.info(f"[Ozon] Получено {len(reviews)} неотвеченных отзывов")

            results = []
            for ozon_review in reviews:
                try:
                    with transaction.atomic():
                        # 2. Сохраняем отзыв в БД (если ещё нет)
                        analysis = self._ensure_analysis_exists(ozon_review)
                        if not analysis:
                            results.append({
                                'review_id': ozon_review.get('id'),
                                'status': 'skipped',
                                'reason': 'review already answered or no text'
                            })
                            continue

                        # 3. Готовим текст ответа
                        response_text = analysis.generated_response
                        if not response_text.strip():
                            response_text = (
                                "Спасибо за ваш отзыв! "
                                "Для решения индивидуальных вопросов, пожалуйста, "
                                "обратитесь в службу поддержки через личный кабинет на Ozon."
                            )

                        # Ограничиваем длину (Ozon: max 10 000 chars)
                        if len(response_text) > 10000:
                            response_text = response_text[:9997] + "..."

                        # Обновляем анализ текстом ответа (на случай mock-режима)
                        analysis.analysis_data.setdefault('generated_response', {})
                        analysis.analysis_data['generated_response']['response_text'] = response_text
                        analysis.save(update_fields=['analysis_data'])

                        # 4. Решаем: отправлять или на модерацию?
                        premoderate = self.config.get('premoderate', False)
                        review_id = ozon_review['id']

                        if premoderate:
                            # Оставляем в статусе 'pending' — фронт обнаружит и покажет в модерации
                            results.append({
                                'review_id': review_id,
                                'status': 'pending_moderation',
                                'analysis_id': analysis.id,
                                'response_preview': response_text[:80] + '...'
                            })
                            continue

                        # 5. Отправляем ответ в Ozon
                        ozon_resp = self.ozon_service.comment_review(
                            review_id=review_id,
                            text=response_text,
                            is_public=True
                        )

                        if ozon_resp['success']:
                            # Обновляем запись анализа: помечаем как отправлено
                            analysis.analysis_data.setdefault('meta', {})
                            analysis.analysis_data['meta']['sent_to_ozon_at'] = timezone.now().isoformat()
                            analysis.analysis_data['meta']['ozon_comment_id'] = \
                                ozon_resp['data'].get('response_data', {}).get('comment_id', '')
                            analysis.save(update_fields=['analysis_data'])

                            results.append({
                                'review_id': review_id,
                                'status': 'sent',
                                'analysis_id': analysis.id,
                                'response_preview': response_text[:80] + '...'
                            })
                        else:
                            error_msg = ozon_resp.get('error', 'Unknown Ozon error')
                            results.append({
                                'review_id': review_id,
                                'status': 'ozon_send_failed',
                                'error': error_msg,
                                'analysis_id': analysis.id
                            })

                except Exception as e:
                    logger.exception(f"Ошибка обработки отзыва {ozon_review.get('id')}")
                    results.append({
                        'review_id': ozon_review.get('id'),
                        'status': 'processing_error',
                        'error': str(e)
                    })

            return {
                'success': True,
                'processed': len(reviews),
                'results': results,
                'timestamp': timezone.now().isoformat(),
                'days_back': days_back,
                'limit': limit,
                'config': {
                    'premoderate': self.config.get('premoderate', False)
                }
            }

        except (OzonAPIError, ValueError) as e:
            logger.error(f"[Ozon] API error: {e}")
            return {'success': False, 'error': f'Ozon API: {e}'}
        except Exception as e:
            logger.exception("Critical error in OzonReviewProcessingService.run")
            return {'success': False, 'error': str(e)}

    def _ensure_analysis_exists(self, ozon_review: dict):
        """
        Гарантирует, что для отзыва есть сохранённый анализ.
        Возвращает ReviewAnalysis или None (если отзыв уже отвечен или пустой).
        """
        review_id = ozon_review['id']
        review_text = ozon_review.get('text', '').strip()
        product_info = ozon_review.get('product_info') or {}
        product_name = product_info.get('name', '')

        # Пропускаем уже отвеченные
        if ozon_review.get('company_answer') or ozon_review.get('company_answer_text'):
            return None

        # Пропускаем пустые отзывы
        if not review_text:
            return None

        # Пытаемся найти существующий анализ по уникальному ключу:
        # review_text + product_model + user — не идеально, но работает при отсутствии OzonReview
        # В будущем заменим на external_id после миграции
        try:
            analysis = ReviewAnalysis.objects.get(
                user=self.user,
                review_text=review_text,
                product_model=product_name,
                original_rating=ozon_review.get('rating')
            )
            logger.info(f"Анализ уже существует: #{analysis.id}")
            return analysis
        except ReviewAnalysis.DoesNotExist:
            pass

        # Создаём новый анализ
        try:
            # Анализ через Yandex GPT
            gpt_input = {
                'review_text': review_text,
                'product_model': product_name,
                'original_rating': ozon_review.get('rating')
            }
            gpt_result = yandex_gpt.analyze_review(gpt_input)

            analysis = ReviewAnalysis.objects.create(
                user=self.user,
                review_text=review_text,
                product_model=product_name,
                original_rating=ozon_review.get('rating'),
                analysis_data=gpt_result.get('analysis', {}),
                tokens_used=gpt_result.get('meta', {}).get('tokens_used', 0),
                model_version=gpt_result.get('meta', {}).get('model', 'unknown'),
                is_success=True,
                # Добавляем метаданные Ozon-отзыва
            )
            # Сохраняем Ozon ID в analysis_data.meta для отслеживания
            analysis.analysis_data.setdefault('meta', {})
            analysis.analysis_data['meta']['ozon_review_id'] = review_id
            analysis.analysis_data['meta']['ozon_product_id'] = ozon_review.get('product_id')
            analysis.analysis_data['meta']['created_at_ozon'] = ozon_review.get('created_at')
            analysis.save(update_fields=['analysis_data'])

            logger.info(f"Создан новый анализ: #{analysis.id} для отзыва Ozon #{review_id}")
            return analysis

        except YandexGPTError as e:
            logger.error(f"GPT error for Ozon review {review_id}: {e}")
            # Даже при ошибке создаём заглушку (чтобы не пытаться снова)
            analysis = ReviewAnalysis.objects.create(
                user=self.user,
                review_text=review_text,
                product_model=product_name,
                original_rating=ozon_review.get('rating'),
                is_success=False,
                error_message=str(e),
                analysis_data={
                    'meta': {
                        'ozon_review_id': review_id,
                        'error': str(e),
                        'fallback_mode': True
                    }
                }
            )
            return None  # не отправляем ошибочные