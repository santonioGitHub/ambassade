from rest_framework.permissions import BasePermission, IsAuthenticated


def is_admin(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    p = getattr(user, "profile", None)
    return bool(p and p.role == "ADMIN")


class IsAdminRole(BasePermission):
    message = "Réservé à l'administrateur."

    def has_permission(self, request, view):
        return is_admin(request.user)


class AdminDeleteMixin:
    """Tout utilisateur connecté peut lire/créer/modifier ; seule la suppression est réservée à l'admin."""

    def get_permissions(self):
        if getattr(self, "action", None) == "destroy":
            return [IsAdminRole()]
        return [IsAuthenticated()]
