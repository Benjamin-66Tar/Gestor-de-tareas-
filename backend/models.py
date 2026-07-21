from django.db import models

class ElementoAura(models.Model):
    TIPO_CHOICES = [
        ('OBJETIVO', 'Objetivo'),
        ('PROYECTO', 'Proyecto'),
        ('EVENTO', 'Evento'),
        ('ACTIVIDAD', 'Actividad'),
    ]
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_limite = models.DateTimeField(blank=True, null=True)
    color_hex = models.CharField(max_length=7, default="#6366F1") # Estética colorida

    def __str__(self):
        return f"[{self.tipo}] {self.titulo}"
