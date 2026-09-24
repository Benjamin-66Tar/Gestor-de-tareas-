from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
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
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at'], name='notif_user_read_created_idx'),
        ]

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
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(progress_percentage__gte=0, progress_percentage__lte=100),
                name='goal_progress_percentage_0_100'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'status'], name='goal_user_status_idx'),
            models.Index(fields=['user', '-created_at'], name='goal_user_created_idx'),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title} ({self.progress_percentage}%)"


class GoalMilestone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    weight = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        null=True,
        blank=True
    )
    target_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(weight__gte=1, weight__lte=100) | models.Q(weight__isnull=True),
                name='goal_milestone_weight_range'
            )
        ]

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
    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(progress_percentage__gte=0, progress_percentage__lte=100),
                name='project_progress_percentage_0_100'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'status'], name='project_user_status_idx'),
            models.Index(fields=['user', '-created_at'], name='project_user_created_idx'),
        ]

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
        indexes = [
            models.Index(fields=['project', 'status'], name='proj_task_status_idx'),
        ]

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


class EventItem(models.Model):
    STATUS_CHOICES = [
        ('PROGRAMMED', 'Programado'),
        ('COMPLETED', 'Completado'),
        ('CANCELED', 'Cancelado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aura_events', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    location = models.CharField(max_length=250, blank=True, null=True)
    meeting_url = models.URLField(max_length=500, blank=True, null=True)
    category = models.CharField(max_length=50, default='General')
    color_hex = models.CharField(max_length=7, default='#3B82F6')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROGRAMMED')
    reminder_minutes = models.PositiveIntegerField(default=15, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_time__gte=models.F('start_time')),
                name='event_end_time_gte_start_time'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'start_time', 'end_time'], name='event_user_time_idx'),
            models.Index(fields=['user', 'status'], name='event_user_status_idx'),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title} ({self.start_time})"


class PushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions', null=True, blank=True)
    endpoint = models.TextField(db_index=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'endpoint'], name='unique_user_push_endpoint')
        ]
        ordering = ['-created_at']

    def __str__(self):
        username = self.user.username if self.user else "Anonymous"
        return f"PushSubscription ({username}) - {self.endpoint[:30]}..."


