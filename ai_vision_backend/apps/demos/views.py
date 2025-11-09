from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os
from .models import DemoSession, DemoFile
from .serializers import DemoSessionSerializer, DemoFileSerializer
from apps.processing.models import FacialRecognition, GestureControl, ImageSegmentation

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
        
        # Handle different demo types
        if session.demo_type == 'facial_recognition':
            # Handle facial recognition upload
            name = request.POST.get('name', '')
            
            # Save file to specific directory
            file_path = f"facial_input/face_{session.session_id}_{file_obj.name}"
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            # Create facial recognition record
            facial_rec, created = FacialRecognition.objects.get_or_create(
                session=session,
                defaults={'name': name, 'input_image': file_path}
            )
            
            if not created:
                facial_rec.input_image = file_path
                facial_rec.name = name
                facial_rec.save()
            
            session.status = 'uploading'
            session.save()
            
            return Response({
                'message': 'File uploaded successfully',
                'file_url': request.build_absolute_uri(settings.MEDIA_URL + file_path),
                'name': name
            })
            
        elif session.demo_type == 'gesture_control':
            # Handle gesture control upload
            file_path = f"gesture_input/gesture_{session.session_id}_{file_obj.name}"
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            # Create gesture control record
            gesture_rec, created = GestureControl.objects.get_or_create(
                session=session,
                defaults={'input_image': file_path}
            )
            
            if not created:
                gesture_rec.input_image = file_path
                gesture_rec.save()
            
            session.status = 'uploading'
            session.save()
            
            return Response({
                'message': 'File uploaded successfully',
                'file_url': request.build_absolute_uri(settings.MEDIA_URL + file_path)
            })
            
        elif session.demo_type == 'image_segmentation':
            # Handle image segmentation upload
            file_path = f"segmentation_input/segmentation_{session.session_id}_{file_obj.name}"
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            # Create image segmentation record
            seg_rec, created = ImageSegmentation.objects.get_or_create(
                session=session,
                defaults={'input_image': file_path}
            )
            
            if not created:
                seg_rec.input_image = file_path
                seg_rec.save()
            
            session.status = 'uploading'
            session.save()
            
            return Response({
                'message': 'File uploaded successfully',
                'file_url': request.build_absolute_uri(settings.MEDIA_URL + file_path)
            })
        
        else:
            # Handle other demo types (object detection, etc.)
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
