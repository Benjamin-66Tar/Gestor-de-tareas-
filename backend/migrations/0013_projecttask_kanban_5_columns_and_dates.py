# Generated for ProjectTask Kanban 5 Columns and Date Ranges

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0012_activitycheckin_goal_time_horizon_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projecttask',
            name='status',
            field=models.CharField(
                choices=[
                    ('BACKLOG', 'Backlog'),
                    ('ANALYSIS', 'Análisis'),
                    ('IN_PROGRESS', 'Desarrollo'),
                    ('TESTING', 'Pruebas'),
                    ('DONE', 'Completado'),
                    ('TODO', 'Por hacer'),
                ],
                default='BACKLOG',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='projecttask',
            name='start_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='projecttask',
            name='estimated_days',
            field=models.PositiveIntegerField(blank=True, default=1, null=True),
        ),
        migrations.AddField(
            model_name='projecttask',
            name='deviation_reason',
            field=models.TextField(blank=True, null=True),
        ),
    ]
