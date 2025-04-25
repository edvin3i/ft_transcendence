from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user(user_id):
    return get_user_model().objects.get(id=user_id)

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        logger.info(f"Query string: {scope["query_string"]}")

        user = AnonymousUser()

        if token:
            try:
                validated_token = AccessToken(token)
                user_id = validated_token["user_id"]
                user = await get_user(user_id)
            except Exception as e:
                logger.info(f"[JWT ERROR] {e}")

        scope["user"] = user
        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
