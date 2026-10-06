import os
import json
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import datetime
from django.contrib.auth.models import User
from .models import ElementoAura, UserProfile, Notification, Goal, GoalMilestone, Project, ProjectTask, TaskSubtask, EventItem, PushSubscription, AuditLog, LearningItem, LearningTopic, ActivityCheckIn
from .authentication import create_user_token


class ElementoAuraAPITests(APITestCase):
    def setUp(self):
        # Create elements with different dates
        self.item_july = ElementoAura.objects.create(
            titulo="Tarea de Julio",
            descripcion="Debe estar en Julio",
            tipo="ACTIVIDAD",
            fecha_limite=timezone.make_aware(datetime(2026, 7, 15, 12, 0)),
            color_hex="#123456"
        )
        self.item_august = ElementoAura.objects.create(
            titulo="Tarea de Agosto",
            descripcion="Debe estar en Agosto",
            tipo="EVENTO",
            fecha_limite=timezone.make_aware(datetime(2026, 8, 1, 10, 0)),
            color_hex="#654321"
        )
        self.item_no_date = ElementoAura.objects.create(
            titulo="Tarea sin fecha",
            descripcion="No tiene fecha limite",
            tipo="OBJETIVO",
            color_hex="#FFFFFF"
        )
        self.url = reverse('elemento-aura-list')

    def test_list_all_elements(self):
        """Should return all elements if no date filter is applied"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_filter_by_date_range(self):
        """Should filter elements within start_date and end_date"""
        response = self.client.get(self.url, {
            'start_date': '2026-07-01T00:00:00Z',
            'end_date': '2026-07-31T23:59:59Z'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titulo'], "Tarea de Julio")

    def test_filter_by_date_range_empty(self):
        """Should return empty list if range has no elements"""
        response = self.client.get(self.url, {
            'start_date': '2026-06-01T00:00:00Z',
            'end_date': '2026-06-30T23:59:59Z'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_elemento(self):
        """Should create a new ElementoAura"""
        data = {
            "titulo": "Nuevo Evento",
            "descripcion": "Detalles",
            "tipo": "EVENTO",
            "fecha_limite": "2026-07-20T15:00:00Z",
            "color_hex": "#00FF00"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ElementoAura.objects.count(), 4)
        self.assertEqual(ElementoAura.objects.filter(titulo="Nuevo Evento").count(), 1)

    def test_retrieve_elemento(self):
        """Should retrieve a single ElementoAura"""
        detail_url = reverse('elemento-aura-detail', args=[self.item_july.pk])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['titulo'], "Tarea de Julio")

    def test_update_elemento(self):
        """Should update an existing ElementoAura"""
        detail_url = reverse('elemento-aura-detail', args=[self.item_july.pk])
        data = {
            "titulo": "Tarea de Julio Editada",
            "color_hex": "#FF0000"
        }
        response = self.client.patch(detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item_july.refresh_from_db()
        self.assertEqual(self.item_july.titulo, "Tarea de Julio Editada")
        self.assertEqual(self.item_july.color_hex, "#FF0000")

    def test_delete_elemento(self):
        """Should delete an existing ElementoAura"""
        detail_url = reverse('elemento-aura-detail', args=[self.item_july.pk])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ElementoAura.objects.count(), 2)


class NavigationAndNotificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='nav_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        self.profile = UserProfile.objects.create(user=self.user, theme_preference='dark', avatar_url='https://example.com/avatar.png')
        self.n1 = Notification.objects.create(user=self.user, title="Alerta 1", message="Mensaje 1", is_read=False)
        self.n2 = Notification.objects.create(user=self.user, title="Alerta 2", message="Mensaje 2", is_read=False)
        self.n3 = Notification.objects.create(user=self.user, title="Alerta 3", message="Mensaje 3", is_read=True)

    def test_get_user_profile(self):
        url = reverse('user-profile')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['theme_preference'], 'dark')
        self.assertIn('username', res.data)

    def test_get_unread_notifications_count(self):
        url = reverse('notifications-unread-count')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 2)

    def test_list_notifications(self):
        url = reverse('notifications-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)

    def test_mark_notification_as_read(self):
        url = reverse('notification-mark-read', args=[self.n1.id])
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.n1.refresh_from_db()
        self.assertTrue(self.n1.is_read)


class GoalAndMilestoneAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='goal_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        self.goal = Goal.objects.create(
            user=self.user,
            title="Lanzar MVP",
            category="Trabajo",
            color_hex="#10B981",
            progress_mode="MILESTONES",
            deadline=timezone.now() + timezone.timedelta(days=7)
        )
        self.m1 = GoalMilestone.objects.create(goal=self.goal, title="Hito 1", weight=1, is_completed=False, order=1)
        self.m2 = GoalMilestone.objects.create(goal=self.goal, title="Hito 2", weight=3, is_completed=False, order=2)

    def test_create_goal_with_milestones(self):
        url = reverse('goals-list-create')
        payload = {
            "title": "Aprender Rust",
            "category": "Aprendizaje",
            "color_hex": "#EC4899",
            "progress_mode": "MILESTONES",
            "milestones": [
                {"title": "Básicos", "weight": 1, "order": 1},
                {"title": "Concurrencia", "weight": 2, "order": 2}
            ]
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], "Aprender Rust")
        self.assertEqual(len(res.data['milestones']), 2)

    def test_toggle_milestone_and_progress_recalculation(self):
        from .services import calculate_goal_progress
        calculate_goal_progress(self.goal)
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.progress_percentage, 0)

        # Toggle milestone 1 (weight 1 of total 4 => 25%)
        url = reverse('milestone-toggle', args=[self.goal.id, self.m1.id])
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['is_completed'], True)
        self.assertEqual(res.data['goal_progress_percentage'], 25)

        # Toggle milestone 2 (weight 3 of 4 => 100%)
        url2 = reverse('milestone-toggle', args=[self.goal.id, self.m2.id])
        res2 = self.client.post(url2)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['goal_progress_percentage'], 100)
        self.assertEqual(res2.data['goal_status'], 'COMPLETED')

    def test_manual_progress_mode(self):
        manual_goal = Goal.objects.create(
            user=self.user,
            title="Lectura libre",
            progress_mode="MANUAL",
            progress_percentage=45
        )
        url = reverse('goal-detail', args=[manual_goal.id])
        res = self.client.patch(url, {"progress_percentage": 70}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['progress_percentage'], 70)

    def test_calendar_sync_events(self):
        url = reverse('calendar-events-sync')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [e['titulo'] for e in res.data]
        self.assertTrue(any("🎯 Lanzar MVP" in t for t in titles))


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='project_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        self.goal = Goal.objects.create(
            user=self.user,
            title="Objetivo Estratégico",
            category="Empresa",
            color_hex="#10B981"
        )
        self.project = Project.objects.create(
            user=self.user,
            title="Rediseño de Plataforma",
            description="Modernización de interfaz",
            color_hex="#6366F1",
            status="ACTIVE",
            goal=self.goal
        )
        self.task1 = ProjectTask.objects.create(
            project=self.project,
            title="Diseñar wireframes",
            status="TODO",
            priority="HIGH",
            deadline=timezone.make_aware(datetime(2026, 9, 20, 18, 0)),
            order=1
        )
        self.task2 = ProjectTask.objects.create(
            project=self.project,
            title="Implementar frontend",
            status="TODO",
            priority="MEDIUM",
            deadline=timezone.make_aware(datetime(2026, 9, 25, 18, 0)),
            order=2
        )
        self.subtask1 = TaskSubtask.objects.create(
            task=self.task1,
            title="Esbozo en papel",
            is_completed=False,
            order=1
        )

    def test_list_projects(self):
        url = reverse('projects-list-create')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], "Rediseño de Plataforma")
        self.assertEqual(res.data[0]['total_tasks'], 2)
        self.assertEqual(res.data[0]['completed_tasks'], 0)
        self.assertEqual(res.data[0]['progress_percentage'], 0)

    def test_filter_projects_by_status_and_search(self):
        Project.objects.create(
            user=self.user,
            title="Proyecto Archivado Antiguo",
            status="ARCHIVED"
        )
        url = reverse('projects-list-create')
        
        # Filter ACTIVE
        res_active = self.client.get(url, {'status': 'ACTIVE'})
        self.assertEqual(len(res_active.data), 1)
        self.assertEqual(res_active.data[0]['status'], 'ACTIVE')

        # Filter ARCHIVED
        res_archived = self.client.get(url, {'status': 'ARCHIVED'})
        self.assertEqual(len(res_archived.data), 1)
        self.assertEqual(res_archived.data[0]['status'], 'ARCHIVED')

        # Search query
        res_search = self.client.get(url, {'search': 'Rediseño'})
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]['title'], "Rediseño de Plataforma")

    def test_create_project(self):
        url = reverse('projects-list-create')
        data = {
            "title": "Nuevo Proyecto Web",
            "description": "Prueba de creación",
            "color_hex": "#EC4899",
            "status": "ACTIVE",
            "goal": str(self.goal.id)
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], "Nuevo Proyecto Web")
        self.assertEqual(res.data['color_hex'], "#EC4899")
        self.assertEqual(res.data['progress_percentage'], 0)

    def test_task_status_transition_and_progress_calculation(self):
        url1 = reverse('task-status', args=[self.task1.id])
        
        # Move task1 to DONE (1 of 2 => 50%)
        res1 = self.client.patch(url1, {"status": "DONE"}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data['project_progress_percentage'], 50)
        self.assertEqual(res1.data['project_status'], 'ACTIVE')

        # Move task2 to DONE (2 of 2 => 100% and status COMPLETED)
        url2 = reverse('task-status', args=[self.task2.id])
        res2 = self.client.patch(url2, {"status": "DONE"}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['project_progress_percentage'], 100)
        self.assertEqual(res2.data['project_status'], 'COMPLETED')

    def test_toggle_subtask(self):
        url = reverse('subtask-toggle', args=[self.subtask1.id])
        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['is_completed'], True)

    def test_project_task_calendar_projection(self):
        url = reverse('calendar-events-sync')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [e['titulo'] for e in res.data]
        self.assertTrue(any("📋 Diseñar wireframes" in t for t in titles))
        self.assertTrue(any("📋 Implementar frontend" in t for t in titles))


class EventAPITests(APITestCase):
    def setUp(self):
        from datetime import timedelta
        self.user = User.objects.create_user(username='event_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        self.now = timezone.now()

        self.event_today = EventItem.objects.create(
            user=self.user,
            title="Reunión de Sincronización",
            description="Revisión de avances",
            start_time=self.now + timedelta(hours=1),
            end_time=self.now + timedelta(hours=2),
            location="Oficina Principal",
            meeting_url="https://meet.google.com/test",
            category="Trabajo",
            color_hex="#3B82F6",
            status="PROGRAMMED",
            reminder_minutes=15
        )

        self.event_past = EventItem.objects.create(
            user=self.user,
            title="Cita Pasada",
            description="Ya ocurrió ayer",
            start_time=self.now - timedelta(days=1, hours=2),
            end_time=self.now - timedelta(days=1, hours=1),
            category="Personal",
            color_hex="#10B981",
            status="COMPLETED"
        )

    def test_list_events(self):
        url = reverse('events-list-create')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        titles = [e['title'] for e in res.data]
        self.assertIn("Reunión de Sincronización", titles)

    def test_create_event_success(self):
        from datetime import timedelta
        url = reverse('events-list-create')
        data = {
            "title": "Presentación Demo",
            "description": "Demostración de la app Aura",
            "start_time": (self.now + timedelta(days=2)).isoformat(),
            "end_time": (self.now + timedelta(days=2, hours=1)).isoformat(),
            "location": "Auditorio B",
            "category": "Trabajo",
            "color_hex": "#8B5CF6",
            "status": "PROGRAMMED",
            "reminder_minutes": 30
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], "Presentación Demo")
        self.assertEqual(res.data['status'], "PROGRAMMED")

    def test_event_date_validation_error(self):
        from datetime import timedelta
        url = reverse('events-list-create')
        # End time before start time
        data = {
            "title": "Evento Inválido",
            "start_time": (self.now + timedelta(hours=2)).isoformat(),
            "end_time": (self.now + timedelta(hours=1)).isoformat(),
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_time", res.data)

    def test_event_status_transition(self):
        url = reverse('event-status', args=[self.event_today.id])

        # Complete event
        res_comp = self.client.patch(url, {"status": "COMPLETED"}, format='json')
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        self.assertEqual(res_comp.data['status'], "COMPLETED")

        # Cancel event
        res_canc = self.client.patch(url, {"status": "CANCELED"}, format='json')
        self.assertEqual(res_canc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_canc.data['status'], "CANCELED")

    def test_event_calendar_projection(self):
        url = reverse('calendar-events-sync')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        event_items = [e for e in res.data if e.get('tipo') == 'EVENTO']
        self.assertTrue(len(event_items) >= 2)
        event_titles = [e['titulo'] for e in event_items]
        self.assertTrue(any("Reunión de Sincronización" in t for t in event_titles))

    def test_approaching_event_reminder(self):
        from datetime import timedelta
        from .services import check_approaching_event_reminders

        urgent_event = EventItem.objects.create(
            user=self.user,
            title="Reunión Inminente",
            start_time=self.now + timedelta(minutes=10),
            end_time=self.now + timedelta(minutes=40),
            reminder_minutes=15,
            status="PROGRAMMED"
        )

        notifs = check_approaching_event_reminders(user=self.user)
        self.assertTrue(any("Reunión Inminente" in n.title for n in notifs))
        self.assertTrue(Notification.objects.filter(user=self.user, title__contains="Reunión Inminente").exists())


class WebPushNotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='push_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        PushSubscription.objects.all().delete()
        self.sub_data_laptop = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/laptop-endpoint-123",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0A3c85yNiYnvFPzCXTXGoLqSWWNiXY2Z6AAEBDeltaqU=",
                "auth": "tBHItJI5svbpez7KI4CCXg=="
            },
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0"
        }
        self.sub_data_mobile = {
            "endpoint": "https://web.push.apple.com/mobile-endpoint-456",
            "keys": {
                "p256dh": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDhkWPbjWIgFYXyVzN7u1d_sample_key_1234567890=",
                "auth": "mobileAuth123=="
            },
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        }

    def test_get_vapid_public_key(self):
        url = reverse('push-public-key')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('public_key', res.data)
        self.assertTrue(len(res.data['public_key']) > 10)

    def test_push_subscribe_and_multi_device(self):
        url = reverse('push-subscribe')
        
        # Subscribe Laptop
        res1 = self.client.post(url, self.sub_data_laptop, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)
        
        # Subscribe Mobile
        res2 = self.client.post(url, self.sub_data_mobile, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 2)

    def test_push_subscribe_updates_existing_endpoint(self):
        url = reverse('push-subscribe')
        
        self.client.post(url, self.sub_data_laptop, format='json')
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)

        # Update with new auth key for the same endpoint
        updated_data = dict(self.sub_data_laptop)
        updated_data['keys'] = {
            "p256dh": self.sub_data_laptop['keys']['p256dh'],
            "auth": "newAuthKey999=="
        }
        res = self.client.post(url, updated_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)
        sub = PushSubscription.objects.get(endpoint=self.sub_data_laptop['endpoint'], user=self.user)
        self.assertEqual(sub.auth, "newAuthKey999==")

    def test_push_unsubscribe(self):
        sub_url = reverse('push-subscribe')
        unsub_url = reverse('push-unsubscribe')
        
        self.client.post(sub_url, self.sub_data_laptop, format='json')
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)

        res = self.client.post(unsub_url, {"endpoint": self.sub_data_laptop['endpoint']}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 0)

    def test_push_test_dispatch(self):
        url = reverse('push-test-dispatch')
        res = self.client.post(url, {
            "title": "Aura Test",
            "message": "Notificación de prueba",
            "url": "/#eventos"
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("dispatched_count", res.data)

    def test_auto_pruning_on_410_gone(self):
        from unittest.mock import patch
        from pywebpush import WebPushException
        from .services import send_web_push
        import requests

        sub = PushSubscription.objects.create(
            user=self.user,
            endpoint="https://fcm.googleapis.com/fcm/send/expired-device-token",
            p256dh="test-p256dh",
            auth="test-auth"
        )
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)

        mock_response = requests.Response()
        mock_response.status_code = 410

        with patch('pywebpush.webpush', side_effect=WebPushException("Device unsubscribed", response=mock_response)):
            result = send_web_push(user=self.user, title="Test", message="Test alert")
            self.assertEqual(result['failed_pruned_count'], 1)
            self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 0)


class AuthenticationTests(APITestCase):
    def setUp(self):
        User.objects.filter(username__in=['aura_tester', 'test_user', 'new_tester']).delete()
        self.user = User.objects.create_user(
            username='aura_tester',
            email='aura_tester@example.com',
            password='Password123!'
        )

    def test_user_registration_success(self):
        url = reverse('auth-register')
        data = {
            'username': 'new_tester',
            'email': 'new_tester@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['username'], 'new_tester')

    def test_user_registration_mismatched_password(self):
        url = reverse('auth-register')
        data = {
            'username': 'mismatch_tester',
            'email': 'mismatch@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'DifferentPassword123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_username(self):
        url = reverse('auth-register')
        data = {
            'username': 'aura_tester',
            'email': 'different_email@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_with_username(self):
        url = reverse('auth-login')
        data = {
            'identifier': 'aura_tester',
            'password': 'Password123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'aura_tester')

    def test_user_login_with_email(self):
        url = reverse('auth-login')
        data = {
            'identifier': 'aura_tester@example.com',
            'password': 'Password123!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertEqual(res.data['user']['username'], 'aura_tester')

    def test_user_login_invalid_password(self):
        url = reverse('auth-login')
        data = {
            'identifier': 'aura_tester',
            'password': 'WrongPassword999!'
        }
        res = self.client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_logout(self):
        url = reverse('auth-logout')
        res = self.client.post(url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_session_verification_with_token(self):
        token = create_user_token(self.user)
        url = reverse('auth-session')
        
        # Valid token
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_authenticated'])
        self.assertEqual(res.data['user']['username'], 'aura_tester')

        # No token
        res_empty = self.client.get(url)
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)
        self.assertFalse(res_empty.data['is_authenticated'])


class DatabaseSecurityAndTenancyTests(APITestCase):
    """
    Dedicated test suite validating database isolation, Anti-IDOR object security,
    and unauthenticated request protection.
    """
    def setUp(self):
        User.objects.filter(username__in=['user_alice', 'user_bob']).delete()
        self.user_alice = User.objects.create_user(username='user_alice', password='Password123!')
        self.user_bob = User.objects.create_user(username='user_bob', password='Password123!')
        self.token_alice = create_user_token(self.user_alice)
        self.token_bob = create_user_token(self.user_bob)

    def test_unauthenticated_requests_are_rejected(self):
        """Unauthenticated requests to private endpoints must return 401 Unauthorized"""
        endpoints = [
            reverse('goals-list-create'),
            reverse('projects-list-create'),
            reverse('events-list-create'),
            reverse('notifications-list'),
            reverse('notifications-unread-count'),
            reverse('user-profile'),
            reverse('calendar-events-sync'),
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED, f"Expected 401 for unauthenticated {ep}")

    def test_bearer_token_authenticates_correctly(self):
        """Signed token passed via Authorization: Bearer <token> allows access to user's own data"""
        Goal.objects.create(user=self.user_alice, title="Meta de Alice")
        Goal.objects.create(user=self.user_bob, title="Meta de Bob")

        url = reverse('goals-list-create')
        res_alice = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_alice}")
        self.assertEqual(res_alice.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_alice.data), 1)
        self.assertEqual(res_alice.data[0]['title'], "Meta de Alice")

        res_bob = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_bob.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_bob.data), 1)
        self.assertEqual(res_bob.data[0]['title'], "Meta de Bob")

    def test_anti_idor_goal_detail_protection(self):
        """User Bob cannot read, modify, or delete Alice's goal"""
        goal_alice = Goal.objects.create(user=self.user_alice, title="Meta Secreta Alice")
        detail_url = reverse('goal-detail', args=[goal_alice.id])

        # Bob tries to read Alice's goal -> 404
        res_get = self.client.get(detail_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        # Bob tries to update Alice's goal -> 404
        res_patch = self.client.patch(detail_url, {"title": "Hackeado por Bob"}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_patch.status_code, status.HTTP_404_NOT_FOUND)
        goal_alice.refresh_from_db()
        self.assertEqual(goal_alice.title, "Meta Secreta Alice")

        # Bob tries to delete Alice's goal -> 404
        res_del = self.client.delete(detail_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Goal.objects.filter(id=goal_alice.id).exists())

    def test_anti_idor_project_and_task_protection(self):
        """User Bob cannot read, delete or add tasks to Alice's project"""
        project_alice = Project.objects.create(user=self.user_alice, title="Proyecto Privado Alice")
        task_alice = ProjectTask.objects.create(project=project_alice, title="Tarea de Alice")

        # Bob tries to view Alice's project -> 404
        proj_url = reverse('project-detail', args=[project_alice.id])
        res_proj = self.client.get(proj_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_proj.status_code, status.HTTP_404_NOT_FOUND)

        # Bob tries to add a task to Alice's project -> 404
        task_create_url = reverse('project-tasks-list-create', args=[project_alice.id])
        res_add_task = self.client.post(task_create_url, {"title": "Tarea Maliciosa"}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_add_task.status_code, status.HTTP_404_NOT_FOUND)

        # Bob tries to change task status -> 404
        task_status_url = reverse('task-status', args=[task_alice.id])
        res_status = self.client.patch(task_status_url, {"status": "DONE"}, format='json', HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_status.status_code, status.HTTP_404_NOT_FOUND)

        # Bob tries to delete Alice's project -> 404
        res_del_proj = self.client.delete(proj_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_del_proj.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Project.objects.filter(id=project_alice.id).exists())

    def test_anti_idor_event_protection(self):
        """User Bob cannot read, modify, or delete Alice's event"""
        now = timezone.now()
        event_alice = EventItem.objects.create(
            user=self.user_alice,
            title="Evento Confidencial Alice",
            start_time=now + timezone.timedelta(days=1),
            end_time=now + timezone.timedelta(days=1, hours=1),
        )
        event_url = reverse('event-detail', args=[event_alice.id])

        # Bob attempts GET -> 404
        res_get = self.client.get(event_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        # Bob attempts DELETE -> 404
        res_del = self.client.delete(event_url, HTTP_AUTHORIZATION=f"Bearer {self.token_bob}")
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(EventItem.objects.filter(id=event_alice.id).exists())

    def test_calendar_sync_tenant_isolation(self):
        """Calendar sync only returns data belonging to the authenticated user"""
        now = timezone.now()
        Goal.objects.create(user=self.user_alice, title="Meta de Alice", deadline=now + timezone.timedelta(days=5))
        Goal.objects.create(user=self.user_bob, title="Meta de Bob", deadline=now + timezone.timedelta(days=5))

        url = reverse('calendar-events-sync')
        res_alice = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token_alice}")
        self.assertEqual(res_alice.status_code, status.HTTP_200_OK)
        alice_titles = [e['titulo'] for e in res_alice.data]
        self.assertTrue(any("Meta de Alice" in t for t in alice_titles))
        self.assertFalse(any("Meta de Bob" in t for t in alice_titles))


from django.db.utils import IntegrityError

class DatabaseIntegrityAndAcidTests(APITestCase):
    """
    Tests enforcing database-level constraints (CheckConstraint),
    transactional atomicity (rollback on failure), and concurrent row-locking.
    """
    def setUp(self):
        User.objects.filter(username='acid_tester').delete()
        self.user = User.objects.create_user(username='acid_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_goal_progress_percentage_check_constraint(self):
        """Database rejects Goal progress_percentage > 100 via SQL CheckConstraint"""
        with self.assertRaises(IntegrityError):
            Goal.objects.create(
                user=self.user,
                title="Meta fuera de rango",
                progress_percentage=150
            )

    def test_project_progress_percentage_check_constraint(self):
        """Database rejects Project progress_percentage > 100 via SQL CheckConstraint"""
        with self.assertRaises(IntegrityError):
            Project.objects.create(
                user=self.user,
                title="Proyecto fuera de rango",
                progress_percentage=250
            )

    def test_event_end_time_before_start_time_check_constraint(self):
        """Database rejects EventItem where end_time < start_time via SQL CheckConstraint"""
        now = timezone.now()
        with self.assertRaises(IntegrityError):
            EventItem.objects.create(
                user=self.user,
                title="Evento con cronología rota",
                start_time=now + timezone.timedelta(hours=2),
                end_time=now + timezone.timedelta(hours=1)
            )

    def test_goal_update_atomic_rollback(self):
        """If milestone creation fails during goal update, the entire transaction rolls back"""
        goal = Goal.objects.create(user=self.user, title="Meta Original", progress_mode="MANUAL", progress_percentage=10)
        from .serializers import GoalSerializer
        from unittest.mock import patch

        data = {
            "title": "Meta Modificada",
            "milestones": [{"title": "Hito 1", "weight": 1}]
        }
        serializer = GoalSerializer(goal, data=data)
        self.assertTrue(serializer.is_valid())

        # Simulate database failure during milestone creation
        with patch('backend.models.GoalMilestone.objects.create', side_effect=RuntimeError("Simulated DB failure")):
            with self.assertRaises(RuntimeError):
                serializer.save()

        goal.refresh_from_db()
        # Due to transaction.atomic, title must NOT have changed
        self.assertEqual(goal.title, "Meta Original")
        self.assertEqual(goal.milestones.count(), 0)

    def test_project_task_update_atomic_rollback(self):
        """If subtask creation fails during task update, task changes rollback"""
        proj = Project.objects.create(user=self.user, title="Proyecto Test")
        task = ProjectTask.objects.create(project=proj, title="Tarea Original")
        from .serializers import ProjectTaskSerializer
        from unittest.mock import patch

        data = {
            "title": "Tarea Modificada",
            "subtasks": [{"title": "Subtarea 1"}]
        }
        serializer = ProjectTaskSerializer(task, data=data)
        self.assertTrue(serializer.is_valid())

        with patch('backend.models.TaskSubtask.objects.create', side_effect=RuntimeError("Simulated subtask error")):
            with self.assertRaises(RuntimeError):
                serializer.save()

        task.refresh_from_db()
        self.assertEqual(task.title, "Tarea Original")
        self.assertEqual(task.subtasks.count(), 0)


class DatabasePerformanceAndNPlusOneTests(APITestCase):
    """
    Tests ensuring query efficiency, index presence, and resolution of N+1 query patterns.
    """
    def setUp(self):
        User.objects.filter(username='perf_tester').delete()
        self.user = User.objects.create_user(username='perf_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_project_list_avoids_n_plus_one_queries(self):
        """
        Fetching multiple projects with multiple tasks and subtasks should execute a constant,
        bounded number of SQL queries rather than 1 + 2N queries.
        """
        # Create 5 projects, each with 3 tasks and 2 subtasks
        for p_idx in range(5):
            proj = Project.objects.create(
                user=self.user,
                title=f"Proyecto Optimizado {p_idx}",
                status="ACTIVE"
            )
            for t_idx in range(3):
                status_choice = "DONE" if t_idx % 2 == 0 else "TODO"
                task = ProjectTask.objects.create(
                    project=proj,
                    title=f"Tarea {p_idx}-{t_idx}",
                    status=status_choice
                )
                for s_idx in range(2):
                    TaskSubtask.objects.create(task=task, title=f"Subtarea {s_idx}")

        url = reverse('projects-list-create')
        
        # With annotate + select_related + prefetch_related, queries are reduced to exactly 3
        # queries regardless of having 5 projects, 15 tasks, and 30 subtasks.
        with self.assertNumQueries(3):
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(len(res.data), 5)
            for proj_data in res.data:
                self.assertEqual(proj_data['total_tasks'], 3)
                self.assertEqual(proj_data['completed_tasks'], 2)


class SoftDeleteAPITests(APITestCase):
    def setUp(self):
        User.objects.filter(username='softdel_user').delete()
        self.user = User.objects.create_user(username='softdel_user', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_goal_soft_delete_and_restore(self):
        # 1. Create a goal
        goal = Goal.objects.create(
            user=self.user,
            title="Meta a eliminar suavemente",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status="ACTIVE"
        )
        url_detail = reverse('goal-detail', kwargs={'pk': goal.id})
        url_list = reverse('goals-list-create')
        url_restore = reverse('goal-restore', kwargs={'pk': goal.id})

        # 2. Delete goal via API
        del_res = self.client.delete(url_detail)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # 3. Verify in DB: still exists, marked as is_deleted=True
        goal.refresh_from_db()
        self.assertTrue(goal.is_deleted)
        self.assertIsNotNone(goal.deleted_at)

        # 4. Standard list excludes soft-deleted goal
        list_res = self.client.get(url_list)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        goal_ids = [g['id'] for g in list_res.data]
        self.assertNotIn(str(goal.id), goal_ids)

        # 5. Trash list includes soft-deleted goal
        trash_res = self.client.get(url_list, {'is_deleted': 'true'})
        self.assertEqual(trash_res.status_code, status.HTTP_200_OK)
        trash_ids = [g['id'] for g in trash_res.data]
        self.assertIn(str(goal.id), trash_ids)

        # 6. Direct detail GET returns 404 for soft-deleted goal
        detail_res = self.client.get(url_detail)
        self.assertEqual(detail_res.status_code, status.HTTP_404_NOT_FOUND)

        # 7. Calendar sync excludes soft-deleted goal
        cal_url = reverse('calendar-events-sync')
        cal_res = self.client.get(cal_url)
        event_sources = [ev.get('source_id') for ev in cal_res.data]
        self.assertNotIn(str(goal.id), event_sources)

        # 8. Restore goal via restore endpoint
        restore_res = self.client.post(url_restore)
        self.assertEqual(restore_res.status_code, status.HTTP_200_OK)
        self.assertFalse(restore_res.data['is_deleted'])
        self.assertIsNone(restore_res.data['deleted_at'])

        # 9. Detail GET now succeeds
        detail_after_restore = self.client.get(url_detail)
        self.assertEqual(detail_after_restore.status_code, status.HTTP_200_OK)

        # 10. Calendar sync includes it again
        cal_res_restored = self.client.get(cal_url)
        event_sources_restored = [ev.get('source_id') for ev in cal_res_restored.data]
        self.assertIn(str(goal.id), event_sources_restored)

    def test_project_soft_delete_and_restore(self):
        project = Project.objects.create(
            user=self.user,
            title="Proyecto a eliminar suavemente",
            status="ACTIVE"
        )
        url_detail = reverse('project-detail', kwargs={'pk': project.id})
        url_list = reverse('projects-list-create')
        url_restore = reverse('project-restore', kwargs={'pk': project.id})

        # Soft delete
        del_res = self.client.delete(url_detail)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        project.refresh_from_db()
        self.assertTrue(project.is_deleted)
        self.assertIsNotNone(project.deleted_at)

        # List excludes soft-deleted project
        list_res = self.client.get(url_list)
        proj_ids = [p['id'] for p in list_res.data]
        self.assertNotIn(str(project.id), proj_ids)

        # Restore
        restore_res = self.client.post(url_restore)
        self.assertEqual(restore_res.status_code, status.HTTP_200_OK)
        self.assertFalse(restore_res.data['is_deleted'])

    def test_event_soft_delete_and_restore(self):
        now = timezone.now()
        event = EventItem.objects.create(
            user=self.user,
            title="Evento a eliminar suavemente",
            start_time=now + timezone.timedelta(hours=1),
            end_time=now + timezone.timedelta(hours=2),
            status="PROGRAMMED"
        )
        url_detail = reverse('event-detail', kwargs={'pk': event.id})
        url_list = reverse('events-list-create')
        url_restore = reverse('event-restore', kwargs={'pk': event.id})

        # Soft delete
        del_res = self.client.delete(url_detail)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        event.refresh_from_db()
        self.assertTrue(event.is_deleted)
        self.assertIsNotNone(event.deleted_at)

        # List excludes soft deleted event
        list_res = self.client.get(url_list)
        event_ids = [e['id'] for e in list_res.data]
        self.assertNotIn(str(event.id), event_ids)

        # Restore
        restore_res = self.client.post(url_restore)
        self.assertEqual(restore_res.status_code, status.HTTP_200_OK)
        self.assertFalse(restore_res.data['is_deleted'])


class AuditTrailAPITests(APITestCase):
    def setUp(self):
        User.objects.filter(username__in=['audit_user_a', 'audit_user_b']).delete()
        self.user_a = User.objects.create_user(username='audit_user_a', password='Password123!')
        self.user_b = User.objects.create_user(username='audit_user_b', password='Password123!')
        self.client.force_authenticate(user=self.user_a)

    def test_audit_logs_recorded_on_crud_and_restore(self):
        # 1. CREATE Goal via API
        create_res = self.client.post(reverse('goals-list-create'), {
            'title': 'Meta Auditada',
            'category': 'Desarrollo',
            'color_hex': '#10B981',
            'progress_mode': 'MANUAL',
            'progress_percentage': 10
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        goal_id = create_res.data['id']

        create_log = AuditLog.objects.filter(object_id=goal_id, action='CREATE').first()
        self.assertIsNotNone(create_log)
        self.assertEqual(create_log.user, self.user_a)
        self.assertEqual(create_log.model_name, 'Goal')

        # 2. UPDATE Goal via API
        patch_res = self.client.patch(reverse('goal-detail', kwargs={'pk': goal_id}), {
            'title': 'Meta Auditada Modificada'
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        update_log = AuditLog.objects.filter(object_id=goal_id, action='UPDATE').first()
        self.assertIsNotNone(update_log)
        self.assertEqual(update_log.user, self.user_a)

        # 3. DELETE (Soft Delete) Goal via API
        del_res = self.client.delete(reverse('goal-detail', kwargs={'pk': goal_id}))
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        del_log = AuditLog.objects.filter(object_id=goal_id, action='DELETE').first()
        self.assertIsNotNone(del_log)
        self.assertEqual(del_log.user, self.user_a)

        # 4. RESTORE Goal via API
        restore_res = self.client.post(reverse('goal-restore', kwargs={'pk': goal_id}))
        self.assertEqual(restore_res.status_code, status.HTTP_200_OK)

        restore_log = AuditLog.objects.filter(object_id=goal_id, action='RESTORE').first()
        self.assertIsNotNone(restore_log)
        self.assertEqual(restore_log.user, self.user_a)

        # 5. Verify Audit Logs API returns all records in chronological order
        logs_res = self.client.get(reverse('audit-logs-list'))
        self.assertEqual(logs_res.status_code, status.HTTP_200_OK)
        actions = [item['action'] for item in logs_res.data]
        self.assertIn('CREATE', actions)
        self.assertIn('UPDATE', actions)
        self.assertIn('DELETE', actions)
        self.assertIn('RESTORE', actions)

    def test_audit_logs_tenant_isolation(self):
        # User A creates a goal -> generates audit log
        self.client.post(reverse('goals-list-create'), {
            'title': 'Meta Privada Usuario A',
            'progress_mode': 'MANUAL',
            'progress_percentage': 0
        }, format='json')

        # Switch to User B
        self.client.force_authenticate(user=self.user_b)

        # User B queries audit logs -> must receive empty list
        logs_res = self.client.get(reverse('audit-logs-list'))
        self.assertEqual(logs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(logs_res.data), 0)


class GoalAndTaskReminderTests(APITestCase):
    """
    Tests ensuring deadline checking, configurable reminder windows,
    status-based suppression, and push notification dispatch for Goals and Tasks.
    """
    def setUp(self):
        from datetime import timedelta
        User.objects.filter(username__in=['reminder_tester']).delete()
        self.user = User.objects.create_user(username='reminder_tester', password='Password123!')
        self.client.force_authenticate(user=self.user)
        self.now = timezone.now()

    def test_approaching_goal_deadline_creates_notification_and_dispatches_push(self):
        from datetime import timedelta
        from .services import check_approaching_goal_deadlines

        Goal.objects.create(
            user=self.user,
            title="Lanzar Campaña Q4",
            deadline=self.now + timedelta(minutes=10),
            reminder_minutes=15,
            status="ACTIVE"
        )

        notifs = check_approaching_goal_deadlines(user=self.user)
        self.assertTrue(any("Lanzar Campaña Q4" in n.title for n in notifs))
        self.assertTrue(
            Notification.objects.filter(user=self.user, title__contains="Lanzar Campaña Q4").exists()
        )

    def test_goal_deadline_reminder_suppressed_if_completed_or_paused(self):
        from datetime import timedelta
        from .services import check_approaching_goal_deadlines

        # Completed goal
        Goal.objects.create(
            user=self.user,
            title="Meta Completada",
            deadline=self.now + timedelta(minutes=5),
            reminder_minutes=15,
            status="COMPLETED"
        )
        # Paused goal
        Goal.objects.create(
            user=self.user,
            title="Meta Pausada",
            deadline=self.now + timedelta(minutes=5),
            reminder_minutes=15,
            status="PAUSED"
        )

        notifs = check_approaching_goal_deadlines(user=self.user)
        self.assertEqual(len(notifs), 0)
        self.assertFalse(
            Notification.objects.filter(user=self.user, title__contains="Meta Completada").exists()
        )
        self.assertFalse(
            Notification.objects.filter(user=self.user, title__contains="Meta Pausada").exists()
        )

    def test_approaching_task_deadline_creates_notification(self):
        from datetime import timedelta
        from .services import check_approaching_task_deadlines

        project = Project.objects.create(
            user=self.user,
            title="Proyecto Alfa",
            status="ACTIVE"
        )
        ProjectTask.objects.create(
            project=project,
            title="Entregar Documentación",
            deadline=self.now + timedelta(minutes=10),
            reminder_minutes=15,
            status="IN_PROGRESS"
        )

        notifs = check_approaching_task_deadlines(user=self.user)
        self.assertTrue(any("Entregar Documentación" in n.title for n in notifs))
        self.assertTrue(
            Notification.objects.filter(user=self.user, title__contains="Entregar Documentación").exists()
        )

    def test_task_deadline_reminder_suppressed_if_done_or_project_archived(self):
        from datetime import timedelta
        from .services import check_approaching_task_deadlines

        project_active = Project.objects.create(
            user=self.user,
            title="Proyecto Beta",
            status="ACTIVE"
        )
        # Done task in active project
        ProjectTask.objects.create(
            project=project_active,
            title="Tarea Terminada",
            deadline=self.now + timedelta(minutes=5),
            reminder_minutes=15,
            status="DONE"
        )

        # Active task in archived project
        project_archived = Project.objects.create(
            user=self.user,
            title="Proyecto Archivado",
            status="ARCHIVED"
        )
        ProjectTask.objects.create(
            project=project_archived,
            title="Tarea en Proyecto Archivado",
            deadline=self.now + timedelta(minutes=5),
            reminder_minutes=15,
            status="TODO"
        )

        notifs = check_approaching_task_deadlines(user=self.user)
        self.assertEqual(len(notifs), 0)
        self.assertFalse(
            Notification.objects.filter(user=self.user, title__contains="Tarea Terminada").exists()
        )
        self.assertFalse(
            Notification.objects.filter(user=self.user, title__contains="Tarea en Proyecto Archivado").exists()
        )

    def test_check_and_dispatch_all_reminders_aggregates_all_types(self):
        from datetime import timedelta
        from .services import check_and_dispatch_all_reminders

        # 1. Event
        EventItem.objects.create(
            user=self.user,
            title="Evento Reunión Global",
            start_time=self.now + timedelta(minutes=10),
            end_time=self.now + timedelta(minutes=40),
            reminder_minutes=15,
            status="PROGRAMMED"
        )
        # 2. Goal
        Goal.objects.create(
            user=self.user,
            title="Meta Global Q4",
            deadline=self.now + timedelta(minutes=10),
            reminder_minutes=15,
            status="ACTIVE"
        )
        # 3. Task
        project = Project.objects.create(
            user=self.user,
            title="Proyecto Global",
            status="ACTIVE"
        )
        ProjectTask.objects.create(
            project=project,
            title="Tarea Global 1",
            deadline=self.now + timedelta(minutes=10),
            reminder_minutes=15,
            status="TODO"
        )

        result = check_and_dispatch_all_reminders(user=self.user)
        self.assertEqual(len(result), 3)
        titles = [n.title for n in result]
        self.assertTrue(any("Evento Reunión Global" in t for t in titles))
        self.assertTrue(any("Meta Global Q4" in t for t in titles))
        self.assertTrue(any("Tarea Global 1" in t for t in titles))

    def test_goal_api_reminder_minutes_crud(self):
        # Create goal with reminder_minutes
        res = self.client.post(reverse('goals-list-create'), {
            'title': 'Objetivo con Recordatorio 30m',
            'category': 'Desarrollo',
            'color_hex': '#10B981',
            'progress_mode': 'MANUAL',
            'progress_percentage': 0,
            'reminder_minutes': 30
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['reminder_minutes'], 30)
        goal_id = res.data['id']

        # Update reminder_minutes
        patch_res = self.client.patch(reverse('goal-detail', kwargs={'pk': goal_id}), {
            'reminder_minutes': 60
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['reminder_minutes'], 60)

    def test_task_api_reminder_minutes_crud(self):
        project = Project.objects.create(
            user=self.user,
            title="Proyecto Tarea Reminder",
            status="ACTIVE"
        )
        # Create task with reminder_minutes
        res = self.client.post(reverse('project-tasks-list-create', kwargs={'project_id': project.id}), {
            'title': 'Tarea con Recordatorio 15m',
            'priority': 'HIGH',
            'status': 'TODO',
            'reminder_minutes': 15
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['reminder_minutes'], 15)
        task_id = res.data['id']

        # Update reminder_minutes
        patch_res = self.client.patch(reverse('task-detail', kwargs={'pk': task_id}), {
            'reminder_minutes': 0
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['reminder_minutes'], 0)


class InfrastructureAndHealthTests(APITestCase):
    def test_database_health_check_endpoint(self):
        """
        Public healthcheck endpoint must ping the DB and report latency, engine, and status.
        """
        url = reverse('database-health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertTrue(response.data['database']['connected'])
        self.assertIn('vendor', response.data['database'])
        self.assertGreaterEqual(response.data['database']['latency_ms'], 0)
        self.assertIn('timestamp', response.data)

    def test_backup_database_command(self):
        """
        Management command 'backup_database' should generate a valid JSON dump and SHA-256 checksum.
        """
        import tempfile
        from django.core.management import call_command

        with tempfile.TemporaryDirectory() as tmpdir:
            call_command('backup_database', output_dir=tmpdir)
            files = os.listdir(tmpdir)
            json_files = [f for f in files if f.endswith('.json')]
            sha_files = [f for f in files if f.endswith('.sha256')]
            self.assertEqual(len(json_files), 1)
            self.assertEqual(len(sha_files), 1)

            # Check that JSON is parseable
            with open(os.path.join(tmpdir, json_files[0]), 'r', encoding='utf-8') as f:
                dump_data = json.load(f)
                self.assertIsInstance(dump_data, list)

    def test_dispatch_reminders_command(self):
        """
        Management command 'dispatch_reminders' must execute cleanly without error.
        """
        from django.core.management import call_command
        # Should execute without raising any exceptions
        call_command('dispatch_reminders')


# --- Learning Hub Unit & Integration Tests ---

class LearningItemAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='learner1', password='learnerpass123')
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.course = LearningItem.objects.create(
            user=self.user,
            title="TypeScript Deep Dive",
            description="Maestría en TypeScript avanzado",
            resource_type="COURSE",
            platform_name="FrontendMasters",
            platform_url="https://frontendmasters.com/courses/typescript",
            color_hex="#8B5CF6",
            status="IN_PROGRESS",
            progress_mode="TOPICS",
            current_unit=0,
            total_units=10,
            dormancy_alert_days=5
        )

        self.book = LearningItem.objects.create(
            user=self.user,
            title="Clean Architecture",
            description="Principios de arquitectura limpia",
            resource_type="BOOK",
            platform_name="Físico",
            platform_url="",
            color_hex="#3B82F6",
            status="BACKLOG",
            progress_mode="MANUAL",
            current_unit=0,
            total_units=300,
            dormancy_alert_days=7
        )

    def test_list_learning_items(self):
        url = reverse('learning-items-list-create')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_filter_by_status_and_type(self):
        url = reverse('learning-items-list-create')
        # Filter by status
        res = self.client.get(url, {'status': 'IN_PROGRESS'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], "TypeScript Deep Dive")

        # Filter by resource_type
        res2 = self.client.get(url, {'resource_type': 'BOOK'})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res2.data), 1)
        self.assertEqual(res2.data[0]['title'], "Clean Architecture")

    def test_search_learning_items(self):
        url = reverse('learning-items-list-create')
        res = self.client.get(url, {'search': 'FrontendMasters'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], "TypeScript Deep Dive")

    def test_create_learning_item(self):
        url = reverse('learning-items-list-create')
        payload = {
            "title": "React Docs Official",
            "description": "Documentación oficial de React 19",
            "resource_type": "TECH_DOC",
            "platform_name": "react.dev",
            "platform_url": "https://react.dev",
            "color_hex": "#8B5CF6",
            "status": "IN_PROGRESS",
            "progress_mode": "MANUAL",
            "current_unit": 5,
            "total_units": 20,
            "last_point_reached": "Hooks de React",
            "takeaways_markdown": "### Notas de hooks"
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], "React Docs Official")
        self.assertEqual(res.data['progress_percentage'], 25)

    def test_retrieve_learning_item_detail(self):
        url = reverse('learning-item-detail', kwargs={'pk': self.course.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], "TypeScript Deep Dive")
        self.assertIn('topics', res.data)

    def test_update_learning_item(self):
        url = reverse('learning-item-detail', kwargs={'pk': self.course.id})
        res = self.client.patch(url, {
            'last_point_reached': 'Capítulo 3: Generics',
            'takeaways_markdown': 'Uso intensivo de condicionales con generics.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['last_point_reached'], 'Capítulo 3: Generics')
        self.assertIn('generics', res.data['takeaways_markdown'])

    def test_soft_delete_and_restore(self):
        detail_url = reverse('learning-item-detail', kwargs={'pk': self.course.id})
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        self.course.refresh_from_db()
        self.assertTrue(self.course.is_deleted)
        self.assertIsNotNone(self.course.deleted_at)

        # Restore
        restore_url = reverse('learning-item-restore', kwargs={'pk': self.course.id})
        rest_res = self.client.post(restore_url)
        self.assertEqual(rest_res.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertFalse(self.course.is_deleted)


class LearningTopicsAndProgressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='topicsuser', password='password123')
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.course = LearningItem.objects.create(
            user=self.user,
            title="FastAPI Masterclass",
            resource_type="COURSE",
            status="IN_PROGRESS",
            progress_mode="TOPICS"
        )

    def test_add_and_toggle_topic(self):
        # 1. Add Topic
        url_add = reverse('learning-topics-list-create', kwargs={'learning_id': self.course.id})
        res1 = self.client.post(url_add, {
            'title': 'Lección 1: Routers y Pydantic',
            'section_name': 'Módulo 1'
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        topic1_id = res1.data['id']

        res2 = self.client.post(url_add, {
            'title': 'Lección 2: Inyección de Dependencias',
            'section_name': 'Módulo 1'
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        topic2_id = res2.data['id']

        self.course.refresh_from_db()
        self.assertEqual(self.course.progress_percentage, 0)

        # 2. Toggle Topic 1
        url_toggle1 = reverse('learning-topic-toggle', kwargs={'learning_id': self.course.id, 'topic_id': topic1_id})
        res_toggle1 = self.client.patch(url_toggle1, {'is_completed': True}, format='json')
        self.assertEqual(res_toggle1.status_code, status.HTTP_200_OK)
        self.assertTrue(res_toggle1.data['is_completed'])
        self.assertEqual(res_toggle1.data['parent_progress_percentage'], 50)

        # 3. Toggle Topic 2 -> 100% and transitions to COMPLETED
        url_toggle2 = reverse('learning-topic-toggle', kwargs={'learning_id': self.course.id, 'topic_id': topic2_id})
        res_toggle2 = self.client.patch(url_toggle2, {'is_completed': True}, format='json')
        self.assertEqual(res_toggle2.status_code, status.HTTP_200_OK)
        self.assertEqual(res_toggle2.data['parent_progress_percentage'], 100)
        self.assertEqual(res_toggle2.data['parent_status'], 'COMPLETED')

        self.course.refresh_from_db()
        self.assertEqual(self.course.status, 'COMPLETED')


class LearningSessionAndLogTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='sessionuser', password='password123')
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.item = LearningItem.objects.create(
            user=self.user,
            title="Sistemas Distribuidos",
            resource_type="BOOK",
            platform_name="Libro",
            platform_url="https://dist-sys.net",
            status="IN_PROGRESS",
            progress_mode="MANUAL",
            current_unit=10,
            total_units=100
        )

    def test_schedule_study_session(self):
        url = reverse('learning-schedule-session', kwargs={'pk': self.item.id})
        payload = {
            "start_time": "2026-10-05T18:00:00Z",
            "end_time": "2026-10-05T19:30:00Z",
            "notes": "Lectura capítulo de Raft y Paxos",
            "reminder_minutes": 15
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("Estudiar: Sistemas Distribuidos", res.data['title'])
        self.assertEqual(res.data['category'], "Estudio")
        self.assertEqual(res.data['meeting_url'], "https://dist-sys.net")

        # Verify EventItem exists in DB
        event = EventItem.objects.get(pk=res.data['event_id'])
        self.assertEqual(event.user, self.user)
        self.assertEqual(event.category, "Estudio")

    def test_log_activity_quick_increment(self):
        url = reverse('learning-log-activity', kwargs={'pk': self.item.id})
        res = self.client.post(url, {
            'increment_units': 5,
            'new_last_point': 'Capítulo 3 terminado'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['current_unit'], 15)
        self.assertEqual(res.data['progress_percentage'], 15)
        self.assertFalse(res.data['is_dormant'])


class LearningDormancyServiceTests(TestCase):
    def setUp(self):
        import datetime
        self.user = User.objects.create_user(username='dormantuser', password='password123')
        # Active item with last activity 8 days ago (threshold: 5 days)
        self.dormant_item = LearningItem.objects.create(
            user=self.user,
            title="Dormant Python Course",
            status="IN_PROGRESS",
            dormancy_alert_days=5,
            last_activity_at=timezone.now() - datetime.timedelta(days=8)
        )
        # Active fresh item with activity today
        self.fresh_item = LearningItem.objects.create(
            user=self.user,
            title="Fresh React Course",
            status="IN_PROGRESS",
            dormancy_alert_days=5,
            last_activity_at=timezone.now()
        )

    def test_check_learning_dormancy_creates_notification(self):
        from .services import check_learning_dormancy
        notifs = check_learning_dormancy(user=self.user)
        self.assertEqual(len(notifs), 1)
        self.assertIn("Dormant Python Course", notifs[0].title)

        # Calling again within 48h should not duplicate
        notifs2 = check_learning_dormancy(user=self.user)
        self.assertEqual(len(notifs2), 0)


class LearningGoalLinkIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="learner1", email="learner@aura.app", password="password123")
        self.client.force_authenticate(user=self.user)

        self.goal = Goal.objects.create(
            user=self.user,
            title="Aprender TypeScript y React",
            category="Aprendizaje",
            progress_mode="MILESTONES",
            status="ACTIVE"
        )
        self.m1 = GoalMilestone.objects.create(
            goal=self.goal,
            title="Completar curso de TypeScript",
            is_completed=False,
            weight=1,
            order=0
        )
        self.m2 = GoalMilestone.objects.create(
            goal=self.goal,
            title="Construir app práctica",
            is_completed=False,
            weight=1,
            order=1
        )

        self.course = LearningItem.objects.create(
            user=self.user,
            title="Curso de TypeScript Avanzado",
            resource_type="COURSE",
            status="IN_PROGRESS",
            progress_mode="TOPICS",
            goal=self.goal
        )
        self.t1 = LearningTopic.objects.create(learning_item=self.course, title="Tipos Básicos", is_completed=True, order=0)
        self.t2 = LearningTopic.objects.create(learning_item=self.course, title="Genéricos", is_completed=False, order=1)

    def test_completing_course_auto_completes_goal_milestone(self):
        from .services import calculate_learning_progress

        # Initially milestone m1 is uncompleted, goal progress is 0%
        self.assertFalse(self.m1.is_completed)
        self.assertEqual(self.goal.progress_percentage, 0)

        # Complete second topic to make course 100%
        self.t2.is_completed = True
        self.t2.save()

        # Calculate learning progress
        progress = calculate_learning_progress(self.course)
        self.assertEqual(progress, 100)
        self.assertEqual(self.course.status, 'COMPLETED')

        # Milestone m1 should now be auto-completed
        self.m1.refresh_from_db()
        self.assertTrue(self.m1.is_completed)

        # Goal progress should be recalculated (1 of 2 milestones = 50%)
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.progress_percentage, 50)

    def test_serializers_include_linkage_fields(self):
        from .serializers import LearningItemSerializer, GoalSerializer
        goal_data = GoalSerializer(self.goal).data
        self.assertEqual(goal_data['linked_learning_count'], 1)

        course_data = LearningItemSerializer(self.course).data
        self.assertEqual(course_data['goal_title'], "Aprender TypeScript y React")


class ActivityCheckInAPITests(APITestCase):
    def setUp(self):
        from datetime import timedelta
        self.user = User.objects.create_user(username="checkinuser", password="securepassword123")
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.course = LearningItem.objects.create(
            user=self.user,
            title="Diseño de Software",
            resource_type="COURSE",
            status="IN_PROGRESS",
            progress_mode="TOPICS",
            current_unit=0,
            total_units=5
        )
        self.event = EventItem.objects.create(
            user=self.user,
            title="Sesión de Estudio Semanal",
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=2),
            status="PROGRAMMED"
        )
        self.toggle_url = reverse('checkin-toggle')

    def test_toggle_checkin_learning_item(self):
        """Should create check-in with is_completed=True and calculate streak"""
        response = self.client.post(self.toggle_url, {
            'learning_item_id': str(self.course.id),
            'date': str(timezone.localdate())
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_completed'])
        self.assertEqual(response.data['streak_count'], 1)
        self.assertEqual(response.data['item_type'], 'LEARNING')

        # Check persistence
        checkin = ActivityCheckIn.objects.get(user=self.user, learning_item=self.course, date=timezone.localdate())
        self.assertTrue(checkin.is_completed)

    def test_toggle_checkin_reversible(self):
        """Clicking toggle again should uncheck without removing history"""
        # First toggle: check
        self.client.post(self.toggle_url, {'learning_item_id': str(self.course.id)})
        # Second toggle: uncheck
        response = self.client.post(self.toggle_url, {'learning_item_id': str(self.course.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_completed'])

    def test_dual_streak_calculation(self):
        """Calculates consecutive days and weekly attendance targets"""
        from datetime import timedelta
        from .services import calculate_streak
        today = timezone.localdate()

        # Day 1: yesterday
        ActivityCheckIn.objects.create(
            user=self.user,
            learning_item=self.course,
            date=today - timedelta(days=1),
            is_completed=True
        )
        # Day 2: today
        ActivityCheckIn.objects.create(
            user=self.user,
            learning_item=self.course,
            date=today,
            is_completed=True
        )

        streak_consecutive = calculate_streak(self.user, learning_item=self.course, mode='CONSECUTIVE')
        self.assertEqual(streak_consecutive, 2)

        streak_weekly = calculate_streak(self.user, learning_item=self.course, mode='WEEKLY_TARGET')
        self.assertGreaterEqual(streak_weekly, 1)

    def test_toggle_event_checkin_preserves_event_status(self):
        """Daily check-in on multi-day event marks attendance without canceling/completing the event"""
        response = self.client.post(self.toggle_url, {'event_item_id': str(self.event.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_completed'])

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, 'PROGRAMMED')


class ProgressMatrixAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="matrixuser", password="password123")
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.course = LearningItem.objects.create(
            user=self.user,
            title="Arquitectura Limpia",
            resource_type="BOOK",
            status="IN_PROGRESS",
            progress_mode="TOPICS",
            current_unit=0,
            total_units=3
        )
        self.t1 = LearningTopic.objects.create(learning_item=self.course, title="Tema 1", is_completed=False, order=0)
        self.t2 = LearningTopic.objects.create(learning_item=self.course, title="Tema 2", is_completed=False, order=1)
        self.matrix_url = reverse('progress-matrix')

    def test_get_progress_matrix(self):
        """Should return active week and rows sorted by pending today first"""
        response = self.client.get(self.matrix_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('active_week', response.data)
        self.assertIn('rows', response.data)
        self.assertGreaterEqual(len(response.data['rows']), 1)
        row = response.data['rows'][0]
        self.assertEqual(len(row['weekly_attendance']), 7)
        self.assertFalse(row['is_checked_today'])

    def test_advance_progress_matrix_item(self):
        """1-click advance completes next topic and automatically logs today's check-in"""
        advance_url = reverse('progress-matrix-advance', kwargs={'pk': str(self.course.id)})
        response = self.client.post(advance_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['completed_topic_title'], "Tema 1")
        self.assertEqual(response.data['next_topic_title'], "Tema 2")

        self.t1.refresh_from_db()
        self.assertTrue(self.t1.is_completed)

        # Check that check-in was registered
        checkin_exists = ActivityCheckIn.objects.filter(
            user=self.user,
            learning_item=self.course,
            date=timezone.localdate(),
            is_completed=True
        ).exists()
        self.assertTrue(checkin_exists)


class GoalHorizonAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="horizonuser", password="password123")
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.long_goal = Goal.objects.create(
            user=self.user,
            title="Convertirse en Tech Lead",
            time_horizon="LONG_TERM",
            category="Carrera"
        )
        self.short_goal = Goal.objects.create(
            user=self.user,
            title="Aprender Docker",
            time_horizon="SHORT_TERM",
            parent_goal=self.long_goal,
            category="DevOps"
        )
        self.goals_url = reverse('goals-list-create')

    def test_filter_goals_by_time_horizon(self):
        """Can query goals filtered by SHORT_TERM and LONG_TERM"""
        res_short = self.client.get(self.goals_url, {'time_horizon': 'SHORT_TERM'})
        self.assertEqual(res_short.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_short.data), 1)
        self.assertEqual(res_short.data[0]['title'], "Aprender Docker")

        res_long = self.client.get(self.goals_url, {'time_horizon': 'LONG_TERM'})
        self.assertEqual(res_long.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_long.data), 1)
        self.assertEqual(res_long.data[0]['title'], "Convertirse en Tech Lead")

    def test_parent_child_goal_serialization(self):
        """Short-term goal includes parent goal id and title"""
        detail_url = reverse('goal-detail', kwargs={'pk': str(self.short_goal.id)})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['parent_goal_id'], str(self.long_goal.id))
        self.assertEqual(response.data['parent_goal_title'], "Convertirse en Tech Lead")


class ConnectedGoalAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="connecteduser", password="password123")
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.goal = Goal.objects.create(
            user=self.user,
            title="Lanzar Plataforma Web",
            progress_mode="CONNECTED",
            category="Emprendimiento"
        )
        self.proj = Project.objects.create(
            user=self.user,
            title="Frontend App",
            progress_percentage=80,
            goal=self.goal
        )
        self.course = LearningItem.objects.create(
            user=self.user,
            title="React y Vite Master",
            progress_percentage=60,
            goal=self.goal
        )
        self.milestone = GoalMilestone.objects.create(
            goal=self.goal,
            title="Beta Testing",
            is_completed=True,
            weight=1
        )

    def test_equitable_multi_component_progress_calculation(self):
        """Calculates equitable average across projects (80%), courses (60%), and milestones (100%)"""
        from .services import calculate_goal_progress
        progress = calculate_goal_progress(self.goal)
        # Average of (80 + 60 + 100) / 3 = 240 / 3 = 80%
        self.assertEqual(progress, 80)
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.progress_percentage, 80)

    def test_link_components_api(self):
        """Associates projects and courses bidirectionally via REST API"""
        link_url = reverse('goal-link-components', kwargs={'pk': str(self.goal.id)})
        response = self.client.post(link_url, {
            'project_ids': [str(self.proj.id)],
            'learning_item_ids': [str(self.course.id)]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('breakdown', response.data)
        self.assertEqual(response.data['breakdown']['present_count'], 3)

    def test_conclude_goal_api(self):
        """Marks goal as COMPLETED and 100% when celebrating completion"""
        conclude_url = reverse('goal-conclude', kwargs={'pk': str(self.goal.id)})
        response = self.client.post(conclude_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'COMPLETED')
        self.assertEqual(response.data['progress_percentage'], 100)


class LearningBulkAndDroppedAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="bulklearner", password="password123")
        self.token = create_user_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.goal = Goal.objects.create(
            user=self.user,
            title="DevOps Mastery",
            category="Tecnología",
            color_hex="#0EA5E9",
            progress_mode="CONNECTED",
            status="ACTIVE"
        )
        self.item1 = LearningItem.objects.create(
            user=self.user,
            title="Kubernetes Deep Dive",
            resource_type="COURSE",
            status="IN_PROGRESS",
            goal=self.goal,
            progress_percentage=40
        )
        self.item2 = LearningItem.objects.create(
            user=self.user,
            title="Terraform Cookbook",
            resource_type="BOOK",
            status="IN_PROGRESS",
            goal=self.goal,
            progress_percentage=60
        )
        self.item3 = LearningItem.objects.create(
            user=self.user,
            title="Prometheus Metrics",
            resource_type="ARTICLE",
            status="BACKLOG"
        )

    def test_url_platform_and_color_auto_detection(self):
        """URL domain automatically sets platform name and color hex on creation"""
        create_url = reverse('learning-items-list-create')
        res = self.client.post(create_url, {
            'title': 'React 19 Deep Dive',
            'resource_type': 'COURSE',
            'platform_url': 'https://www.youtube.com/watch?v=12345'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['platform_name'], 'YouTube')
        self.assertEqual(res.data['color_hex'], '#EF4444')

        res_udemy = self.client.post(create_url, {
            'title': 'Advanced TypeScript',
            'resource_type': 'COURSE',
            'platform_url': 'https://www.udemy.com/course/advanced-typescript/'
        }, format='json')
        self.assertEqual(res_udemy.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_udemy.data['platform_name'], 'Udemy')
        self.assertEqual(res_udemy.data['color_hex'], '#A435F0')

    def test_bulk_update_status_and_dropped_unlinking(self):
        """Bulk status update to DROPPED cleanly unlinks from goal and clears focus"""
        bulk_url = reverse('learning-items-bulk')
        res = self.client.patch(bulk_url, {
            'item_ids': [str(self.item1.id), str(self.item2.id)],
            'action': 'UPDATE_STATUS',
            'payload': {'status': 'DROPPED', 'dropped_reason': 'Cambio de prioridades'}
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['affected_count'], 2)

        self.item1.refresh_from_db()
        self.item2.refresh_from_db()
        self.assertEqual(self.item1.status, 'DROPPED')
        self.assertIsNone(self.item1.goal)
        self.assertIsNotNone(self.item1.dropped_at)
        self.assertEqual(self.item1.dropped_reason, 'Cambio de prioridades')
        self.assertFalse(self.item1.is_focus)

    def test_bulk_set_focus(self):
        """Bulk action toggles is_focus flag across selected items"""
        bulk_url = reverse('learning-items-bulk')
        res = self.client.patch(bulk_url, {
            'item_ids': [str(self.item1.id), str(self.item3.id)],
            'action': 'SET_FOCUS',
            'payload': {'is_focus': True}
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item1.refresh_from_db()
        self.item3.refresh_from_db()
        self.assertTrue(self.item1.is_focus)
        self.assertTrue(self.item3.is_focus)

    def test_bulk_soft_delete(self):
        """Bulk action soft deletes all specified items"""
        bulk_url = reverse('learning-items-bulk')
        res = self.client.patch(bulk_url, {
            'item_ids': [str(self.item1.id), str(self.item3.id)],
            'action': 'SOFT_DELETE'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.item1.refresh_from_db()
        self.item3.refresh_from_db()
        self.assertTrue(self.item1.is_deleted)
        self.assertTrue(self.item3.is_deleted)

