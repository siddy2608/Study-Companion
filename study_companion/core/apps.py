from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Import signals when the app is ready.
        This ensures that signal handlers are properly connected.
        """
        import core.models  # This will import the signals
