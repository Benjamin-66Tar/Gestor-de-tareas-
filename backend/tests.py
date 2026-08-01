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

