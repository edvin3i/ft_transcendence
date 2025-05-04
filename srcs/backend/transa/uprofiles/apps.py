from django.apps import AppConfig


class UprofilesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "uprofiles"

    def ready(self):
        import uprofiles.signals