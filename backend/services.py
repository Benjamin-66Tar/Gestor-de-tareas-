import json
from django.conf import settings
from django.db import transaction
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


@transaction.atomic
def toggle_milestone_completion(milestone_id):
    """
    Toggles completion state of a milestone and recalculates goal progress.
    Acquires row-level locks on milestone and goal to prevent lost updates under concurrency.
    """
    from .models import GoalMilestone, Goal
    milestone = GoalMilestone.objects.select_for_update().select_related('goal').get(id=milestone_id)
    milestone.is_completed = not milestone.is_completed
    milestone.save(update_fields=['is_completed'])
    
    goal = Goal.objects.select_for_update().get(id=milestone.goal_id)
    if goal.progress_mode == 'MILESTONES':
        calculate_goal_progress(goal)
    return milestone, goal


def sync_goals_to_calendar(user=None, start_date=None, end_date=None):
    """
    Projects goal deadlines and dated milestones onto the calendar format.
    Ensures strict tenant isolation: unauthenticated requests receive empty sets.
    """
    from .models import Goal, GoalMilestone
    events = []

    if user and user.is_authenticated:
        goals_qs = Goal.objects.filter(user=user, is_deleted=False)
        milestones_qs = GoalMilestone.objects.select_related('goal').filter(goal__user=user, goal__is_deleted=False).exclude(target_date__isnull=True)
    else:
        return []

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


@transaction.atomic
def update_project_task_status(task_id, new_status: str):
    """
    Updates the Kanban column status of a ProjectTask and recalculates parent project progress.
    Acquires row-level locks on the task and project to guarantee ACID consistency.
    """
    from .models import ProjectTask, Project
    task = ProjectTask.objects.select_for_update().select_related('project').get(id=task_id)
    project = Project.objects.select_for_update().get(id=task.project_id)
    task.status = new_status
    task.save(update_fields=['status', 'updated_at'])
    calculate_project_progress(project)
    task.project = project
    return task


def sync_projects_to_calendar(user=None, start_date=None, end_date=None):
    """
    Projects project tasks with deadlines onto the calendar event format.
    Ensures strict tenant isolation: unauthenticated requests receive empty sets.
    """
    from .models import ProjectTask
    events = []

    if not (user and user.is_authenticated):
        return []

    tasks_qs = ProjectTask.objects.select_related('project').filter(project__user=user, project__is_deleted=False).exclude(deadline__isnull=True)
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
    Ensures strict tenant isolation: unauthenticated requests receive empty sets.
    """
    from .models import EventItem
    events = []

    if not (user and user.is_authenticated):
        return []

    events_qs = EventItem.objects.filter(user=user, is_deleted=False)
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

    events_qs = EventItem.objects.filter(status='PROGRAMMED', start_time__gt=now, is_deleted=False)
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


def send_web_push(user=None, title="Aura", message="", url="/#eventos", icon=None):
    """
    Delivers an encrypted Web Push notification via VAPID (RFC 8291 / 8292)
    to all active push subscriptions belonging to the user.
    Automatically prunes stale subscriptions returning HTTP 410 (Gone) or 404.
    """
    import json
    from django.conf import settings
    from .models import PushSubscription

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return {"dispatched_count": 0, "failed_pruned_count": 0, "error": "pywebpush not installed"}

    if user and user.is_authenticated:
        subs_qs = PushSubscription.objects.filter(user=user)
    elif user is not None:
        subs_qs = PushSubscription.objects.filter(user=user)
    else:
        return {"dispatched_count": 0, "failed_pruned_count": 0, "detail": "User is required for push dispatch."}

    payload = {
        "title": title,
        "message": message,
        "body": message,
        "url": url or "/#eventos",
        "icon": icon or "/icons/icon-192x192.png",
        "badge": "/icons/icon-192x192.png",
    }

    dispatched_count = 0
    failed_pruned_count = 0

    vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
    vapid_claims = {"sub": getattr(settings, 'VAPID_ADMIN_EMAIL', "mailto:admin@aura.app")}

    if not vapid_private_key or vapid_private_key in ('sample_private_key', 'mock-private-key'):
        return {"dispatched_count": subs_qs.count(), "failed_pruned_count": 0, "mocked": True}

    for sub in subs_qs:
        sub_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth,
            }
        }
        try:
            webpush(
                subscription_info=sub_info,
                data=json.dumps(payload),
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims,
                ttl=86400
            )
            dispatched_count += 1
        except WebPushException as ex:
            status_code = getattr(getattr(ex, 'response', None), 'status_code', None)
            if status_code in (404, 410):
                sub.delete()
                failed_pruned_count += 1
        except Exception:
            pass

    return {
        "dispatched_count": dispatched_count,
        "failed_pruned_count": failed_pruned_count,
    }


def check_approaching_task_deadlines(user=None):
    """
    Evaluates project tasks whose deadline is within 24 hours and not yet DONE.
    Issues proactive in-app notifications and dispatches Web Push notifications.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import ProjectTask, Notification

    now = timezone.now()
    threshold = now + timedelta(hours=24)
    notifications_created = []

    tasks_qs = ProjectTask.objects.filter(
        deadline__isnull=False,
        deadline__gt=now,
        deadline__lte=threshold
    ).exclude(status='DONE')

    if user and user.is_authenticated:
        tasks_qs = tasks_qs.filter(project__user=user)

    for task in tasks_qs:
        owner = task.project.user
        time_str = task.deadline.strftime("%d/%m a las %H:%M")
        title = f"Tarea por vencer: {task.title}"
        message = f"Tu tarea '{task.title}' en '{task.project.title}' vence el {time_str}."

        existing = Notification.objects.filter(
            title=title,
            message=message,
            user=owner
        ).exists()

        if not existing:
            notif = Notification.objects.create(
                user=owner,
                title=title,
                message=message,
                is_read=False
            )
            notifications_created.append(notif)
            send_web_push(
                user=owner,
                title=title,
                message=message,
                url=f"/#proyectos?taskId={task.id}"
            )

    return notifications_created


def check_and_dispatch_all_reminders(user=None):
    """
    Aggregates approaching event reminders and task deadlines,
    ensuring notifications and Web Push alerts are dispatched.
    """
    event_notifs = check_approaching_event_reminders(user=user)
    for notif in event_notifs:
        send_web_push(
            user=notif.user,
            title=notif.title,
            message=notif.message,
            url="/#eventos"
        )

    task_notifs = check_approaching_task_deadlines(user=user)
    return event_notifs + task_notifs


# --- Lightweight In-Process Background Scheduler ---

import threading
import time

_scheduler_thread = None
_scheduler_running = False

def _scheduler_loop(interval_seconds=60):
    global _scheduler_running
    while _scheduler_running:
        try:
            check_and_dispatch_all_reminders()
        except Exception:
            pass
        time.sleep(interval_seconds)

def start_notification_scheduler(interval_seconds=60):
    """
    Starts the in-process background thread to evaluate approaching deadlines and events.
    """
    global _scheduler_thread, _scheduler_running
    if _scheduler_thread is None or not _scheduler_thread.is_alive():
        _scheduler_running = True
        _scheduler_thread = threading.Thread(
            target=_scheduler_loop,
            args=(interval_seconds,),
            daemon=True,
            name="AuraNotificationScheduler"
        )
        _scheduler_thread.start()


def authenticate_user(identifier, password):
    """
    Authenticates a user using either their username or email address and password.
    Returns the User instance if valid, or None if authentication fails.
    """
    from django.contrib.auth.models import User
    from django.contrib.auth import authenticate

    if not identifier or not password:
        return None

    # If identifier looks like an email or exists as email, resolve username
    if '@' in identifier:
        user_by_email = User.objects.filter(email__iexact=identifier).first()
        if user_by_email:
            identifier = user_by_email.username

    return authenticate(username=identifier, password=password)


def get_client_ip(request):
    """Safely extracts client IP address from request META headers."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_audit_event(user, action: str, model_name: str, object_id, object_repr: str = None, changes: dict = None, ip_address: str = None):
    """
    Creates an immutable AuditLog entry tracking mutations (CREATE, UPDATE, DELETE, RESTORE).
    """
    from .models import AuditLog
    import logging
    try:
        # Convert non-serializable changes to clean dict
        safe_changes = {}
        if changes and isinstance(changes, dict):
            for k, v in changes.items():
                if isinstance(v, (str, int, float, bool, type(None), list, dict)):
                    safe_changes[k] = v
                else:
                    safe_changes[k] = str(v)
        return AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            model_name=model_name,
            object_id=str(object_id),
            object_repr=str(object_repr)[:255] if object_repr else None,
            changes=safe_changes,
            ip_address=ip_address,
        )
    except Exception as e:
        logging.getLogger(__name__).error(f"Failed to record audit log: {e}")
        return None




