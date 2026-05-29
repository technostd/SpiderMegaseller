from celery import shared_task
from django.contrib.auth import get_user_model

from core.services.email_service import EmailService


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_transactional_email(
    self,
    user_id: int,
    template_name: str,
    context: dict,
    subject: str,
):
    try:
        User = get_user_model()
        user = User.objects.get(id=user_id)

        success = EmailService.send(
            user=user,
            template_name=template_name,
            context=context,
            subject=subject,
        )

        if not success:
            return False

        return True

    except Exception as exc:
        raise self.retry(exc=exc)