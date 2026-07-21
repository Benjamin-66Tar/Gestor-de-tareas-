from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import ElementoAura
from .serializers import ElementoAuraSerializer

class ElementoAuraListAPI(APIView):
    def get(self, request):
        # Capa de Rendimiento Ultra Rápido: Caché vía Redis
        cache_key = "elementos_aura_all"
        datos_en_cache = cache.get(cache_key)
        
        if datos_en_cache:
            return Response(datos_en_cache, status=status.HTTP_200_OK)
            
        elementos = ElementoAura.objects.all()
        serializer = ElementoAuraSerializer(elementos, many=True)
        
        # Guardar en caché por 60 segundos
        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ElementoAuraSerializer(data=request.data)
        # Note: Fixed is_serializer_valid() typo to is_valid()
        if serializer.is_valid():
            serializer.save()
            cache.delete("elementos_aura_all") # Invalidar caché ante cambios
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
