from .base import *
from .base import REST_FRAMEWORK

DEBUG = True

ALLOWED_HOSTS = [
    "django",
    "localhost",
    "127.0.0.1",
]

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    "https://localhost:4443",
    "https://gbreana.42.fr",
]


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


REST_FRAMEWORK["DEFAULT_RENDER_CLASSES"] += [
    "rest_framework.renders.BrowsableAPIRender",
    ]
