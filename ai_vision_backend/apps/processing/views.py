import os
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.demos.models import DemoSession
from .models import ProcessingResult
from .services.object_detection import ObjectDetectionService
from .services.image_analysis import ImageAnalysisService
from .services.gemini_service import GeminiService

class ProcessingViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post', 'get'])
    def object_detection(self, request):
        # If GET with ?session_id=..., return the latest processing result for that session
        if request.method == 'GET':
            session_id = request.query_params.get('session_id')
            if not session_id:
                return Response({'error': 'session_id required (query param)'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                session = DemoSession.objects.get(session_id=session_id)
                last = ProcessingResult.objects.filter(session=session).order_by('-created_at').first()
                if not last:
                    return Response({'session_id': str(session.session_id), 'status': session.status, 'results': None})
                input_url = request.build_absolute_uri(session.demofile_set.first().file.url) if session.demofile_set.exists() else None
                output_url = request.build_absolute_uri(last.result_file.url) if last.result_file else None
                return Response({
                    'session_id': str(session.session_id),
                    'status': session.status,
                    'input_image_url': input_url,
                    'output_image_url': output_url,
                    'result_data': last.result_data,
                    'processing_time': last.processing_time
                })
            except DemoSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # POST path continues below
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            session = DemoSession.objects.get(session_id=session_id)
            demo_file = session.demofile_set.first()
            if not demo_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            svc = ObjectDetectionService()
            # allow request to pass an optional confidence threshold (float)
            try:
                confidence = float(request.data.get('confidence', 0.5))
            except Exception:
                confidence = 0.5

            # Check if file is video or image based on file extension
            file_path = demo_file.file.path
            file_extension = os.path.splitext(file_path)[1].lower()
            is_video = file_extension in ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv']
            
            detections = []
            vis_path = None
            
            if is_video:
                # Process video
                frame_detections, vis_path = svc.process_video_with_viz(file_path, confidence_threshold=confidence)
                # Flatten detections for response
                detections = []
                for frame_data in frame_detections:
                    for detection in frame_data['detections']:
                        detection['frame'] = frame_data['frame']
                        detections.append(detection)
            else:
                # Process image
                detections, vis_path = svc.process_image_with_viz(file_path, confidence_threshold=confidence)

            # Generate AI description using Gemini
            try:
                gemini_service = GeminiService()
                ai_description = gemini_service.generate_description(detections, 'object_detection')
                technical_summary = gemini_service.generate_technical_summary(detections, 0.5, 'yolov8')
            except Exception as e:
                print(f"Gemini service error: {e}")
                ai_description = f"Successfully detected {len(detections)} object{'s' if len(detections) != 1 else ''} in the image."
                technical_summary = f"Processed using YOLOv8 in 0.5s with {len(detections)} detections."

            result = ProcessingResult.objects.create(
                session=session,
                result_type='object_detection',
                result_file=vis_path if vis_path else None,
                result_data={
                    'detections': detections,
                    'ai_description': ai_description,
                    'technical_summary': technical_summary
                },
                processing_time=0.5,
                model_used='yolov8',
                confidence_threshold=confidence
            )

            session.status = 'completed'
            session.save()

            input_url = request.build_absolute_uri(demo_file.file.url)
            output_url = None
            if result.result_file:
                # result.result_file stores relative path like 'results/detection/xxx'
                output_url = request.build_absolute_uri(result.result_file.url)

            return Response({
                'session_id': str(session.session_id),
                'detections': detections,
                'processing_time': result.processing_time,
                'input_image_url': input_url,
                'output_image_url': output_url,
                'ai_description': ai_description,
                'technical_summary': technical_summary
            })
        except DemoSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def analyze_image(self, request):
        """
        Analyze image from data URI: perform object detection and generate AI caption
        Expects: {'imageDataUri': 'data:image/jpeg;base64,...'}
        Returns: {'imageDataUrl': '...', 'objects': [...], 'caption': '...'}
        """
        image_data_uri = request.data.get('imageDataUri')
        if not image_data_uri:
            return Response({'error': 'imageDataUri required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            confidence = float(request.data.get('confidence', 0.5))
        except Exception:
            confidence = 0.5

        svc = ImageAnalysisService()
        result = svc.analyze_image_data_uri(image_data_uri, confidence_threshold=confidence)

        if 'error' in result:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)
