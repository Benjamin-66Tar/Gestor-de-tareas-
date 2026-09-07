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


