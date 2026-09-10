from django.db import models
from django.contrib.auth.models import User
import uuid

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
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_limite = models.DateTimeField(blank=True, null=True)
    color_hex = models.CharField(max_length=7, default="#6366F1") # Estética colorida

    def __str__(self):
        return f"[{self.tipo}] {self.titulo}"


class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='aura_profile', null=True, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    theme_preference = models.CharField(max_length=20, default='dark')

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"Profile of {username}"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aura_notifications', null=True, blank=True)
    title = models.CharField(max_length=120)
    message = models.TextField(max_length=500)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{'READ' if self.is_read else 'UNREAD'}] {self.title}"


class Goal(models.Model):
    PROGRESS_MODES = [
        ('MANUAL', 'Manual'),
        ('MILESTONES', 'Hitos / Automático'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('COMPLETED', 'Completado'),
        ('PAUSED', 'En Pausa'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aura_goals', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, default='General')
    color_hex = models.CharField(max_length=7, default='#10B981')
    start_date = models.DateTimeField(blank=True, null=True)
    deadline = models.DateTimeField(blank=True, null=True, db_index=True)
    progress_mode = models.CharField(max_length=20, choices=PROGRESS_MODES, default='MILESTONES')
    progress_percentage = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title} ({self.progress_percentage}%)"


class GoalMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    weight = models.PositiveSmallIntegerField(default=1, null=True, blank=True)
    target_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"[{'X' if self.is_completed else ' '}] {self.title} (peso: {self.weight})"


class Project(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('COMPLETED', 'Completado'),
        ('ARCHIVED', 'Archivado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aura_projects', null=True, blank=True)
    goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    color_hex = models.CharField(max_length=7, default='#6366F1')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    progress_percentage = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title} ({self.progress_percentage}%)"


class ProjectTask(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'Por hacer'),
        ('IN_PROGRESS', 'En progreso'),
        ('DONE', 'Completado'),
    ]
    PRIORITY_CHOICES = [
        ('LOW', 'Baja'),
        ('MEDIUM', 'Media'),
        ('HIGH', 'Alta'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    deadline = models.DateTimeField(blank=True, null=True, db_index=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"[{self.status}] {self.title} ({self.priority})"


class TaskSubtask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(ProjectTask, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"[{'X' if self.is_completed else ' '}] {self.title}"

