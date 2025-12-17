# core/integrations/ozon.py
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.utils import timezone


class OzonAPIError(Exception):
    """Ошибка работы с Ozon API"""
    pass


class OzonService:
    """
    Сервис для работы с Ozon Seller API

    Документация: https://docs.ozon.ru/api/seller/
    """

    BASE_URL = "https://api-seller.ozon.ru"

    def __init__(self, api_key: str, client_id: str):
        """
        Инициализация сервиса

        Args:
            api_key: API ключ продавца
            client_id: Client ID продавца
        """
        self.api_key = api_key
        self.client_id = client_id

        if not api_key or not client_id:
            raise OzonAPIError("API ключ и Client ID обязательны")

        self.headers = {
            "Client-Id": str(client_id),
            "Api-Key": api_key,
            "Content-Type": "application/json"
        }

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """
        Базовый метод для запросов к API

        Args:
            method: HTTP метод (GET, POST, etc.)
            endpoint: API endpoint
            data: Данные для запроса

        Returns:
            Ответ API
        """
        url = f"{self.BASE_URL}{endpoint}"

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, params=data, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=30)
            else:
                raise OzonAPIError(f"Неподдерживаемый метод: {method}")

            print(f"[OzonAPI] {method} {endpoint} - Status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()

                if result.get("error"):
                    error_msg = result["error"].get("message", "Unknown error")
                    raise OzonAPIError(f"Ozon API error: {error_msg}")

                return result
            else:
                error_text = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get("message", error_json.get("error", error_text))
                except:
                    error_msg = error_text

                raise OzonAPIError(f"HTTP {response.status_code}: {error_msg}")

        except requests.exceptions.Timeout:
            raise OzonAPIError("Таймаут подключения к Ozon API")
        except requests.exceptions.ConnectionError:
            raise OzonAPIError("Ошибка подключения к Ozon API")
        except requests.exceptions.RequestException as e:
            raise OzonAPIError(f"Ошибка запроса: {str(e)}")

    def get_reviews(
            self,
            status: str = "published",
            limit: int = 100,
            offset: int = 0,
            with_product_info: bool = True,
            with_ratings: bool = True
    ) -> Dict:
        """
        Получить список отзывов

        Args:
            status: Статус отзыва (published, unpublished, all)
            limit: Количество отзывов (макс 1000)
            offset: Смещение
            with_product_info: Загружать дополнительную информацию о товаре
            with_ratings: Загружать рейтинги

        Returns:
            Список отзывов с дополнительной информацией
        """
        try:
            data = {
                "filter": {
                    "visibility": status.upper()
                },
                "limit": min(limit, 1000),
                "offset": offset,
                "with_photo": True,
                "with_rating": with_ratings
            }

            response = self._make_request("POST", "/v1/review/list", data)

            reviews = response.get("result", {}).get("reviews", [])
            total = response.get("result", {}).get("total", 0)

            print(f"[OzonAPI] Получено {len(reviews)} отзывов из {total}")

            if with_product_info and reviews:
                reviews = self._enrich_reviews_with_product_info(reviews)

            return {
                "success": True,
                "data": {
                    "reviews": reviews,
                    "total": total,
                    "has_more": total > offset + len(reviews),
                    "next_offset": offset + len(reviews) if total > offset + len(reviews) else None
                },
                "meta": {
                    "status": status,
                    "limit": limit,
                    "offset": offset,
                    "timestamp": timezone.now().isoformat()
                }
            }

        except Exception as e:
            raise OzonAPIError(f"Ошибка получения отзывов: {str(e)}")

    def _enrich_reviews_with_product_info(self, reviews: List[Dict]) -> List[Dict]:
        """
        Обогатить отзывы информацией о товарах

        Args:
            reviews: Список отзывов

        Returns:
            Обогащенные отзывы
        """
        try:
            product_ids = []
            sku_to_review_idx = {}

            for idx, review in enumerate(reviews):
                product_id = review.get("product_id")
                sku = review.get("sku")

                if product_id:
                    product_ids.append(str(product_id))
                    sku_to_review_idx[str(product_id)] = idx
                elif sku:
                    product_info = self.get_product_info_by_sku(sku)
                    if product_info and "id" in product_info:
                        product_ids.append(str(product_info["id"]))
                        sku_to_review_idx[str(product_info["id"])] = idx
                        reviews[idx]["product_id"] = product_info["id"]

            if not product_ids:
                return reviews

            products_info = self.get_products_info(product_ids)

            for product_id, product_info in products_info.items():
                if product_id in sku_to_review_idx:
                    idx = sku_to_review_idx[product_id]

                    reviews[idx]["product_info"] = {
                        "name": product_info.get("name", ""),
                        "offer_id": product_info.get("offer_id", ""),
                        "sku": product_info.get("sku", 0),
                        "category_id": product_info.get("category_id", 0),
                        "images": product_info.get("images", []),
                        "attributes": product_info.get("attributes", []),
                        "description": product_info.get("description", ""),
                        "price": product_info.get("price", ""),
                        "vat": product_info.get("vat", "")
                    }

                    characteristics = {}
                    for attr in product_info.get("attributes", []):
                        if attr.get("attribute_id") and attr.get("values"):
                            attr_name = attr.get("name", f"attr_{attr['attribute_id']}")
                            characteristics[attr_name] = attr["values"][0].get("value", "")

                    reviews[idx]["product_info"]["characteristics"] = characteristics

            return reviews

        except Exception as e:
            print(f"[OzonAPI] Ошибка обогащения отзывов: {str(e)}")
            return reviews

    def get_products_info(self, product_ids: List[str]) -> Dict[str, Dict]:
        """
        Получить информацию о товарах по их ID

        Args:
            product_ids: Список ID товаров

        Returns:
            Словарь с информацией о товарах
        """
        try:
            if not product_ids:
                return {}

            batch_size = 1000
            all_products = {}

            for i in range(0, len(product_ids), batch_size):
                batch = product_ids[i:i + batch_size]

                data = {
                    "product_id": batch,
                    "visibility": "ALL"
                }

                response = self._make_request("POST", "/v2/product/info/list", data)
                items = response.get("result", {}).get("items", [])

                for item in items:
                    product_id = str(item.get("id"))
                    all_products[product_id] = item

            return all_products

        except Exception as e:
            print(f"[OzonAPI] Ошибка получения информации о товарах: {str(e)}")
            return {}

    def get_product_info_by_sku(self, sku: int) -> Optional[Dict]:
        """
        Получить информацию о товаре по SKU

        Args:
            sku: SKU товара

        Returns:
            Информация о товаре или None
        """
        try:
            data = {
                "filter": {
                    "offer_id": [],
                    "product_id": [],
                    "visibility": "ALL"
                },
                "limit": 1,
                "sort_by": "CREATED_AT",
                "sort_dir": "DESC"
            }

            response = self._make_request("POST", "/v2/product/list", data)
            items = response.get("result", {}).get("items", [])

            for item in items:
                if item.get("sku") == sku:
                    return item

            return None

        except Exception as e:
            print(f"[OzonAPI] Ошибка поиска товара по SKU: {str(e)}")
            return None

    def get_unanswered_reviews(
            self,
            limit: int = 100,
            offset: int = 0,
            days_back: int = 30
    ) -> Dict:
        """
        Получить отзывы без ответов

        Args:
            limit: Количество отзывов
            offset: Смещение
            days_back: За сколько дней искать отзывы

        Returns:
            Отзывы без ответов
        """
        try:
            all_reviews = self.get_reviews(
                status="published",
                limit=limit,
                offset=offset,
                with_product_info=True,
                with_ratings=True
            )

            if not all_reviews["success"]:
                return all_reviews

            reviews = all_reviews["data"]["reviews"]

            unanswered_reviews = []
            for review in reviews:
                has_answer = bool(review.get("company_answer") or review.get("company_answer_text"))

                if days_back:
                    review_date_str = review.get("created_at")
                    if review_date_str:
                        try:
                            review_date = datetime.fromisoformat(review_date_str.replace('Z', '+00:00'))
                            cutoff_date = timezone.now() - timedelta(days=days_back)

                            if review_date < cutoff_date:
                                continue
                        except:
                            pass

                if not has_answer:
                    unanswered_reviews.append(review)

            return {
                "success": True,
                "data": {
                    "reviews": unanswered_reviews,
                    "total": len(unanswered_reviews),
                    "has_more": all_reviews["data"]["has_more"],
                    "next_offset": offset + len(reviews)
                },
                "meta": {
                    "days_back": days_back,
                    "timestamp": timezone.now().isoformat()
                }
            }

        except Exception as e:
            raise OzonAPIError(f"Ошибка получения отзывов без ответов: {str(e)}")

    def comment_review(
            self,
            review_id: int,
            text: str,
            is_public: bool = True
    ) -> Dict:
        """
        Ответить на отзыв

        Args:
            review_id: ID отзыва
            text: Текст ответа
            is_public: Публичный ответ (True) или private (False)

        Returns:
            Результат операции
        """
        try:
            if not review_id:
                raise OzonAPIError("ID отзыва обязателен")

            if not text or len(text.strip()) < 1:
                raise OzonAPIError("Текст ответа не может быть пустым")

            if len(text) > 10000:
                text = text[:10000]

            data = {
                "review_id": int(review_id),
                "content": text.strip(),
                "is_public": is_public
            }

            print(f"[OzonAPI] Отправка ответа на отзыв {review_id}")

            response = self._make_request("POST", "/v1/review/comment/create", data)

            if response.get("result", {}).get("status") == "success":
                return {
                    "success": True,
                    "data": {
                        "review_id": review_id,
                        "message": "Ответ успешно отправлен",
                        "is_public": is_public,
                        "response_data": response
                    },
                    "meta": {
                        "timestamp": timezone.now().isoformat()
                    }
                }
            else:
                raise OzonAPIError(f"Ошибка отправки ответа: {response}")

        except Exception as e:
            raise OzonAPIError(f"Ошибка отправки ответа на отзыв: {str(e)}")

    def batch_comment_reviews(self, comments: List[Dict]) -> Dict:
        """
        Отправить ответы на несколько отзывов

        Args:
            comments: Список комментариев в формате:
                [
                    {"review_id": 123, "text": "Ответ 1", "is_public": True},
                    {"review_id": 456, "text": "Ответ 2", "is_public": False},
                ]

        Returns:
            Результаты операций
        """
        try:
            if not comments:
                return {
                    "success": True,
                    "data": {
                        "processed": 0,
                        "succeeded": 0,
                        "failed": 0,
                        "results": []
                    }
                }

            results = []
            succeeded = 0
            failed = 0

            for comment in comments:
                try:
                    result = self.comment_review(
                        review_id=comment.get("review_id"),
                        text=comment.get("text", ""),
                        is_public=comment.get("is_public", True)
                    )

                    if result["success"]:
                        succeeded += 1
                    else:
                        failed += 1

                    results.append(result)

                except Exception as e:
                    failed += 1
                    results.append({
                        "success": False,
                        "error": str(e),
                        "review_id": comment.get("review_id")
                    })

            return {
                "success": succeeded > 0 or failed == 0,
                "data": {
                    "processed": len(comments),
                    "succeeded": succeeded,
                    "failed": failed,
                    "results": results
                },
                "meta": {
                    "timestamp": timezone.now().isoformat()
                }
            }

        except Exception as e:
            raise OzonAPIError(f"Ошибка пакетной отправки ответов: {str(e)}")

    def test_connection(self) -> Dict:
        """
        Тест подключения к API

        Returns:
            Результат теста
        """
        try:
            data = {
                "limit": 1,
                "offset": 0
            }

            response = self._make_request("POST", "/v1/review/list", data)

            return {
                "success": True,
                "data": {
                    "api_key_valid": True,
                    "client_id_valid": True,
                    "reviews_accessible": True,
                    "total_reviews": response.get("result", {}).get("total", 0)
                },
                "meta": {
                    "timestamp": timezone.now().isoformat()
                }
            }

        except OzonAPIError as e:
            return {
                "success": False,
                "error": str(e),
                "data": {
                    "api_key_valid": False,
                    "client_id_valid": False,
                    "reviews_accessible": False
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": {
                    "api_key_valid": "unknown",
                    "client_id_valid": "unknown",
                    "reviews_accessible": False
                }
            }


class OzonServiceFactory:
    """
    Фабрика для создания экземпляров OzonService
    """

    @staticmethod
    def create_service(api_key: str, client_id: str) -> OzonService:
        """
        Создать экземпляр OzonService

        Args:
            api_key: API ключ продавца
            client_id: Client ID продавца

        Returns:
            Экземпляр OzonService
        """
        return OzonService(api_key, client_id)

    @staticmethod
    def create_from_settings(settings_key: str = "default") -> Optional[OzonService]:
        """
        Создать сервис из настроек Django

        Args:
            settings_key: Ключ настроек в OZON_SETTINGS

        Returns:
            Экземпляр OzonService или None
        """
        from django.conf import settings

        ozon_settings = getattr(settings, 'OZON_SETTINGS', {})
        seller_settings = ozon_settings.get(settings_key, {})

        api_key = seller_settings.get('api_key')
        client_id = seller_settings.get('client_id')

        if api_key and client_id:
            return OzonService(api_key, client_id)

        return None
