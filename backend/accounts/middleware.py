import re
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.META.get('HTTP_AUTHORIZATION'):
            auth_token = request.COOKIES.get('spider_auth')
            if auth_token:
                try:
                    jwt_auth = JWTAuthentication()
                    validated_token = jwt_auth.get_validated_token(auth_token)
                    user = jwt_auth.get_user(validated_token)
                    request.user = user
                    request.META['HTTP_AUTHORIZATION'] = f'Bearer {auth_token}'
                except Exception:
                    pass