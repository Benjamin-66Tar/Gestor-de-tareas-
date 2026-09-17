import json
from django.conf import settings
import openai

def procesar_texto_con_nlp(texto_usuario: str):
    """
    Analiza texto libre del usuario para extraer metas o eventos estructurados de forma ultra rápida.
    """
    # Use key from settings if configured, otherwise fallback gracefully
    api_key = getattr(settings, 'OPENAI_API_KEY', 'mock-key-for-now')
    client = openai.OpenAI(api_key=api_key)
    
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Extrae la planificación del usuario en el esquema JSON estructurado."},
            {"role": "user", "content": texto_usuario}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "esquema_planificacion",
                "schema": {
                    "type": "object",
                    "properties": {
                        "titulo": {"type": "string"},
                        "descripcion": {"type": "string"},
                        "tipo": {"type": "string", "enum": ["OBJETIVO", "PROYECTO", "EVENTO", "ACTIVIDAD"]},
                        "color_hex": {"type": "string"}
                    },
                    "required": ["titulo", "tipo", "color_hex"],
                    "additionalProperties": False
                }
            }
        }
    )
    return json.loads(response.choices[0].message.content)


def calculate_goal_progress(goal) -> int:
    """
    Calculates progress percentage (0-100) for a Goal based on its progress_mode:
    - MANUAL: returns the existing progress_percentage
    - MILESTONES: computes completed milestone weights over total weights (default weight 1)
    """
    if goal.progress_mode == 'MANUAL':
        return min(100, max(0, goal.progress_percentage))

    milestones = goal.milestones.all()
    if not milestones.exists():
        return 0

    total_weight = sum(m.weight if m.weight and m.weight > 0 else 1 for m in milestones)
    if total_weight <= 0:
        total_count = len(milestones)
        completed_count = sum(1 for m in milestones if m.is_completed)
        progress = round((completed_count / total_count) * 100)
    else:
        completed_weight = sum(m.weight if m.weight and m.weight > 0 else 1 for m in milestones if m.is_completed)
        progress = round((completed_weight / total_weight) * 100)

    progress = min(100, max(0, progress))
    goal.progress_percentage = progress
    if progress == 100 and goal.status == 'ACTIVE':
        goal.status = 'COMPLETED'
    elif progress < 100 and goal.status == 'COMPLETED':
        goal.status = 'ACTIVE'
    goal.save(update_fields=['progress_percentage', 'status', 'updated_at'])
    return progress


def toggle_milestone_completion(milestone_id):
    """
    Toggles completion state of a milestone and recalculates goal progress.
    """
    from .models import GoalMilestone
    milestone = GoalMilestone.objects.select_related('goal').get(id=milestone_id)
    milestone.is_completed = not milestone.is_completed
    milestone.save(update_fields=['is_completed'])
    
    goal = milestone.goal
    if goal.progress_mode == 'MILESTONES':
        calculate_goal_progress(goal)
    return milestone, goal


def sync_goals_to_calendar(user=None, start_date=None, end_date=None):
    """
    Projects goal deadlines and dated milestones onto the calendar format.
    """
    from .models import Goal, GoalMilestone
    events = []
    
    goals_qs = Goal.objects.all()
    if user and user.is_authenticated:
        goals_qs = goals_qs.filter(user=user)
    
    if start_date:
        goals_qs = goals_qs.filter(deadline__gte=start_date)
    if end_date:
        goals_qs = goals_qs.filter(deadline__lte=end_date)
        
    for goal in goals_qs.exclude(deadline__isnull=True):
        events.append({
            'id': f"goal-{goal.id}",
            'titulo': f"🎯 {goal.title}",
            'tipo': 'OBJETIVO',
            'fecha_inicio': goal.start_date.isoformat() if goal.start_date else None,
            'fecha_limite': goal.deadline.isoformat(),
            'color_hex': goal.color_hex,
            'source_id': str(goal.id),
            'progress_percentage': goal.progress_percentage,
            'status': goal.status,
            'is_goal_deadline': True,
        })
        
    # Project dated milestones
    milestones_qs = GoalMilestone.objects.select_related('goal').exclude(target_date__isnull=True)
    if user and user.is_authenticated:
        milestones_qs = milestones_qs.filter(goal__user=user)
    if start_date:
        milestones_qs = milestones_qs.filter(target_date__gte=start_date.date() if hasattr(start_date, 'date') else start_date)
    if end_date:
        milestones_qs = milestones_qs.filter(target_date__lte=end_date.date() if hasattr(end_date, 'date') else end_date)
        
    for m in milestones_qs:
        events.append({
            'id': f"milestone-{m.id}",
            'titulo': f"📌 {m.title}",
            'tipo': 'OBJETIVO',
            'fecha_limite': f"{m.target_date.isoformat()}T12:00:00Z",
            'color_hex': m.goal.color_hex,
            'source_id': str(m.id),
            'status': 'COMPLETED' if m.is_completed else 'ACTIVE',
            'is_milestone': True,
        })

    return events


def calculate_project_progress(project) -> int:
    """
    Calculates progress percentage (0-100) for a Project based on completed tasks:
    - (completed tasks in DONE / total tasks) * 100
    - If 0 tasks, returns 0.
    """
    tasks = project.tasks.all()
    total_count = tasks.count()
    if total_count == 0:
        progress = 0
    else:
        completed_count = tasks.filter(status='DONE').count()
        progress = round((completed_count / total_count) * 100)

    progress = min(100, max(0, progress))
    project.progress_percentage = progress
    if progress == 100 and project.status == 'ACTIVE':
        project.status = 'COMPLETED'
    elif progress < 100 and project.status == 'COMPLETED':
        project.status = 'ACTIVE'
    project.save(update_fields=['progress_percentage', 'status', 'updated_at'])
    return progress


def update_project_task_status(task_id, new_status: str):
    """
    Updates the Kanban column status of a ProjectTask and recalculates parent project progress.
    """
    from .models import ProjectTask
    task = ProjectTask.objects.select_related('project').get(id=task_id)
    task.status = new_status
    task.save(update_fields=['status', 'updated_at'])
    calculate_project_progress(task.project)
    return task


def sync_projects_to_calendar(user=None, start_date=None, end_date=None):
    """
    Projects project tasks with deadlines onto the calendar event format.
    """
    from .models import ProjectTask
    events = []

    tasks_qs = ProjectTask.objects.select_related('project').exclude(deadline__isnull=True)
    if user and user.is_authenticated:
        tasks_qs = tasks_qs.filter(project__user=user)
    if start_date:
        tasks_qs = tasks_qs.filter(deadline__gte=start_date)
    if end_date:
        tasks_qs = tasks_qs.filter(deadline__lte=end_date)

    for task in tasks_qs:
        events.append({
            'id': f"task-{task.id}",
            'titulo': f"📋 {task.title}",
            'tipo': 'PROYECTO',
            'fecha_limite': task.deadline.isoformat(),
            'color_hex': task.project.color_hex,
            'source_id': str(task.id),
            'project_id': str(task.project.id),
            'project_title': task.project.title,
            'status': task.status,
            'priority': task.priority,
            'is_project_task': True,
        })

    return events


def sync_events_to_calendar(user=None, start_date=None, end_date=None):
    """
    Projects scheduled events onto the calendar event format with full start/end duration.
    """
    from .models import EventItem
    events = []

    events_qs = EventItem.objects.all()
    if user and user.is_authenticated:
        events_qs = events_qs.filter(user=user)
    if start_date:
        events_qs = events_qs.filter(end_time__gte=start_date)
    if end_date:
        events_qs = events_qs.filter(start_time__lte=end_date)

    for event in events_qs:
        events.append({
            'id': f"event-{event.id}",
            'titulo': f"📅 {event.title}",
            'tipo': 'EVENTO',
            'fecha_inicio': event.start_time.isoformat(),
            'fecha_limite': event.end_time.isoformat(),
            'color_hex': event.color_hex,
            'source_id': str(event.id),
            'location': event.location,
            'meeting_url': event.meeting_url,
            'category': event.category,
            'status': event.status,
            'is_event_item': True,
        })

    return events


def sync_all_to_calendar(user=None, start_date=None, end_date=None):
    """
    Unified calendar event projection aggregating Goals, Milestones, Project Tasks, and Events.
    """
    goal_events = sync_goals_to_calendar(user=user, start_date=start_date, end_date=end_date)
    project_events = sync_projects_to_calendar(user=user, start_date=start_date, end_date=end_date)
    event_items = sync_events_to_calendar(user=user, start_date=start_date, end_date=end_date)
    return goal_events + project_events + event_items


def check_approaching_event_reminders(user=None):
    """
    Evaluates programmed events starting within their reminder_minutes window
    and creates proactive notifications if not already issued.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import EventItem, Notification

    now = timezone.now()
    notifications_created = []

    events_qs = EventItem.objects.filter(status='PROGRAMMED', start_time__gt=now)
    if user and user.is_authenticated:
        events_qs = events_qs.filter(user=user)

    for event in events_qs:
        reminder_mins = event.reminder_minutes if event.reminder_minutes is not None else 15
        reminder_threshold = now + timedelta(minutes=reminder_mins)
        if event.start_time <= reminder_threshold:
            notification_title = f"Recordatorio: {event.title}"
            time_str = event.start_time.strftime("%H:%M")
            notification_message = f"Tu evento '{event.title}' inicia hoy a las {time_str}."
            
            # Prevent duplicate notifications for the same event and title
            existing = Notification.objects.filter(
                title=notification_title,
                message=notification_message,
                user=event.user
            ).exists()
            
            if not existing:
                notif = Notification.objects.create(
                    user=event.user,
                    title=notification_title,
                    message=notification_message,
                    is_read=False
                )
                notifications_created.append(notif)

    return notifications_created


