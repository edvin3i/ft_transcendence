from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import FortyTwoOpenAuthSerializer
from .serializers import (
    TwoFactorAuthSetupSerializer,
    TwoFactorAuthConfirmSerializer,
    TwoFactorAuthDisableSerializer,
)


class FortyTwoOpenAuthCallbackView(GenericAPIView):
    serializer_class = FortyTwoOpenAuthSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class TwoFactorAuthSetupAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TwoFactorAuthSetupSerializer

    def get_queryset(self):  # just for GenericAPIView
        return None

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class TwoFactorAuthConfirmAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TwoFactorAuthConfirmSerializer

    def get_queryset(self):
        return None

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)


class TwoFactorAuthDisableAPIView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TwoFactorAuthDisableSerializer

    def get_queryset(self):
        return None

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_200_OK)
