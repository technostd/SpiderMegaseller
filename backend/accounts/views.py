from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import UserModuleConfig, ModuleConfigSchema

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

            # Сохраняем через валидатор
            UserModuleConfig.set_config(
                user=request.user,
                module_name=module_name,
                config=config
            )

            # Возвращаем нормализованный результат (на случай fallback'ов)
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