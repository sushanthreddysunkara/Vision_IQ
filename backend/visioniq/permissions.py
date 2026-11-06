from rest_framework.permissions import BasePermission


class HasLegacyBearerToken(BasePermission):
    def has_permission(self, request, view):
        return bool(request.auth)
