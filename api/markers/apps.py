from django.apps import AppConfig


class MarkersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'markers'

    def ready(self):
        import markers.signals  # noqa
