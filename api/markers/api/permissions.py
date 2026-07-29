from django.conf import settings
from rest_framework.permissions import BasePermission


PLATFORM_KEYS = {
    'mobile': settings.CLIENT_API_KEY_MOBILE,
    'web': settings.CLIENT_API_KEY_WEB,
}


class HasClientApiKey(BasePermission):
    """
    Validates X-Api-Key header and sets request.client_platform to 'mobile' or 'web'.
    """
    message = 'Invalid or missing API key.'

    def has_permission(self, request, view):
        key = request.headers.get('X-Api-Key', '')
        for platform, valid_key in PLATFORM_KEYS.items():
            if key == valid_key:
                request.client_platform = platform
                return True
        return False
