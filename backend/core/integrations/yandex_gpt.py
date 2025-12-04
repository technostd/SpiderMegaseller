# core/integrations/yandex_gpt_openai.py
import openai
import json
import os
from typing import Dict, List, Optional
from django.conf import settings
from django.utils import timezone


class YandexGPTError(Exception):
    """Ошибка работы с Yandex GPT API"""
    pass


class YandexGPT:
    """
    OpenAI-совместимый клиент для Yandex GPT API
    """

    def __init__(self):
        # Получаем настройки
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
                # Инициализируем OpenAI клиент для Yandex
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
        # Если mock режим или нет клиента
        if self.mock_mode or not self.client:
            return self._mock_analysis(review_data)

        try:
            # Формируем промпт для JSON ответа
            system_prompt = self._create_system_prompt()
            user_prompt = self._create_user_prompt(review_data)

            print(f"[DEBUG] Отправка запроса в Yandex GPT...")

            # Отправляем запрос через OpenAI-совместимый API
            response = self.client.chat.completions.create(
                model=f"gpt://{self.folder_id}/{self.model_name}",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=2000,
                stream=False
            )

            # Получаем ответ
            response_text = response.choices[0].message.content.strip()
            print(f"[DEBUG] Получен ответ ({len(response_text)} chars)")

            # Пробуем распарсить JSON
            try:
                analysis_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Пробуем найти JSON в тексте
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    # Если не JSON, создаем структурированный ответ из текста
                    analysis_data = self._create_structured_from_text(response_text, review_data)

            # Валидируем и дополняем
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

    def _create_system_prompt(self) -> str:
        """Создаем системный промпт"""
        return """Ты - AI ассистент для анализа отзывов клиентов. 
        Твоя задача: проанализировать отзыв и вернуть результат в формате JSON.

        Структура JSON должна быть:
        {
            "review_data": {
                "product_model": "string",
                "original_rating": number,
                "review_text": "string"
            },
            "generated_response": {
                "response_text": "string",
                "response_tone": "formal/friendly/apologetic/neutral/grateful",
                "response_purpose": "thank/apologize/clarify/solve_issue/request_feedback"
            },
            "analysis": {
                "overall_sentiment": {
                    "sentiment": "positive/negative/neutral/mixed",
                    "sentiment_score": number (-1 to 1)
                },
                "identified_issues": [
                    {
                        "issue_category": "product_quality/logistics/customer_service/price",
                        "issue_description": "string",
                        "severity_level": "critical/high/medium/low"
                    }
                ]
            }
        }

        ВАЖНО: Отвечай ТОЛЬКО в формате JSON, без дополнительного текста."""

    def _create_user_prompt(self, review_data: Dict) -> str:
        """Создаем пользовательский промпт"""
        review_text = review_data.get('review_text', '').strip()
        product_model = review_data.get('product_model', 'Не указано').strip()
        rating = review_data.get('original_rating', 'Не указана')

        return f"""Проанализируй этот отзыв и верни результат в JSON формате:

ОТЗЫВ: {review_text}
МОДЕЛЬ ТОВАРА: {product_model}
ОЦЕНКА ПОЛЬЗОВАТЕЛЯ: {rating}/5

Проанализируй тон отзыва, выяви конкретные проблемы, сгенерируй вежливый ответ для владельца бизнеса."""

    def _create_structured_from_text(self, text: str, review_data: Dict) -> Dict:
        """Создаем структурированный ответ из текста"""
        return {
            "review_data": {
                "product_model": review_data.get('product_model', 'Не указано'),
                "original_rating": review_data.get('original_rating', 3),
                "review_text": review_data.get('review_text', '')
            },
            "generated_response": {
                "response_text": text,
                "response_tone": "neutral",
                "response_purpose": "thank"
            },
            "analysis": {
                "overall_sentiment": {
                    "sentiment": "neutral",
                    "sentiment_score": 0.0
                },
                "identified_issues": []
            }
        }

    def _validate_analysis_structure(self, analysis_data: Dict, original_data: Dict) -> Dict:
        """Валидация структуры анализа"""
        validated = {
            "review_data": {
                "product_model": original_data.get('product_model', 'Не указано'),
                "original_rating": original_data.get('original_rating', 3),
                "review_date": timezone.now().isoformat(),
                "review_text": original_data.get('review_text', ''),
                "extracted_rating_change": None
            },
            "generated_response": {
                "response_text": "",
                "response_tone": "neutral",
                "response_purpose": "thank",
                "key_points_addressed": []
            },
            "analysis": {
                "overall_sentiment": {
                    "sentiment": "neutral",
                    "sentiment_score": 0.0,
                    "main_emotion": "neutral"
                },
                "identified_issues": [],
                "summary": {
                    "main_problem": "",
                    "recommended_action": "monitor",
                    "priority_level": "medium"
                }
            }
        }

        # Рекурсивное обновление
        def deep_update(target, source):
            for key, value in source.items():
                if key in target:
                    if isinstance(value, dict) and isinstance(target[key], dict):
                        deep_update(target[key], value)
                    else:
                        target[key] = value

        deep_update(validated, analysis_data)

        # Гарантируем наличие текста ответа
        if not validated["generated_response"]["response_text"]:
            validated["generated_response"]["response_text"] = (
                f"Благодарим за отзыв о товаре '{validated['review_data']['product_model']}'. "
                f"Мы ценим ваше мнение."
            )

        return validated

    def _mock_analysis(self, review_data: Dict) -> Dict:
        """Mock анализ для разработки"""
        rating = review_data.get('original_rating', 3)
        product = review_data.get('product_model', 'Товар')

        sentiment = "positive" if rating >= 4 else "negative" if rating <= 2 else "neutral"

        return {
            "success": True,
            "analysis": {
                "review_data": {
                    "product_model": product,
                    "original_rating": rating,
                    "review_date": timezone.now().isoformat(),
                    "review_text": review_data.get('review_text', ''),
                    "extracted_rating_change": None
                },
                "generated_response": {
                    "response_text": f"Уважаемый клиент, благодарим за ваш отзыв о товаре '{product}'. "
                                     f"Мы ценим ваше мнение и обязательно учтем ваши замечания.",
                    "response_tone": "grateful" if rating >= 4 else "apologetic",
                    "response_purpose": "thank" if rating >= 4 else "apologize",
                    "key_points_addressed": ["качество", "сервис"]
                },
                "analysis": {
                    "overall_sentiment": {
                        "sentiment": sentiment,
                        "sentiment_score": 0.8 if rating >= 4 else -0.3 if rating <= 2 else 0.0,
                        "main_emotion": "satisfied" if rating >= 4 else "disappointed" if rating <= 2 else "neutral"
                    },
                    "identified_issues": [
                        {
                            "issue_category": "product_quality",
                            "issue_description": "Требуется улучшение качества продукции",
                            "severity_level": "medium",
                            "mentioned_in_text": review_data.get('review_text', '')[:50] + "...",
                            "potential_solutions": ["Улучшить контроль качества", "Обновить материалы"]
                        }
                    ] if rating < 4 else [],
                    "summary": {
                        "main_problem": "Требуется улучшение качества" if rating < 4 else "Отличный отзыв",
                        "recommended_action": "improvement" if rating < 4 else "no_action",
                        "priority_level": "medium" if rating < 4 else "low"
                    }
                }
            },
            "meta": {
                "model": "gpt://mock/yandexgpt/latest",
                "tokens_used": 150,
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


# Создаем экземпляр сервиса
try:
    yandex_gpt = YandexGPT()
    print("[SUCCESS] YandexGPT сервис инициализирован")
except Exception as e:
    print(f"[ERROR] Не удалось инициализировать YandexGPT: {str(e)}")


    # Fallback на mock
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
            # Та же mock логика что выше
            rating = review_data.get('original_rating', 3)
            product = review_data.get('product_model', 'Товар')

            return {
                "success": True,
                "analysis": {
                    "review_data": {
                        "product_model": product,
                        "original_rating": rating,
                        "review_text": review_data.get('review_text', ''),
                        "review_date": timezone.now().isoformat()
                    },
                    "generated_response": {
                        "response_text": f"Спасибо за отзыв о '{product}'!",
                        "response_tone": "neutral",
                        "response_purpose": "thank"
                    },
                    "analysis": {
                        "overall_sentiment": {"sentiment": "neutral", "sentiment_score": 0.0},
                        "identified_issues": []
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
