from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "django",
    "localhost",
]

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    "https://localhost:4443",
    "https://gbreana.42.fr",
]

try:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["DB_NAME"],
            "USER": os.environ["DB_USER"],
            "PASSWORD": os.environ["DB_PASSWORD"],
            "HOST": os.environ["DB_HOST"],
            "PORT": os.environ["DB_PORT"],
        }
    }
except KeyError as e:
    raise RuntimeError("Could not find a some DB parameter in environment") from e
