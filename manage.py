#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aura_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Cambiar el puerto por defecto de 'runserver' a 6001 (evitando el 6000 que está bloqueado por navegadores)
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver':
        if not any(arg.isdigit() or ':' in arg for arg in sys.argv[2:]):
            sys.argv.append('6001')

    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
