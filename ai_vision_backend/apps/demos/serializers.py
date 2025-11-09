from rest_framework import serializers
from .models import DemoSession, DemoFile

class DemoSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoSession
        fields = '__all__'
        read_only_fields = ['session_id', 'created_at', 'completed_at']

class DemoFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoFile
        fields = '__all__'
        read_only_fields = ['uploaded_at']
