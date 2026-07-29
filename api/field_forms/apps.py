from django.apps import AppConfig


class FieldFormsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'field_forms'

    def ready(self):
        import field_forms.signals  # noqa
