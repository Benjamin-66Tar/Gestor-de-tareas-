from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import datetime
from django.contrib.auth.models import User
from .models import ElementoAura, UserProfile, Notification, Goal, GoalMilestone, Project, ProjectTask, TaskSubtask, EventItem, PushSubscription
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

