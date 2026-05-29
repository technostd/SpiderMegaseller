from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from accounts.models import UserEmailPreferences
from core.services.email_service import EmailService


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="Spider Megaseller <notify@example.com>",
    FRONTEND_BASE_URL="http://localhost:5174",
    EMAIL_REPLY_TO="reply@example.com",
    EMAIL_UNSUBSCRIBE_EMAIL="unsubscribe@example.com",
)
class EmailServiceTests(TestCase):
    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

        self.preferences, _ = UserEmailPreferences.objects.get_or_create(
            user=self.user
        )

    def test_send_email_success(self):
        result = EmailService.send(
            user=self.user,
            template_name="gpt_error",
            context={
                "error_title": "Ошибка Yandex GPT",
                "error_message": "Тестовая ошибка AI-модели.",
                "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
            },
            subject="Ошибка AI-анализа",
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]

        self.assertEqual(email.subject, "Ошибка AI-анализа")
        self.assertEqual(email.to, ["test@example.com"])
        self.assertIn("Ошибка Yandex GPT", email.body)

        self.assertIn("List-Unsubscribe", email.extra_headers)
        self.assertIn("X-Auto-Response-Suppress", email.extra_headers)

    def test_email_not_sent_when_notifications_disabled(self):
        self.preferences.is_active = False
        self.preferences.save()

        result = EmailService.send(
            user=self.user,
            template_name="gpt_error",
            context={
                "error_title": "Ошибка Yandex GPT",
                "error_message": "Тестовая ошибка AI-модели.",
                "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
            },
            subject="Ошибка AI-анализа",
        )

        self.assertFalse(result)
        self.assertEqual(len(mail.outbox), 0)

    def test_gpt_error_not_sent_when_integration_errors_disabled(self):
        self.preferences.is_active = True
        self.preferences.notify_integration_errors = False
        self.preferences.save()

        result = EmailService.send(
            user=self.user,
            template_name="gpt_error",
            context={
                "error_title": "Ошибка Yandex GPT",
                "error_message": "Тестовая ошибка AI-модели.",
                "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
            },
            subject="Ошибка AI-анализа",
        )

        self.assertFalse(result)
        self.assertEqual(len(mail.outbox), 0)