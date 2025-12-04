import re
from django.utils.deprecation import MiddlewareMixin

class JWTAuthenticationMiddleware(MiddlewareMixin):

    def process_request(self, request):
        # Если нет заголовка Authorization, но есть cookie — подставим его
        if not request.META.get('HTTP_AUTHORIZATION'):
            auth_token = request.COOKIES.get('spider_auth')
            if auth_token:
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {auth_token}'