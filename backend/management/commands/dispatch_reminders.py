from django.core.management.base import BaseCommand
from backend.services import check_and_dispatch_all_reminders


class Command(BaseCommand):
    help = "Evaluates deadlines, milestones, and approaching events to dispatch notifications and web push alerts."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Ejecutando verificación de recordatorios y alertas programadas..."))
        try:
            check_and_dispatch_all_reminders()
            self.stdout.write(self.style.SUCCESS("Ciclo de recordatorios completado exitosamente."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error durante el despacho de recordatorios: {e}"))
            raise
