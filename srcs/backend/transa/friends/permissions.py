from rest_framework.permissions import BasePermission



class IsSender(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.from_user_id == request.user.id or request.user.is_staff


class IsReciever(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.to_user_id == request.user.id or request.user.is_staff


class IsParticipant(BasePermission):
    def has_object_permission(self, request, view, obj):
        user_id = request.user.id
        return user_id in {obj.from_user_id, obj.to_user_id} or request.user.is_staff
