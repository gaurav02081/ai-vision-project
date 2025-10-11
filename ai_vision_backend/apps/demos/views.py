from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import DemoSession, DemoFile
from .serializers import DemoSessionSerializer, DemoFileSerializer

class DemoSessionViewSet(viewsets.ModelViewSet):
    queryset = DemoSession.objects.all()
    serializer_class = DemoSessionSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def upload_file(self, request, pk=None):
        session = self.get_object()
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        demo_file = DemoFile.objects.create(
            session=session,
            file=file_obj,
            file_type='image' if file_obj.content_type.startswith('image') else 'video',
            original_filename=file_obj.name,
            file_size=file_obj.size,
            mime_type=file_obj.content_type
        )
        
        session.status = 'uploading'
        session.save()
        
        return Response(DemoFileSerializer(demo_file).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        session = self.get_object()
        return Response({
            'session_id': session.session_id,
            'status': session.status,
            'demo_type': session.demo_type,
            'created_at': session.created_at,
            'completed_at': session.completed_at
        })

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        session = self.get_object()
        results = []
        # For now no processing results stored
        return Response({
            'session_id': session.session_id,
            'results': results
        })
