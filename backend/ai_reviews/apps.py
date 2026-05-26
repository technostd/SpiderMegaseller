from django.apps import AppConfig


class AiReviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_reviews'

    def ready(self):
        import ai_reviews.signals  # noqa: F401
