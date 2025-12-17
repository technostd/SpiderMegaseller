import openai
import json
import os
import re
from typing import Dict, Optional
from django.conf import settings
from django.utils import timezone

from ..prompts.system_prompt import SYSTEM_PROMPT
from ..prompts.user_prompt import create_user_prompt


class YandexGPTError(Exception):
    """Ошибка работы с Yandex GPT API"""
    pass


class YandexGPT:
    """
    OpenAI-совместимый клиент для Yandex GPT API
    """

    def __init__(self):
        self.api_key = self._get_setting('YANDEX_GPT_API_KEY')
        self.folder_id = self._get_setting('YANDEX_GPT_FOLDER_ID', 'b1gdhgonqqt76p6nk3cd')
        self.model_name = self._get_setting('YANDEX_GPT_MODEL_NAME', 'yandexgpt/latest')
        self.base_url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

        if not self.api_key:
            print("[WARNING] YANDEX_GPT_API_KEY не настроен. Использую mock режим.")
            self.client = None
            self.mock_mode = True
        else:
            self.mock_mode = False
            try:
                self.client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url="https://llm.api.cloud.yandex.net/v1",
                    default_headers={
                        "x-folder-id": self.folder_id
                    }
                )
                print(f"[INFO] YandexGPT (OpenAI-совместимый) инициализирован")
                print(f"       Model: gpt://{self.folder_id}/{self.model_name}")
            except Exception as e:
                print(f"[ERROR] Не удалось инициализировать OpenAI клиент: {str(e)}")
                self.client = None
                self.mock_mode = True

    def _get_setting(self, name: str, default: Optional[str] = None) -> Optional[str]:
        """Получить настройку"""
        value = getattr(settings, name, None)
        if not value:
            value = os.environ.get(name, default)
        return value

    def analyze_review(self, review_data: Dict) -> Dict:
        """
        Анализ отзыва через Yandex GPT (OpenAI-совместимый API)

        Args:
            review_data: {
                "review_text": str,
                "product_model": str (optional),
                "original_rating": int (optional)
            }

        Returns:
            Результат анализа
        """
        if self.mock_mode or not self.client:
            return self._mock_analysis(review_data)

        try:
            user_prompt = create_user_prompt(
                review_text=review_data.get('review_text', ''),
                product_model=review_data.get('product_model'),
                rating=review_data.get('original_rating')
            )

            print(f"[DEBUG] Отправка запроса в Yandex GPT...")

            response = self.client.chat.completions.create(
                model=f"gpt://{self.folder_id}/{self.model_name}",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=3000,
                stream=False
            )

            response_text = response.choices[0].message.content.strip()
            print(f"[DEBUG] Получен ответ ({len(response_text)} chars)")

            try:
                analysis_data = json.loads(response_text)
            except json.JSONDecodeError:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    analysis_data = self._create_structured_from_text(response_text, review_data)

            validated_data = self._validate_analysis_structure(analysis_data, review_data)

            return {
                "success": True,
                "analysis": validated_data,
                "meta": {
                    "model": f"gpt://{self.folder_id}/{self.model_name}",
                    "tokens_used": response.usage.total_tokens,
                    "timestamp": timezone.now().isoformat(),
                    "api_type": "openai_compatible"
                }
            }

        except openai.APIError as e:
            print(f"[ERROR] OpenAI API error: {str(e)}")
            return self._mock_analysis(review_data)
        except Exception as e:
            print(f"[ERROR] Ошибка анализа: {str(e)}")
            return self._mock_analysis(review_data)

    def _create_structured_from_text(self, text: str, review_data: Dict) -> Dict:
        """Создаем структурированный ответ из текста"""
        return {
            "review_data": {
                "product_model": review_data.get('product_model'),
                "original_rating": review_data.get('original_rating', 3),
                "review_text": review_data.get('review_text', ''),
                "review_date": timezone.now().isoformat(),
                "extracted_rating_change": None
            },
            "generated_response": {
                "response_text": text,
                "response_tone": "Нейтральный",
                "response_purpose": "Поблагодарить",
                "key_points_addressed": []
            },
            "analysis": {
                "overall_sentiment": {
                    "sentiment": "Нейтральный",
                    "sentiment_score": 0.0,
                    "main_emotion": "Нейтрален"
                },
                "mentioned_aspects": {
                    "product_related": [],
                    "service_related": [],
                    "logistics_related": []
                },
                "identified_issues": [],
                "key_phrases": {
                    "positive_phrases": [],
                    "negative_phrases": [],
                    "suggestions": []
                },
                "summary": {
                    "main_problem": "",
                    "priority_level": "Средний",
                    "recommended_action": "Мониторинг"
                }
            }
        }

    def _validate_analysis_structure(self, analysis_data: Dict, original_data: Dict) -> Dict:
        """Базовая валидация структуры анализа"""
        validated = {
            "review_data": {
                "product_model": original_data.get('product_model'),
                "original_rating": original_data.get('original_rating', 3),
                "review_date": timezone.now().isoformat(),
                "review_text": original_data.get('review_text', ''),
                "extracted_rating_change": None
            },
            "generated_response": {
                "response_text": "",
                "response_tone": "Нейтральный",
                "response_purpose": "Поблагодарить",
                "key_points_addressed": []
            },
            "analysis": {
                "overall_sentiment": {
                    "sentiment": "Нейтральный",
                    "sentiment_score": 0.0,
                    "main_emotion": "Нейтрален"
                },
                "mentioned_aspects": {
                    "product_related": [],
                    "service_related": [],
                    "logistics_related": []
                },
                "identified_issues": [],
                "key_phrases": {
                    "positive_phrases": [],
                    "negative_phrases": [],
                    "suggestions": []
                },
                "summary": {
                    "main_problem": "",
                    "priority_level": "Средний",
                    "recommended_action": "Мониторинг"
                }
            }
        }

        def deep_update(target, source):
            for key, value in source.items():
                if key in target:
                    if isinstance(value, dict) and isinstance(target[key], dict):
                        deep_update(target[key], value)
                    else:
                        target[key] = value

        deep_update(validated, analysis_data)

        if not validated["generated_response"]["response_text"]:
            product_name = validated["review_data"]["product_model"] or "товаре"
            validated["generated_response"]["response_text"] = (
                f"Уважаемый клиент, благодарим вас за отзыв о {product_name}! "
                f"Мы ценим ваше мнение. "
                f"Для решения индивидуальных вопросов, пожалуйста, обратитесь в службу поддержки через личный кабинет на Ozon."
            )

        return validated

    def _mock_analysis(self, review_data: Dict) -> Dict:
        """Mock анализ для разработки"""
        rating = review_data.get('original_rating', 3)
        product = review_data.get('product_model')
        review_text = review_data.get('review_text', '')

        if rating >= 4:
            sentiment = "Позитивный"
            emotion = "Доволен"
            tone = "Благодарный"
            purpose = "Поблагодарить"
            score = 0.8
        elif rating <= 2:
            sentiment = "Негативный"
            emotion = "Разочарован"
            tone = "Извиняющийся"
            purpose = "Извиниться"
            score = -0.6
        else:
            sentiment = "Нейтральный"
            emotion = "Нейтрален"
            tone = "Нейтральный"
            purpose = "Поблагодарить"
            score = 0.1

        issues = []
        if rating < 4:
            issues = [
                {
                    "issue_category": "Качество товара",
                    "issue_description": "Требуется улучшение качества продукции",
                    "mentioned_in_text": review_text[:50] + "..." if review_text else "Не указано",
                    "severity_level": "Средняя",
                    "potential_solutions": ["Улучшить контроль качества", "Обновить материалы"]
                }
            ]

        return {
            "success": True,
            "analysis": {
                "review_data": {
                    "product_model": product,
                    "original_rating": rating,
                    "review_date": timezone.now().isoformat(),
                    "review_text": review_text,
                    "extracted_rating_change": None
                },
                "generated_response": {
                    "response_text": f"Уважаемый клиент, благодарим вас за отзыв{' о ' + product if product else ''}! "
                                     f"Мы ценим ваше мнение. "
                                     f"Для решения индивидуальных вопросов, пожалуйста, обратитесь в службу поддержки через личный кабинет на Ozon.",
                    "response_tone": tone,
                    "response_purpose": purpose,
                    "key_points_addressed": ["качество", "сервис"] if issues else []
                },
                "analysis": {
                    "overall_sentiment": {
                        "sentiment": sentiment,
                        "sentiment_score": score,
                        "main_emotion": emotion
                    },
                    "mentioned_aspects": {
                        "product_related": ["качество", "функциональность"],
                        "service_related": [] if rating >= 4 else ["поддержка"],
                        "logistics_related": []
                    },
                    "identified_issues": issues,
                    "key_phrases": {
                        "positive_phrases": ["хороший товар"] if rating >= 4 else [],
                        "negative_phrases": ["требует улучшения"] if rating < 4 else [],
                        "suggestions": []
                    },
                    "summary": {
                        "main_problem": "Требуется улучшение качества" if rating < 4 else "",
                        "priority_level": "Средний" if rating < 4 else "Низкий",
                        "recommended_action": "Мониторинг" if rating < 4 else "Без действий"
                    }
                }
            },
            "meta": {
                "model": "gpt://mock/yandexgpt/latest",
                "tokens_used": 200,
                "timestamp": timezone.now().isoformat(),
                "mock_mode": True
            }
        }

    def test_connection(self) -> Dict:
        """Тест подключения к API"""
        if self.mock_mode or not self.client:
            return {
                "success": False,
                "error": "Mock mode - API недоступно",
                "mock_mode": True,
                "api_key_set": bool(self.api_key)
            }

        try:
            # Простой тестовый запрос
            response = self.client.chat.completions.create(
                model=f"gpt://{self.folder_id}/{self.model_name}",
                messages=[{"role": "user", "content": "Привет! Ответь 'OK'"}],
                temperature=0.1,
                max_tokens=10,
                stream=False
            )

            text = response.choices[0].message.content.strip()

            return {
                "success": True,
                "status": "connected",
                "response": text,
                "model": f"gpt://{self.folder_id}/{self.model_name}",
                "api_type": "openai_compatible",
                "tokens_used": response.usage.total_tokens
            }

        except openai.APIError as e:
            return {
                "success": False,
                "error": f"OpenAI API error: {str(e)}",
                "model": f"gpt://{self.folder_id}/{self.model_name}",
                "api_key_set": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": f"gpt://{self.folder_id}/{self.model_name}",
                "api_key_set": True
            }


try:
    yandex_gpt = YandexGPT()
    print("[SUCCESS] YandexGPT сервис инициализирован")
except Exception as e:
    print(f"[ERROR] Не удалось инициализировать YandexGPT: {str(e)}")


    class MockYandexGPT:
        def analyze_review(self, data):
            return self._mock_analysis(data)

        def test_connection(self):
            return {
                "success": False,
                "error": "Service initialization failed",
                "mock_mode": True
            }

        def _mock_analysis(self, review_data):
            rating = review_data.get('original_rating', 3)
            product = review_data.get('product_model')

            return {
                "success": True,
                "analysis": {
                    "review_data": {
                        "product_model": product,
                        "original_rating": rating,
                        "review_text": review_data.get('review_text', ''),
                        "review_date": timezone.now().isoformat(),
                        "extracted_rating_change": None
                    },
                    "generated_response": {
                        "response_text": f"Спасибо за отзыв о '{product if product else 'товаре'}'!",
                        "response_tone": "Нейтральный",
                        "response_purpose": "Поблагодарить",
                        "key_points_addressed": []
                    },
                    "analysis": {
                        "overall_sentiment": {
                            "sentiment": "Нейтральный",
                            "sentiment_score": 0.0,
                            "main_emotion": "Нейтрален"
                        },
                        "identified_issues": [],
                        "key_phrases": {
                            "positive_phrases": [],
                            "negative_phrases": [],
                            "suggestions": []
                        },
                        "summary": {
                            "main_problem": "",
                            "priority_level": "Средний",
                            "recommended_action": "Мониторинг"
                        }
                    }
                },
                "meta": {
                    "model": "gpt://mock/yandexgpt/latest",
                    "tokens_used": 100,
                    "timestamp": timezone.now().isoformat(),
                    "mock_mode": True
                }
            }


    yandex_gpt = MockYandexGPT()
