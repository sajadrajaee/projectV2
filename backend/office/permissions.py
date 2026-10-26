from rest_framework.permissions import BasePermission


class IsOfficeUser(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'OFFICE'
        )


class IsCustomerUser(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'CUSTOMER'
        )