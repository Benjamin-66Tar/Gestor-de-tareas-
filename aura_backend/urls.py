from django.contrib import admin
from django.urls import path
from .views import ElementoAuraListAPI

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/elementos/', ElementoAuraListAPI.as_view(), name='elemento-aura-list'),
]
