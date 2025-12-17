# ai_reviews/services.py

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import logging
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.models import ModuleConfigSchema
from .models import OzonReview, ReviewAnalysis
from backend.core.integrations.ozon import OzonServiceFactory, OzonAPIError
from backend.core.integrations.yandex_gpt import yandex_gpt, YandexGPTError

User = get_user_model()
logger = logging.getLogger(__name__)


class OzonReviewProcessingService:
    """
    Сервис для полной автоматической обработки неотвеченных отзывов в Ozon
    """

    def __init__(self, user: User):
        self.user = user

        cred = self.user.credentials.filter(marketplace='ozon').first()
        if not cred:
            raise ValueError("Ozon credentials not found for user")

        self.ozon_service = OzonServiceFactory.create_service(
            api_key=cred.api_key,
            client_id=cred.client_id
        )

        self.config = ModuleConfigSchema.get_config(
            user=self.user,
            module_name='ai_reviews',
            default={'premoderate': False}
        )

    def run(self, days_back: int = 30, limit: int = 100):
        """
        Основной метод — запускает полный цикл обработки
        """
        try:
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
                        review_obj = self._ensure_review_exists(ozon_review)
                        if not review_obj:
                            results.append({
                                'review_id': ozon_review.get('id'),
                                'status': 'skipped',
                                'reason': 'review already answered or no text'
                            })
                            continue

                        analysis = review_obj.analyses.filter(is_success=True).first()
                        if not analysis:
                            analysis = self._create_analysis(review_obj, ozon_review)
                            if not analysis or not analysis.is_success:
                                results.append({
                                    'review_id': ozon_review.get('id'),
                                    'status': 'analysis_failed',
                                    'analysis_id': analysis.id if analysis else None
                                })
                                continue

                        response_text = analysis.generated_response
                        if not response_text.strip():
                            response_text = (
                                "Спасибо за ваш отзыв! "
                                "Для решения индивидуальных вопросов, пожалуйста, "
                                "обратитесь в службу поддержки через личный кабинет на Ozon."
                            )

                        if len(response_text) > 10000:
                            response_text = response_text[:9997] + "..."

                        premoderate = self.config.get('premoderate', False)
                        review_id = ozon_review['id']

                        if premoderate:
                            review_obj.moderation_status = 'pending'
                            review_obj.save(update_fields=['moderation_status'])

                            results.append({
                                'review_id': review_id,
                                'status': 'pending_moderation',
                                'analysis_id': analysis.id,
                                'response_preview': response_text[:80] + '...'
                            })
                            continue

                        ozon_resp = self.ozon_service.comment_review(
                            review_id=review_id,
                            text=response_text,
                            is_public=True
                        )

                        if ozon_resp['success']:
                            review_obj.has_answer = True
                            review_obj.answer_text = response_text
                            review_obj.answer_posted_at = timezone.now()
                            review_obj.moderation_status = 'sent'
                            if ozon_resp['data'].get('response_data', {}).get('comment_id'):
                                review_obj.answer_ozon_id = ozon_resp['data']['response_data']['comment_id']
                            review_obj.save()

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

    def _ensure_review_exists(self, ozon_review: dict) -> OzonReview:
        """
        Сохраняет отзыв в БД, если его ещё нет
        """
        review_id = ozon_review['id']
        review_text = ozon_review.get('text', '').strip()
        product_info = ozon_review.get('product_info') or {}
        product_name = product_info.get('name', '')

        if ozon_review.get('company_answer') or ozon_review.get('company_answer_text'):
            return None

        if not review_text:
            return None

        try:
            review_obj = OzonReview.objects.get(
                user=self.user,
                review_id=review_id
            )
            logger.info(f"Отзыв уже существует: #{review_obj.id}")
            return review_obj
        except OzonReview.DoesNotExist:
            review_obj = OzonReview.objects.create(
                user=self.user,
                review_id=review_id,
                product_id=ozon_review.get('product_id', 0),
                offer_id=ozon_review.get('offer_id', ''),
                sku=ozon_review.get('sku', ''),
                text=review_text,
                rating=ozon_review.get('rating'),
                created_at=ozon_review.get('created_at') or timezone.now(),
                product_name=product_name,
                product_characteristics=product_info.get('characteristics', {}),
                has_answer=False,
                moderation_status='not_submitted'
            )
            logger.info(f"Создан новый отзыв: #{review_obj.id} для Ozon review #{review_id}")
            return review_obj

    def _create_analysis(self, review_obj: OzonReview, ozon_review: dict) -> ReviewAnalysis:
        """
        Создаёт анализ для отзыва через Yandex GPT
        """
        try:
            gpt_input = {
                'review_text': review_obj.text,
                'product_model': review_obj.product_name,
                'original_rating': review_obj.rating
            }

            gpt_result = yandex_gpt.analyze_review(gpt_input)

            analysis = ReviewAnalysis.objects.create(
                review=review_obj,
                analysis_data=gpt_result.get('analysis', {}),
                tokens_used=gpt_result.get('meta', {}).get('tokens_used', 0),
                model_version=gpt_result.get('meta', {}).get('model', 'unknown'),
                is_success=True,
                error_message=''
            )

            analysis.analysis_data.setdefault('meta', {})
            analysis.analysis_data['meta']['ozon_review_id'] = review_obj.review_id
            analysis.analysis_data['meta']['created_at_ozon'] = review_obj.created_at.isoformat()
            analysis.save(update_fields=['analysis_data'])

            logger.info(f"Создан анализ: #{analysis.id} для отзыва #{review_obj.id}")
            return analysis

        except YandexGPTError as e:
            logger.error(f"GPT error for review {review_obj.id}: {e}")
            return ReviewAnalysis.objects.create(
                review=review_obj,
                is_success=False,
                error_message=str(e),
                analysis_data={
                    'meta': {
                        'ozon_review_id': review_obj.review_id,
                        'error': str(e),
                        'fallback_mode': True
                    }
                }
            )
