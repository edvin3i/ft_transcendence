from django.urls import path, include
from .views import (
    FortyTwoOpenAuthCallbackView,
    TwoFactorAuthSetupAPIView,
    TwoFactorAuthConfirmAPIView,
    TwoFactorAuthDisableAPIView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("ft/callback/", FortyTwoOpenAuthCallbackView.as_view(), name="ft_callback"),
    path("2fa/setup/", TwoFactorAuthSetupAPIView.as_view(), name="2fa_setup"),
    path("2fa/confirm/", TwoFactorAuthConfirmAPIView.as_view(), name="2fa_confirm"),
    path("2fa/disable/", TwoFactorAuthDisableAPIView.as_view(), name="2fa_disable"),
]
