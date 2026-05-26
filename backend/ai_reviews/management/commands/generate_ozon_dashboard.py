from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from ai_reviews.services.analytics_service import OzonComprehensiveAnalyticsService

User = get_user_model()


class Command(BaseCommand):
    help = 'Генерирует комплексную AI-аналитику для дашборда Ozon'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, help='ID конкретного пользователя')
        parser.add_argument('--all', action='store_true', help='Сгенерировать для всех пользователей')

    def handle(self, *args, **options):
        if options['all']:
            users = User.objects.all()
        elif options['user_id']:
            users = User.objects.filter(id=options['user_id'])
        else:
            users = User.objects.all()[:1]

        for user in users:
            self.stdout.write(f'🔄 Обработка пользователя: {user.email} (ID: {user.id})')

            service = OzonComprehensiveAnalyticsService(user, period='30d')
            result = service.get_or_generate()

            if result:
                self.stdout.write(self.style.SUCCESS(f'✅ Успешно сгенерировано и сохранено в БД'))
                summary = result.get('summary', {})
                self.stdout.write(f'   Рейтинг: {summary.get("overall_rating")}')
                self.stdout.write(f'   Проблема: {summary.get("main_problem")}')
            else:
                self.stdout.write(self.style.WARNING(f'⚠️ Нет данных или ошибка для пользователя {user.id}'))