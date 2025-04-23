import json
import html
from django.http import HttpResponse

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import FortyTwoOpenAuthSerializer
from .serializers import (
    TwoFactorAuthSetupSerializer,
    TwoFactorAuthConfirmSerializer,
    TwoFactorAuthDisableSerializer,
)


class FortyTwoOpenAuthCallbackView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = FortyTwoOpenAuthSerializer

    def get(self, request, *args, **kwargs):
        code = request.query_params.get("code")
        if not code:
            html_payload = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <script>
                    window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-42af5be9c50086986d493929592fbd7d5a7cd21427155bad5eb264883602b20a&redirect_uri=https://localhost/api/auth/ft/callback/&response_type=code";
                </script>
            </head>
            </html>
            """
            return HttpResponse(html_payload, content_type="text/html")
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        html_payload = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <script>
                localStorage.setItem('data', JSON.stringify({data}));
                window.close();
            </script>
        </head>
        </html>
        """
        return HttpResponse(html_payload, content_type="text/html")


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
