from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0007_alter_goal_progress_percentage_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='goal',
            name='reminder_minutes',
            field=models.PositiveIntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='projecttask',
            name='reminder_minutes',
            field=models.PositiveIntegerField(blank=True, default=0, null=True),
        ),
    ]
