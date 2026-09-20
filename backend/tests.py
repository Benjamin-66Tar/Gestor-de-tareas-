from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import datetime
from .models import ElementoAura

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
        # Should return all 3 items
        self.assertEqual(len(response.data), 3)

    def test_filter_by_date_range(self):
        """Should filter elements within start_date and end_date"""
        # Filter for July 2026
        response = self.client.get(self.url, {
            'start_date': '2026-07-01T00:00:00Z',
            'end_date': '2026-07-31T23:59:59Z'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only the July item should be returned
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titulo'], "Tarea de Julio")

    def test_filter_by_date_range_empty(self):
        """Should return empty list if range has no elements"""
        # Filter for June 2026
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
        from .models import Notification, UserProfile
        self.profile = UserProfile.objects.create(theme_preference='dark', avatar_url='https://example.com/avatar.png')
        self.n1 = Notification.objects.create(title="Alerta 1", message="Mensaje 1", is_read=False)
        self.n2 = Notification.objects.create(title="Alerta 2", message="Mensaje 2", is_read=False)
        self.n3 = Notification.objects.create(title="Alerta 3", message="Mensaje 3", is_read=True)

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
        from .models import Goal, GoalMilestone
        self.goal = Goal.objects.create(
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
        # Initial progress 0%
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
        from .models import Goal
        manual_goal = Goal.objects.create(
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
        # Should include the projected deadline for self.goal
        titles = [e['titulo'] for e in res.data]
        self.assertTrue(any("🎯 Lanzar MVP" in t for t in titles))


class ProjectAPITests(APITestCase):
    def setUp(self):
        from .models import Goal, Project, ProjectTask, TaskSubtask
        self.goal = Goal.objects.create(
            title="Objetivo Estratégico",
            category="Empresa",
            color_hex="#10B981"
        )
        self.project = Project.objects.create(
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
        from .models import Project
        Project.objects.create(
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
        from .models import EventItem
        from datetime import timedelta
        self.now = timezone.now()

        self.event_today = EventItem.objects.create(
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
        self.assertEqual(res.data['time_block'], "THIS_WEEK" if (self.now + timedelta(days=2)).weekday() >= self.now.weekday() else res.data['time_block'])

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
        from .models import EventItem, Notification
        from .services import check_approaching_event_reminders

        # Create an event starting in 10 minutes with reminder_minutes=15
        urgent_event = EventItem.objects.create(
            title="Reunión Inminente",
            start_time=self.now + timedelta(minutes=10),
            end_time=self.now + timedelta(minutes=40),
            reminder_minutes=15,
            status="PROGRAMMED"
        )

        notifs = check_approaching_event_reminders()
        self.assertTrue(any("Reunión Inminente" in n.title for n in notifs))
        self.assertTrue(Notification.objects.filter(title__contains="Reunión Inminente").exists())


class WebPushNotificationTests(APITestCase):
    def setUp(self):
        from .models import PushSubscription
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
        from .models import PushSubscription
        url = reverse('push-subscribe')
        
        # Subscribe Laptop
        res1 = self.client.post(url, self.sub_data_laptop, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.count(), 1)
        
        # Subscribe Mobile (Concurrent multi-device registration)
        res2 = self.client.post(url, self.sub_data_mobile, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.count(), 2)

    def test_push_subscribe_updates_existing_endpoint(self):
        from .models import PushSubscription
        url = reverse('push-subscribe')
        
        self.client.post(url, self.sub_data_laptop, format='json')
        self.assertEqual(PushSubscription.objects.count(), 1)

        # Update with new auth key for the same endpoint
        updated_data = dict(self.sub_data_laptop)
        updated_data['keys'] = {
            "p256dh": self.sub_data_laptop['keys']['p256dh'],
            "auth": "newAuthKey999=="
        }
        res = self.client.post(url, updated_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PushSubscription.objects.count(), 1)
        sub = PushSubscription.objects.get(endpoint=self.sub_data_laptop['endpoint'])
        self.assertEqual(sub.auth, "newAuthKey999==")

    def test_push_unsubscribe(self):
        from .models import PushSubscription
        sub_url = reverse('push-subscribe')
        unsub_url = reverse('push-unsubscribe')
        
        self.client.post(sub_url, self.sub_data_laptop, format='json')
        self.assertEqual(PushSubscription.objects.count(), 1)

        res = self.client.post(unsub_url, {"endpoint": self.sub_data_laptop['endpoint']}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(PushSubscription.objects.count(), 0)

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
        from .models import PushSubscription
        from .services import send_web_push
        import requests

        sub = PushSubscription.objects.create(
            endpoint="https://fcm.googleapis.com/fcm/send/expired-device-token",
            p256dh="test-p256dh",
            auth="test-auth"
        )
        self.assertEqual(PushSubscription.objects.count(), 1)

        # Create mock 410 Gone response
        mock_response = requests.Response()
        mock_response.status_code = 410

        with patch('pywebpush.webpush', side_effect=WebPushException("Device unsubscribed", response=mock_response)):
            result = send_web_push(title="Test", message="Test alert")
            self.assertEqual(result['failed_pruned_count'], 1)
            # Subscription should be automatically deleted
            self.assertEqual(PushSubscription.objects.count(), 0)

