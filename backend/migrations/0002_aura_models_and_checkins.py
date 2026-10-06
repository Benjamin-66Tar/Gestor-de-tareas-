import uuid
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('backend', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('avatar_url', models.URLField(blank=True, max_length=500, null=True)),
                ('theme_preference', models.CharField(default='dark', max_length=20)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='aura_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(db_index=True, default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Goal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('category', models.CharField(default='General', max_length=50)),
                ('color_hex', models.CharField(default='#10B981', max_length=7)),
                ('start_date', models.DateTimeField(blank=True, null=True)),
                ('deadline', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('reminder_minutes', models.PositiveIntegerField(blank=True, default=0, null=True)),
                ('time_horizon', models.CharField(choices=[('SHORT_TERM', 'Corto Plazo'), ('LONG_TERM', 'Largo Plazo')], default='SHORT_TERM', max_length=20)),
                ('progress_mode', models.CharField(choices=[('MANUAL', 'Manual'), ('MILESTONES', 'Hitos / Automático'), ('CONNECTED', 'Conectado / Multifactorial')], default='MILESTONES', max_length=20)),
                ('progress_percentage', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('status', models.CharField(choices=[('ACTIVE', 'Activo'), ('COMPLETED', 'Completado'), ('PAUSED', 'En Pausa')], default='ACTIVE', max_length=20)),
                ('is_deleted', models.BooleanField(db_index=True, default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent_goal', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sub_goals', to='backend.goal')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='aura_goals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='GoalMilestone',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('is_completed', models.BooleanField(default=False)),
                ('weight', models.PositiveSmallIntegerField(blank=True, default=1, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)])),
                ('target_date', models.DateField(blank=True, null=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('goal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='milestones', to='backend.goal')),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('color_hex', models.CharField(default='#3B82F6', max_length=7)),
                ('status', models.CharField(choices=[('ACTIVE', 'Activo'), ('COMPLETED', 'Completado'), ('ARCHIVED', 'Archivado')], default='ACTIVE', max_length=20)),
                ('progress_percentage', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('is_deleted', models.BooleanField(db_index=True, default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('goal', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='backend.goal')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='aura_projects', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProjectTask',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=250)),
                ('description', models.TextField(blank=True, null=True)),
                ('status', models.CharField(choices=[('TODO', 'Por hacer'), ('IN_PROGRESS', 'En progreso'), ('DONE', 'Completado')], default='TODO', max_length=20)),
                ('priority', models.CharField(choices=[('LOW', 'Baja'), ('MEDIUM', 'Media'), ('HIGH', 'Alta')], default='MEDIUM', max_length=20)),
                ('deadline', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('reminder_minutes', models.PositiveIntegerField(blank=True, default=0, null=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='backend.project')),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),
        migrations.CreateModel(
            name='TaskSubtask',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('is_completed', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=0)),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subtasks', to='backend.projecttask')),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='EventItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('start_time', models.DateTimeField(db_index=True)),
                ('end_time', models.DateTimeField(db_index=True)),
                ('location', models.CharField(blank=True, max_length=250, null=True)),
                ('meeting_url', models.URLField(blank=True, max_length=500, null=True)),
                ('category', models.CharField(default='General', max_length=50)),
                ('color_hex', models.CharField(default='#3B82F6', max_length=7)),
                ('status', models.CharField(choices=[('PROGRAMMED', 'Programado'), ('COMPLETED', 'Completado'), ('CANCELED', 'Cancelado')], default='PROGRAMMED', max_length=20)),
                ('reminder_minutes', models.PositiveIntegerField(blank=True, default=15, null=True)),
                ('is_deleted', models.BooleanField(db_index=True, default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='aura_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['start_time'],
            },
        ),
        migrations.CreateModel(
            name='PushSubscription',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('endpoint', models.TextField(unique=True)),
                ('p256dh_key', models.TextField()),
                ('auth_key', models.TextField()),
                ('user_agent', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='push_subscriptions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('CREATE', 'Crear'), ('UPDATE', 'Actualizar'), ('DELETE', 'Eliminar'), ('RESTORE', 'Restaurar')], max_length=20)),
                ('model_name', models.CharField(max_length=50)),
                ('object_id', models.CharField(max_length=64)),
                ('object_repr', models.CharField(blank=True, max_length=255, null=True)),
                ('changes', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='LearningItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('resource_type', models.CharField(choices=[('COURSE', 'Curso'), ('BOOK', 'Libro'), ('ARTICLE', 'Artículo'), ('TECH_DOC', 'Documentación Oficial')], default='COURSE', max_length=20)),
                ('platform_name', models.CharField(blank=True, max_length=100, null=True)),
                ('platform_url', models.URLField(blank=True, max_length=500, null=True)),
                ('color_hex', models.CharField(default='#8B5CF6', max_length=7)),
                ('status', models.CharField(choices=[('BACKLOG', 'Por empezar'), ('IN_PROGRESS', 'En curso'), ('PAUSED', 'En pausa'), ('COMPLETED', 'Completado')], default='IN_PROGRESS', max_length=20)),
                ('progress_mode', models.CharField(choices=[('MANUAL', 'Unidades / Manual'), ('TOPICS', 'Temario / Modular')], default='TOPICS', max_length=20)),
                ('progress_percentage', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('current_unit', models.PositiveIntegerField(default=0)),
                ('total_units', models.PositiveIntegerField(default=10)),
                ('last_point_reached', models.CharField(blank=True, max_length=250, null=True)),
                ('takeaways_markdown', models.TextField(blank=True, null=True)),
                ('last_activity_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('dormancy_alert_days', models.PositiveSmallIntegerField(default=7)),
                ('is_deleted', models.BooleanField(db_index=True, default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('goal', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='learning_items', to='backend.goal')),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='learning_items', to='backend.project')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='learning_items', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-last_activity_at', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LearningTopic',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('is_completed', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=0)),
                ('section_name', models.CharField(blank=True, max_length=150, null=True)),
                ('learning_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='topics', to='backend.learningitem')),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='ActivityCheckIn',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField(db_index=True, default=django.utils.timezone.localdate)),
                ('is_completed', models.BooleanField(default=True)),
                ('streak_count', models.PositiveIntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('event_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='check_ins', to='backend.eventitem')),
                ('learning_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='check_ins', to='backend.learningitem')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='activity_checkins', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='activitycheckin',
            constraint=models.UniqueConstraint(condition=models.Q(('learning_item__isnull', False)), fields=('user', 'learning_item', 'date'), name='unique_user_learning_checkin_per_day'),
        ),
        migrations.AddConstraint(
            model_name='activitycheckin',
            constraint=models.UniqueConstraint(condition=models.Q(('event_item__isnull', False)), fields=('user', 'event_item', 'date'), name='unique_user_event_checkin_per_day'),
        ),
        migrations.AddIndex(
            model_name='activitycheckin',
            index=models.Index(fields=['user', 'date'], name='checkin_user_date_idx'),
        ),
    ]
