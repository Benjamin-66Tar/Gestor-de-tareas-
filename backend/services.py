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
    - CONNECTED: computes equitable unweighted average across present linked components (projects, courses, milestones)
    """
    if goal.progress_mode == 'MANUAL':
        return min(100, max(0, goal.progress_percentage))

    if goal.progress_mode == 'CONNECTED':
        proj_list = list(goal.projects.filter(is_deleted=False))
        course_list = list(goal.learning_items.filter(is_deleted=False))
        milestones = list(goal.milestones.all())

        components = []
        if proj_list:
            components.append(sum(p.progress_percentage for p in proj_list) / len(proj_list))
        if course_list:
            components.append(sum(c.progress_percentage for c in course_list) / len(course_list))
        if milestones:
            total_weight = sum(m.weight if m.weight and m.weight > 0 else 1 for m in milestones)
            if total_weight > 0:
                comp_weight = sum(m.weight if m.weight and m.weight > 0 else 1 for m in milestones if m.is_completed)
                components.append((comp_weight / total_weight) * 100)
            else:
                components.append((sum(1 for m in milestones if m.is_completed) / len(milestones)) * 100)

        if not components:
            progress = goal.progress_percentage or 0
        else:
            progress = round(sum(components) / len(components))

        progress = min(100, max(0, progress))
        goal.progress_percentage = progress
        # For CONNECTED mode, keep active at 100% until explicit user confirmation/conclude
        if progress < 100 and goal.status == 'COMPLETED':
            goal.status = 'ACTIVE'
        goal.save(update_fields=['progress_percentage', 'status', 'updated_at'])
        return progress

    # Default: MILESTONES mode
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
            'descripcion': goal.description or '',
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
            'descripcion': f"Hito del objetivo: {m.goal.title}",
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
            'descripcion': task.description or '',
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
            'descripcion': event.description or '',
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


def check_approaching_goal_deadlines(user=None):
    """
    Evaluates active goals approaching deadline based on configurable reminder_minutes
    (or at exact deadline if reminder_minutes == 0).
    Suppresses alerts if status in ('COMPLETED', 'PAUSED') or is_deleted=True.
    Issues in-app notifications and dispatches Web Push.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import Goal, Notification

    now = timezone.now()
    notifications_created = []

    goals_qs = Goal.objects.filter(
        deadline__isnull=False,
        status='ACTIVE',
        is_deleted=False
    )
    if user and user.is_authenticated:
        goals_qs = goals_qs.filter(user=user)

    for goal in goals_qs:
        reminder_mins = goal.reminder_minutes if goal.reminder_minutes is not None else 0
        if reminder_mins == 0:
            is_due = (now - timedelta(minutes=2)) <= goal.deadline <= (now + timedelta(minutes=1))
        else:
            reminder_threshold = now + timedelta(minutes=reminder_mins)
            is_due = now <= goal.deadline <= reminder_threshold

        if is_due:
            time_str = timezone.localtime(goal.deadline).strftime("%H:%M") if hasattr(timezone, 'localtime') else goal.deadline.strftime("%H:%M")
            title = f"Recordatorio de Objetivo: {goal.title}"
            if reminder_mins > 0:
                message = f"Tu objetivo '{goal.title}' vence en {reminder_mins} minutos (a las {time_str})."
            else:
                message = f"Tu objetivo '{goal.title}' vence hoy a las {time_str}."

            existing = Notification.objects.filter(
                title=title,
                message=message,
                user=goal.user
            ).exists()

            if not existing and goal.user:
                notif = Notification.objects.create(
                    user=goal.user,
                    title=title,
                    message=message,
                    is_read=False
                )
                notifications_created.append(notif)
                send_web_push(
                    user=goal.user,
                    title=title,
                    message=message,
                    url=f"/#objetivos?goalId={goal.id}"
                )

    return notifications_created


def check_approaching_task_deadlines(user=None):
    """
    Evaluates project tasks whose deadline is approaching (based on reminder_minutes or within 24 hours)
    and not yet DONE. Excludes archived projects and deleted projects.
    Issues proactive in-app notifications and dispatches Web Push notifications.
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import ProjectTask, Notification

    now = timezone.now()
    notifications_created = []

    tasks_qs = ProjectTask.objects.filter(
        deadline__isnull=False,
        project__is_deleted=False
    ).exclude(status='DONE').exclude(project__status='ARCHIVED')

    if user and user.is_authenticated:
        tasks_qs = tasks_qs.filter(project__user=user)

    for task in tasks_qs:
        reminder_mins = task.reminder_minutes if task.reminder_minutes is not None else 0
        if reminder_mins == 0:
            is_due = (now - timedelta(minutes=2)) <= task.deadline <= (now + timedelta(hours=24))
        else:
            reminder_threshold = now + timedelta(minutes=reminder_mins)
            is_due = now <= task.deadline <= reminder_threshold

        if is_due:
            owner = task.project.user
            time_str = timezone.localtime(task.deadline).strftime("%d/%m a las %H:%M") if hasattr(timezone, 'localtime') else task.deadline.strftime("%d/%m a las %H:%M")
            title = f"Tarea por vencer: {task.title}"
            message = f"Tu tarea '{task.title}' en '{task.project.title}' vence el {time_str}."

            existing = Notification.objects.filter(
                title=title,
                message=message,
                user=owner
            ).exists()

            if not existing and owner:
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


def calculate_learning_progress(learning_item):
    """
    Computes and updates progress_percentage for a LearningItem based on its progress_mode:
    - 'TOPICS': (completed_topics / total_topics) * 100
    - 'MANUAL': (current_unit / total_units) * 100 if total_units > 0 else progress_percentage
    Automatically sets status to 'COMPLETED' if 100% is reached.
    """
    if learning_item.status == 'COMPLETED':
        learning_item.progress_percentage = 100
    elif learning_item.progress_mode == 'TOPICS':
        total = learning_item.topics.count()
        if total == 0:
            learning_item.progress_percentage = 0
        else:
            completed = learning_item.topics.filter(is_completed=True).count()
            learning_item.progress_percentage = min(100, max(0, int(round((completed / total) * 100))))
            if completed == total and total > 0:
                learning_item.status = 'COMPLETED'
    else:  # MANUAL
        if learning_item.total_units > 0:
            learning_item.progress_percentage = min(100, max(0, int(round((learning_item.current_unit / learning_item.total_units) * 100))))
            if learning_item.current_unit >= learning_item.total_units:
                learning_item.status = 'COMPLETED'
                learning_item.progress_percentage = 100

    learning_item.save(update_fields=['progress_percentage', 'status', 'updated_at'])

    # Auto-complete milestone in linked goal if 100% completed
    if (learning_item.progress_percentage == 100 or learning_item.status == 'COMPLETED') and learning_item.goal_id:
        check_and_complete_goal_milestone_for_learning(learning_item)

    return learning_item.progress_percentage


def check_and_complete_goal_milestone_for_learning(learning_item):
    """
    When a learning resource reaches 100% or is marked COMPLETED,
    if it is linked to a Goal, searches uncompleted milestones for a match
    (by title, keywords, or single pending milestone) and marks it completed,
    triggering goal progress recalculation.
    """
    import re

    goal = learning_item.goal
    if not goal or goal.is_deleted:
        return None

    uncompleted = goal.milestones.filter(is_completed=False)
    if not uncompleted.exists():
        return None

    def clean(text):
        return re.sub(r'[^\w\s]', '', text.lower()).strip()

    item_title_clean = clean(learning_item.title)
    item_words = set(w for w in item_title_clean.split() if len(w) > 2)

    matched = None
    for m in uncompleted:
        m_title_clean = clean(m.title)
        # 1. Direct containment
        if item_title_clean in m_title_clean or m_title_clean in item_title_clean:
            matched = m
            break
        # 2. Significant keyword overlap
        m_words = set(w for w in m_title_clean.split() if len(w) > 2)
        overlap = item_words.intersection(m_words)
        if len(overlap) >= 1:
            matched = m
            break

    # 3. Fallback: if only one uncompleted milestone remains and the goal category is related to study
    if not matched and uncompleted.count() == 1 and goal.category.lower() in ('aprendizaje', 'estudio', 'general'):
        matched = uncompleted.first()

    if matched:
        matched.is_completed = True
        matched.save(update_fields=['is_completed'])
        calculate_goal_progress(goal)
        return matched

    return None


def schedule_learning_study_session(learning_item, start_time, end_time, notes=None, reminder_minutes=15):
    """
    Creates an EventItem in the calendar linked to a learning resource session.
    """
    from .models import EventItem
    event = EventItem.objects.create(
        user=learning_item.user,
        title=f"Estudiar: {learning_item.title}",
        description=notes or (f"Sesión de estudio para {learning_item.title}." + (f" Enlace: {learning_item.platform_url}" if learning_item.platform_url else "")),
        start_time=start_time,
        end_time=end_time,
        location=learning_item.platform_name or "Online",
        meeting_url=learning_item.platform_url,
        category="Estudio",
        color_hex=learning_item.color_hex or "#8B5CF6",
        status="PROGRAMMED",
        reminder_minutes=reminder_minutes
    )
    return event


def check_learning_dormancy(user=None):
    """
    Identifies active learning resources in IN_PROGRESS state that have had no
    activity for >= dormancy_alert_days (default 7, or 5+ days) and dispatches gentle
    in-app Notification and Web Push reminders (suppressed if an alert was sent in the last 48 hours).
    """
    from .models import LearningItem, Notification
    from django.utils import timezone
    import datetime

    now = timezone.now()
    items = LearningItem.objects.filter(is_deleted=False, status='IN_PROGRESS')
    if user:
        items = items.filter(user=user)

    notifications_created = []
    cutoff_48h = now - datetime.timedelta(hours=48)

    for item in items:
        if not item.last_activity_at:
            continue
        dormancy_days = (now - item.last_activity_at).days
        threshold = item.dormancy_alert_days or 5
        if dormancy_days >= threshold:
            already_notified = Notification.objects.filter(
                user=item.user,
                title__contains=item.title,
                created_at__gte=cutoff_48h
            ).exists()

            if not already_notified and item.user:
                notif_title = f"Momento de retomar: {item.title}"
                notif_message = f"💡 Llevas {dormancy_days} días sin registrar avance en tu curso '{item.title}'. ¡Dedícale 15 minutos hoy para no perder el ritmo!"
                notif = Notification.objects.create(
                    user=item.user,
                    title=notif_title,
                    message=notif_message,
                    is_read=False
                )
                send_web_push(
                    user=item.user,
                    title=notif_title,
                    message=notif_message,
                    url="/#aprendizaje"
                )
                notifications_created.append(notif)

    return notifications_created


def check_and_dispatch_all_reminders(user=None):
    """
    Aggregates approaching event reminders, goal deadlines, task deadlines, and learning dormancy,
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

    goal_notifs = check_approaching_goal_deadlines(user=user)
    task_notifs = check_approaching_task_deadlines(user=user)
    learning_notifs = check_learning_dormancy(user=user)
    return event_notifs + goal_notifs + task_notifs + learning_notifs


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


def calculate_streak(user, learning_item=None, event_item=None, mode='CONSECUTIVE') -> int:
    """
    Calculates consistency streak count for a user and specific learning/event item:
    - CONSECUTIVE: counts consecutive days stepping backward from today or yesterday.
    - WEEKLY_TARGET: counts distinct days completed within the current calendar week (Mon-Sun).
    """
    from .models import ActivityCheckIn
    from datetime import timedelta
    from django.utils import timezone

    if not user or not user.is_authenticated:
        return 0

    qs = ActivityCheckIn.objects.filter(user=user, is_completed=True)
    if learning_item:
        qs = qs.filter(learning_item=learning_item)
    elif event_item:
        qs = qs.filter(event_item=event_item)
    else:
        return 0

    completed_dates = set(qs.values_list('date', flat=True))
    if not completed_dates:
        return 0

    today = timezone.localdate()

    if mode == 'WEEKLY_TARGET':
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        days_in_week = sum(1 for d in completed_dates if start_of_week <= d <= end_of_week)
        return days_in_week

    # mode == 'CONSECUTIVE'
    streak = 0
    curr = today
    if curr not in completed_dates:
        curr = today - timedelta(days=1)
        if curr not in completed_dates:
            return 0

    while curr in completed_dates:
        streak += 1
        curr -= timedelta(days=1)

    return streak


@transaction.atomic
def toggle_activity_checkin(user, date=None, learning_item_id=None, event_item_id=None) -> dict:
    """
    Toggles a daily attendance check-in for a learning item or event (<50ms non-destructive).
    """
    from .models import ActivityCheckIn, LearningItem, EventItem
    from django.utils import timezone
    from datetime import datetime, date as date_class

    if not date:
        target_date = timezone.localdate()
    elif isinstance(date, str):
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            target_date = timezone.localdate()
    elif isinstance(date, date_class):
        target_date = date
    else:
        target_date = timezone.localdate()

    learning_item = None
    event_item = None
    if learning_item_id:
        learning_item = LearningItem.objects.filter(id=learning_item_id, is_deleted=False).first()
    if event_item_id:
        event_item = EventItem.objects.filter(id=event_item_id, is_deleted=False).first()

    if not learning_item and not event_item:
        raise ValueError("Must provide either a valid learning_item_id or event_item_id.")

    checkin_filter = {
        'user': user if user and user.is_authenticated else None,
        'date': target_date,
    }
    if learning_item:
        checkin_filter['learning_item'] = learning_item
    if event_item:
        checkin_filter['event_item'] = event_item

    checkin = ActivityCheckIn.objects.filter(**checkin_filter).first()
    if checkin:
        checkin.is_completed = not checkin.is_completed
        checkin.save(update_fields=['is_completed', 'updated_at'])
    else:
        checkin = ActivityCheckIn.objects.create(
            user=user if user and user.is_authenticated else None,
            date=target_date,
            learning_item=learning_item,
            event_item=event_item,
            is_completed=True,
            streak_count=1,
        )

    # Recalculate streak
    new_streak = calculate_streak(user, learning_item=learning_item, event_item=event_item)
    checkin.streak_count = new_streak
    checkin.save(update_fields=['streak_count', 'updated_at'])

    # If learning item, update last_activity_at and goal progress if connected
    if learning_item:
        learning_item.last_activity_at = timezone.now()
        learning_item.save(update_fields=['last_activity_at', 'updated_at'])
        if learning_item.goal and learning_item.goal.progress_mode == 'CONNECTED':
            calculate_goal_progress(learning_item.goal)

    return {
        'status': 'toggled',
        'is_completed': checkin.is_completed,
        'date': str(checkin.date),
        'streak_count': checkin.streak_count,
        'item_id': str(learning_item.id if learning_item else event_item.id),
        'item_type': 'LEARNING' if learning_item else 'EVENT',
    }


def get_progress_matrix_data(user, week_offset=0, search=None) -> dict:
    """
    Returns weekly progress matrix rows aggregated for active learning items and study sessions.
    """
    from .models import LearningItem, EventItem, ActivityCheckIn
    from datetime import timedelta
    from django.utils import timezone

    today = timezone.localdate()
    try:
        offset_val = int(week_offset)
    except (TypeError, ValueError):
        offset_val = 0

    target_date = today + timedelta(weeks=offset_val)
    start_of_week = target_date - timedelta(days=target_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    day_letters = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    week_dates = [start_of_week + timedelta(days=i) for i in range(7)]

    learning_qs = LearningItem.objects.filter(is_deleted=False).exclude(status='COMPLETED')
    if user and user.is_authenticated:
        learning_qs = learning_qs.filter(user=user)
    if search:
        learning_qs = learning_qs.filter(title__icontains=search)

    events_qs = EventItem.objects.filter(is_deleted=False, status='PROGRAMMED')
    if user and user.is_authenticated:
        events_qs = events_qs.filter(user=user)
    if search:
        events_qs = events_qs.filter(title__icontains=search)

    rows = []

    for item in learning_qs:
        checkins = set(ActivityCheckIn.objects.filter(
            learning_item=item,
            is_completed=True,
            date__range=[start_of_week, end_of_week]
        ).values_list('date', flat=True))

        attendance = []
        for i, d in enumerate(week_dates):
            attendance.append({
                'date': str(d),
                'day_letter': day_letters[i],
                'is_today': (d == today),
                'is_checked': (d in checkins),
            })

        is_checked_today = (today in checkins) if (start_of_week <= today <= end_of_week) else ActivityCheckIn.objects.filter(
            learning_item=item, is_completed=True, date=today
        ).exists()

        streak = calculate_streak(user, learning_item=item)

        next_topic = None
        if item.progress_mode == 'TOPICS':
            next_topic = item.topics.filter(is_completed=False).order_by('order').first()

        rows.append({
            'id': str(item.id),
            'title': item.title,
            'item_type': 'LEARNING',
            'platform_name': item.platform_name or '',
            'color_hex': item.color_hex,
            'current_streak': streak,
            'is_checked_today': is_checked_today,
            'progress_mode': item.progress_mode,
            'progress_percentage': item.progress_percentage,
            'current_unit': item.current_unit,
            'total_units': item.total_units,
            'next_topic_title': next_topic.title if next_topic else None,
            'weekly_attendance': attendance,
        })

    for ev in events_qs:
        checkins = set(ActivityCheckIn.objects.filter(
            event_item=ev,
            is_completed=True,
            date__range=[start_of_week, end_of_week]
        ).values_list('date', flat=True))

        attendance = []
        for i, d in enumerate(week_dates):
            attendance.append({
                'date': str(d),
                'day_letter': day_letters[i],
                'is_today': (d == today),
                'is_checked': (d in checkins),
            })

        is_checked_today = (today in checkins) if (start_of_week <= today <= end_of_week) else ActivityCheckIn.objects.filter(
            event_item=ev, is_completed=True, date=today
        ).exists()

        streak = calculate_streak(user, event_item=ev)

        rows.append({
            'id': str(ev.id),
            'title': ev.title,
            'item_type': 'EVENT',
            'platform_name': ev.location or ev.meeting_url or '',
            'color_hex': ev.color_hex,
            'current_streak': streak,
            'is_checked_today': is_checked_today,
            'progress_mode': 'MANUAL',
            'progress_percentage': 100 if ev.status == 'COMPLETED' else 0,
            'current_unit': 1 if is_checked_today else 0,
            'total_units': 1,
            'next_topic_title': None,
            'weekly_attendance': attendance,
        })

    rows.sort(key=lambda r: (1 if r['is_checked_today'] else 0, -r['current_streak'], r['title'].lower()))

    return {
        'active_week': {
            'start_date': str(start_of_week),
            'end_date': str(end_of_week),
        },
        'rows': rows,
    }


@transaction.atomic
def advance_progress_matrix_item(user, item_id) -> dict:
    """
    1-click advance for a learning item row: completes the next topic or increments unit +1,
    recalculating progress and automatically recording today's check-in.
    """
    from .models import LearningItem, LearningTopic
    from django.utils import timezone

    item = LearningItem.objects.select_for_update().filter(id=item_id, is_deleted=False).first()
    if not item:
        raise ValueError(f"Learning item with id '{item_id}' not found.")

    advanced_type = item.progress_mode
    completed_topic_title = None
    next_topic_title = None

    if item.progress_mode == 'TOPICS':
        next_topic = item.topics.filter(is_completed=False).order_by('order').first()
        if next_topic:
            next_topic.is_completed = True
            next_topic.save(update_fields=['is_completed'])
            completed_topic_title = next_topic.title

            total_topics = item.topics.count()
            completed_topics = item.topics.filter(is_completed=True).count()
            if total_topics > 0:
                item.progress_percentage = min(100, round((completed_topics / total_topics) * 100))
                item.current_unit = completed_topics
                item.total_units = total_topics
                if item.progress_percentage == 100 and item.status != 'COMPLETED':
                    item.status = 'COMPLETED'

            future_topic = item.topics.filter(is_completed=False).order_by('order').first()
            if future_topic:
                next_topic_title = future_topic.title
        else:
            item.progress_percentage = 100
    else:
        item.current_unit = min(item.total_units, item.current_unit + 1)
        if item.total_units > 0:
            item.progress_percentage = min(100, round((item.current_unit / item.total_units) * 100))
            if item.progress_percentage == 100 and item.status != 'COMPLETED':
                item.status = 'COMPLETED'

    item.last_activity_at = timezone.now()
    item.save(update_fields=['current_unit', 'total_units', 'progress_percentage', 'status', 'last_activity_at', 'updated_at'])

    # Auto-log today's check-in
    toggle_activity_checkin(user, date=timezone.localdate(), learning_item_id=str(item.id))

    if item.goal and item.goal.progress_mode == 'CONNECTED':
        calculate_goal_progress(item.goal)

    return {
        'id': str(item.id),
        'advanced_type': advanced_type,
        'completed_topic_title': completed_topic_title,
        'next_topic_title': next_topic_title,
        'current_unit': item.current_unit,
        'total_units': item.total_units,
        'progress_percentage': item.progress_percentage,
    }


@transaction.atomic
def link_goal_components(goal_id, project_ids=None, learning_item_ids=None):
    """
    Associates projects and courses bidirectionally to a Goal and recalculates connected progress.
    """
    from .models import Goal, Project, LearningItem
    goal = Goal.objects.select_for_update().filter(id=goal_id, is_deleted=False).first()
    if not goal:
        raise ValueError(f"Goal with id '{goal_id}' not found.")

    if project_ids is not None:
        Project.objects.filter(goal=goal).exclude(id__in=project_ids).update(goal=None)
        Project.objects.filter(id__in=project_ids).update(goal=goal)

    if learning_item_ids is not None:
        LearningItem.objects.filter(goal=goal).exclude(id__in=learning_item_ids).update(goal=None)
        LearningItem.objects.filter(id__in=learning_item_ids).update(goal=goal)

    calculate_goal_progress(goal)
    goal.refresh_from_db()
    return goal


@transaction.atomic
def conclude_goal(goal_id):
    """
    Explicit conclusion and celebration closure for a Goal (100% completed).
    """
    from .models import Goal
    goal = Goal.objects.select_for_update().filter(id=goal_id, is_deleted=False).first()
    if not goal:
        raise ValueError(f"Goal with id '{goal_id}' not found.")

    goal.status = 'COMPLETED'
    goal.progress_percentage = 100
    goal.save(update_fields=['status', 'progress_percentage', 'updated_at'])
    return goal

