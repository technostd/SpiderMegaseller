# Email-уведомления Spider Megaseller

## Что реализовано

В проект добавлена система транзакционных email-уведомлений через Yandex Cloud Postbox.

Реализованы:

* отправка писем через SMTP Yandex Postbox;
* HTML-шаблоны писем;
* сервис `EmailService`;
* Celery-задачи для отправки писем;
* пользовательские настройки email-уведомлений;
* API для получения и обновления настроек;
* frontend-страница `/lk/settings/email`;
* ссылка на настройки email со страницы интеграций;
* триггеры отправки писем при важных событиях.

## Переменные окружения

В файле `backend/.env` должны быть указаны:

```env
POSTBOX_LOGIN=your_yandex_postbox_key_id
POSTBOX_PASSWORD=your_yandex_postbox_secret_key
POSTBOX_FROM_EMAIL=notify@example.com

FRONTEND_BASE_URL=http://localhost:5174
EMAIL_REPLY_TO=reply@example.com
EMAIL_UNSUBSCRIBE_EMAIL=unsubscribe@example.com

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TASK_ALWAYS_EAGER=True
```

Важно: реальные ключи нельзя коммитить в Git. В репозитории должен лежать только `.env.example`.

## Email-настройки пользователя

Для каждого пользователя создаются настройки email-уведомлений:

* `is_active` — включает или отключает все email-уведомления;
* `notify_integration_errors` — ошибки интеграций и Yandex GPT;
* `notify_moderation_queue` — дайджест ответов на модерации;
* `moderation_digest_interval` — частота дайджеста: `immediate`, `hourly`, `daily`;
* `notify_processing_report` — отчёты обработки отзывов;
* `notify_security` — уведомления безопасности и изменения ключей.

API настроек:

```http
GET /api/accounts/email-preferences/
PATCH /api/accounts/email-preferences/
```

Frontend-страница:

```text
/lk/settings/email
```

## Шаблоны писем

Шаблоны находятся в:

```text
backend/templates/emails/
```

Основные шаблоны:

* `integration_error.html` — ошибка интеграции;
* `gpt_error.html` — ошибка AI-анализа;
* `processing_report.html` — отчёт обработки отзывов;
* `credentials_updated.html` — обновление ключей интеграции;
* `security_login.html` — вход в аккаунт;
* `moderation_digest.html` — дайджест ответов на модерации.

## Реализованные триггеры

### 1. Обновление ключей интеграции

Срабатывает при сохранении ключей маркетплейса.

Шаблон:

```text
credentials_updated
```

### 2. Ошибка Yandex GPT

Срабатывает при ошибке AI-анализа отзыва.

Шаблон:

```text
gpt_error
```

### 3. Ошибка Ozon API

Срабатывает при ошибке подключения или авторизации Ozon API.

Шаблон:

```text
integration_error
```

### 4. Отчёт обработки отзывов

Срабатывает после завершения обработки отзывов.

Шаблон:

```text
processing_report
```

### 5. Дайджест модерации

Срабатывает, если после обработки отзывов появились ответы со статусом `pending_moderation`.

Шаблон:

```text
moderation_digest
```

## Локальная проверка отправки письма

В backend:

```bash
python manage.py shell --interface python
```

Пример проверки:

```python
from django.contrib.auth import get_user_model
from core.tasks import send_transactional_email

User = get_user_model()
user = User.objects.first()

result = send_transactional_email.delay(
    user.id,
    "gpt_error",
    {
        "error_title": "Тестовая ошибка",
        "error_message": "Проверка отправки письма.",
        "dashboard_url": "http://localhost:5174/lk/module/ai-reviews",
    },
    "Проверка email"
)

print(result.status)
print(result.result)
```

Ожидаемый результат:

```text
SUCCESS
True
```

## Celery

Для локальной разработки используется режим:

```env
CELERY_TASK_ALWAYS_EAGER=True
```

В этом режиме `.delay()` выполняется сразу, без отдельного Celery worker.

Для production нужно поставить:

```env
CELERY_TASK_ALWAYS_EAGER=False
```

И отдельно запустить Redis и Celery worker:

```bash
celery -A core worker -l info
```

## Запуск проекта

Backend:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm run dev
```

Frontend обычно доступен по адресу:

```text
http://localhost:5174
```

Backend:

```text
http://localhost:8000
```

## Важные замечания

* Файл `backend/.env` не должен попадать в Git.
* Файл `backend/db.sqlite3` не должен попадать в Git.
* Папки `__pycache__` не должны попадать в Git.
* Для отправки писем у пользователя должен быть заполнен `user.email`.
* Если письмо не отправляется, сначала нужно проверить настройки пользователя в `/lk/settings/email`.
