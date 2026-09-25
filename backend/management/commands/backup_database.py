import os
import hashlib
from pathlib import Path
from datetime import datetime
from django.core.management.base import BaseCommand
from django.core import serializers
from django.conf import settings
from django.contrib.auth.models import User
from backend.models import (
    ElementoAura,
    UserProfile,
    Notification,
    Goal,
    GoalMilestone,
    Project,
    ProjectTask,
    TaskSubtask,
    EventItem,
    PushSubscription,
    AuditLog,
)


class Command(BaseCommand):
    help = "Generates a structured logical backup of all application models with SHA-256 checksum verification."

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default=None,
            help='Directory path where backup files will be stored (defaults to BASE_DIR/backups).'
        )

    def handle(self, *args, **options):
        output_dir_arg = options.get('output_dir')
        if output_dir_arg:
            backup_dir = Path(output_dir_arg).resolve()
        else:
            backup_dir = settings.BASE_DIR / 'backups'

        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_aura_{timestamp}.json"
        checksum_filename = f"{backup_filename}.sha256"

        backup_path = backup_dir / backup_filename
        checksum_path = backup_dir / checksum_filename

        self.stdout.write(self.style.NOTICE(f"Iniciando respaldo de base de datos Aura ({timestamp})..."))

        models_to_backup = [
            User,
            UserProfile,
            ElementoAura,
            Goal,
            GoalMilestone,
            Project,
            ProjectTask,
            TaskSubtask,
            EventItem,
            Notification,
            PushSubscription,
            AuditLog,
        ]

        total_objects = 0
        all_objects = []

        for model in models_to_backup:
            qs = model.objects.all()
            count = qs.count()
            total_objects += count
            all_objects.extend(list(qs))
            self.stdout.write(f"  • {model.__name__}: {count} registros")

        # Serialize to JSON with indentation
        json_data = serializers.serialize('json', all_objects, indent=2)

        # Write backup file
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(json_data)

        # Compute SHA-256 checksum
        sha256_hash = hashlib.sha256(json_data.encode('utf-8')).hexdigest()
        with open(checksum_path, 'w', encoding='utf-8') as f:
            f.write(f"{sha256_hash}  {backup_filename}\n")

        file_size_kb = round(os.path.getsize(backup_path) / 1024, 2)

        self.stdout.write(self.style.SUCCESS(
            f"\nRespaldo completado exitosamente:\n"
            f"  Archivo:    {backup_path}\n"
            f"  Checksum:   {checksum_path}\n"
            f"  SHA-256:    {sha256_hash}\n"
            f"  Tamaño:     {file_size_kb} KB\n"
            f"  Registros:  {total_objects} objetos respaldados"
        ))
