import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class LegacyJWTAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return "Bearer"

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header:
            return None
        scheme, separator, token = header.partition(" ")
        if not separator or scheme.lower() != "bearer" or not token.strip():
            raise AuthenticationFailed("Invalid authorization header.")
        try:
            payload = jwt.decode(token.strip(), settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("id")
            if user_id is None:
                raise AuthenticationFailed("Invalid token payload.")
        except jwt.ExpiredSignatureError as error:
            raise AuthenticationFailed("Token has expired.") from error
        except jwt.InvalidTokenError as error:
            raise AuthenticationFailed("Invalid token.") from error
        return ({"id": user_id}, token.strip())
