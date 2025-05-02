"""
ASGI config for transa project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os


# ⚠️ DOIT être tout en haut, avant tout import Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transa.settings')

import django
django.setup()  # ← ← ← OBLIGATOIRE ici aussi

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# ⚠️ Ces imports ne doivent arriver qu'après le django.setup()
from transa.middleware import JWTAuthMiddlewareStack
import chat.routing
import game.routing
import tournaments.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns + game.routing.websocket_urlpatterns + tournaments.routing.websocket_urlpatterns
        )
    ),
})

