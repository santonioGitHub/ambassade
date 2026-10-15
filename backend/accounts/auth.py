from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    """Session glissante : le jeton expire après N minutes sans requête (N = réglage Paramètre)."""

    def authenticate_credentials(self, key):
        from core.models import AppSettings
        user, token = super().authenticate_credentials(key)
        now = timezone.now()
        if now - token.created > timedelta(minutes=AppSettings.get().session_minutes):
            token.delete()
            raise AuthenticationFailed("Session expirée")
        type(token).objects.filter(pk=token.pk).update(created=now)
        return user, token
