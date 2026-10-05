from rest_framework.permissions import SAFE_METHODS, BasePermission


class AdminEscreveTodosLeem(BasePermission):
    """Leitura pública; escrita só para admin (is_staff)."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or (
            request.user.is_authenticated and request.user.is_staff
        )


class SomenteFuncionario(BasePermission):
    """Qualquer usuário autenticado é funcionário: não há cadastro público,
    só o seed/admin criam contas."""

    def has_permission(self, request, view):
        return request.user.is_authenticated
