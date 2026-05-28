import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from accounts.models import UserEmailPreferences

logger = logging.getLogger(__name__)


class EmailService:
    TEMPLATE_PERMISSION_MAP = {
        "integration_error": "notify_integration_errors",
        "gpt_error": "notify_integration_errors",
        "moderation_digest": "notify_moderation_queue",
        "processing_report": "notify_processing_report",
        "credentials_updated": "notify_security",
        "security_login": "notify_security",
    }

    @staticmethod
    def send(user, template_name: str, context: dict, subject: str) -> bool:
        if not user or not user.is_authenticated:
            logger.warning("Email skipped: anonymous user")
            return False

        if not user.email:
            logger.warning("Email skipped: user %s has no email", user.id)
            return False

        preferences, _ = UserEmailPreferences.objects.get_or_create(user=user)

        if not preferences.is_active:
            logger.info("Email skipped: notifications disabled for user %s", user.id)
            return False

        permission_field = EmailService.TEMPLATE_PERMISSION_MAP.get(template_name)

        if permission_field and not getattr(preferences, permission_field, False):
            logger.info(
                "Email skipped: user %s disabled %s",
                user.id,
                permission_field,
            )
            return False

        html_content = render_to_string(
            f"emails/{template_name}.html",
            context,
        )

        text_content = strip_tags(html_content)

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )

        message.attach_alternative(html_content, "text/html")

        try:
            message.send()
            logger.info("Email sent to %s using template %s", user.email, template_name)
            return True

        except Exception as exc:
            logger.exception("Email sending failed to %s: %s", user.email, exc)
            return False