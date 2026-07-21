from rest_framework import serializers
from .models import ElementoAura

class ElementoAuraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElementoAura
        fields = '__all__'
