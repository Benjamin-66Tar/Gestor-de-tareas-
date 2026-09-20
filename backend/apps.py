import os
import sys
from django.apps import AppConfig

class BackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend'

    def ready(self):
        # Skip during management commands like makemigrations, migrate, test
        if any(cmd in sys.argv for cmd in ['makemigrations', 'migrate', 'test', 'check', 'shell', 'collectstatic']):
            return
        # In development runserver, avoid starting twice (only start in the main child process)
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return

        try:
            from .services import start_notification_scheduler
            start_notification_scheduler(interval_seconds=60)
        except Exception:
            pass
