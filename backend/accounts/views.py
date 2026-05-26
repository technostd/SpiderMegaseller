from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import UserModuleConfig, ModuleConfigSchema, MarketplaceCredentials
from .serializers import ExtendedUserProfileSerializer

User = get_user_model()

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "Доступ разрешён!",
            "user": request.user.email,
            "company": getattr(request.user.profile, 'company_name', None)
        })

class UserModuleConfigView(APIView):
    """
    GET /api/accounts/module-config/<module_name>/
    Получить конфиг модуля текущего пользователя

    POST /api/accounts/module-config/<module_name>/
    Обновить конфиг модуля
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, module_name: str):
        config = UserModuleConfig.get_config(
            user=request.user,
            module_name=module_name,
            default={}
        )
        return Response({
            'module_name': module_name,
            'config': config
        })

    def post(self, request, module_name: str):
        try:
            config = request.data.get('config', {})
            if not isinstance(config, dict):
                return Response(
                    {'error': 'config must be an object'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            UserModuleConfig.set_config(
                user=request.user,
                module_name=module_name,
                config=config
            )

            saved_config = UserModuleConfig.get_config(
                user=request.user,
                module_name=module_name
            )

            return Response({
                'success': True,
                'module_name': module_name,
                'config': saved_config
            })

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ModuleSchemaView(APIView):
    """
    GET /api/accounts/module-config/schema/<module_name>/
    Получить JSON Schema для модуля (для UI-валидации или docs)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, module_name: str):
        schema = ModuleConfigSchema.get_schema(module_name)
        if not schema:
            return Response({
                'warning': f'No schema defined for module "{module_name}"',
                'schema': {}
            })
        return Response({
            'module_name': module_name,
            'schema': schema
        })

class CredentialsView(APIView):
    """
    GET /api/accounts/credentials/ — получить все сохранённые ключи (маскированные)
    POST /api/accounts/credentials/ — сохранить/обновить ключи для маркетплейса
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Возвращает все креды пользователя (без чувствительных данных)"""
        creds = MarketplaceCredentials.objects.filter(user=request.user)
        result = {}
        for mp in ['ozon', 'wb', 'ym']:
            cred = creds.filter(marketplace=mp).first()
            if cred:
                result[mp] = {
                    'client_id': cred.client_id[:4] + '•••' if cred.client_id and len(cred.client_id) > 4 else None,
                    'api_key': cred.api_key[:4] + '•••' if cred.api_key and len(cred.api_key) > 4 else None,
                    'api_secret': cred.api_secret[:4] + '•••' if cred.api_secret and len(
                        cred.api_secret) > 4 else None,
                    'created_at': cred.created_at.isoformat(),
                    'updated_at': cred.updated_at.isoformat(),
                }
            else:
                result[mp] = None
        return Response(result)

    def post(self, request):
        """Сохраняет или обновляет ключи для указанного маркетплейса"""
        marketplace = request.data.get('marketplace')
        if not marketplace or marketplace not in ['ozon', 'wb', 'ym']:
            return Response(
                {'error': 'marketplace must be one of: ozon, wb, ym'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cred, created = MarketplaceCredentials.objects.update_or_create(
            user=request.user,
            marketplace=marketplace,
            defaults={
                'client_id': request.data.get('client_id', ''),
                'api_key': request.data.get('api_key', ''),
                'api_secret': request.data.get('api_secret', ''),
            }
        )
        return Response({
            'success': True,
            'marketplace': marketplace,
            'created': created,
            'message': 'Ключи успешно сохранены'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    GET /api/user/profile/
    Возвращает расширенную информацию о профиле текущего пользователя
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = ExtendedUserProfileSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        """
        Обновление профиля (опционально)
        PATCH /api/user/profile/
        {
            "phone": "+7 (999) 123-45-67",
            "company_name": "Новое название"
        }
        """
        user = request.user
        profile = user.profile

        phone = request.data.get('phone')

        company_name = request.data.get('company_name')
        if company_name is not None:
            profile.company_name = company_name
            profile.save(update_fields=['company_name'])

        serializer = ExtendedUserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)