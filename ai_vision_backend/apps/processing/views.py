import os
import uuid
import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from apps.demos.models import DemoSession
from .models import ProcessingResult, FacialRecognition, GestureControl, ImageSegmentation
from .services.object_detection import ObjectDetectionService
from .services.image_analysis import ImageAnalysisService
from .services.gemini_service import GeminiService
from .services.facial_recognition_service import FacialRecognitionService
from .services.gesture_control_service import GestureControlService
from .services.image_segmentation_service import ImageSegmentationService

# Global cache for face embeddings (session-based)
FACE_EMBEDDING_CACHE = {}

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

    @action(detail=False, methods=['post'])
    def direct_facial_recognition(self, request):
        """
        Direct facial recognition processing - upload file and get results immediately
        """
        try:
            # Get uploaded file
            uploaded_file = request.FILES.get('file')
            name = request.POST.get('name', 'Unknown Person')
            
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            # Save file temporarily
            import tempfile
            import uuid
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_facial_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)
            
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Process the face
            service = FacialRecognitionService()
            results = service.process_face(temp_path, name)

            # Generate result image with face box
            output_filename = f"facial_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            service.draw_face_box(temp_path, output_path)

            # Clean up temp input file
            os.remove(temp_path)

            # Return results
            return Response({
                'status': 'completed',
                'recognized': results['recognized'],
                'confidence': results['confidence'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary'],
                'result_image_url': request.build_absolute_uri(settings.MEDIA_URL + f'temp/{output_filename}')
            })

        except Exception as e:
            # Clean up temp files on error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def direct_gesture_recognition(self, request):
        """
        Direct gesture recognition processing - upload file and get results immediately
        """
        try:
            # Get uploaded file
            uploaded_file = request.FILES.get('file')
            
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            # Save file temporarily
            import tempfile
            import uuid
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_gesture_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)
            
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Process the gesture
            service = GestureControlService()
            results = service.process_gesture(temp_path)

            # Generate result image with pose landmarks
            output_filename = f"gesture_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            service.draw_pose_landmarks(temp_path, results['landmarks'], output_path)

            # Clean up temp input file
            os.remove(temp_path)

            # Return results
            return Response({
                'status': 'completed',
                'landmarks': results['landmarks'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary'],
                'result_image_url': request.build_absolute_uri(settings.MEDIA_URL + f'temp/{output_filename}')
            })

        except Exception as e:
            # Clean up temp files on error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def direct_image_segmentation(self, request):
        """
        Direct image segmentation processing - upload file and get results immediately
        """
        try:
            # Get uploaded file
            uploaded_file = request.FILES.get('file')
            
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            # Save file temporarily
            import tempfile
            import uuid
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_segmentation_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)
            
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Process the segmentation
            service = ImageSegmentationService()
            results = service.process_segmentation(temp_path)

            # Get prediction mask for visualization
            prediction = service.get_prediction_mask(temp_path)

            # Generate result image with segmentation visualization
            output_filename = f"segmentation_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            vis_path = service.create_segmentation_visualization(temp_path, prediction, output_path)

            # Clean up temp input file
            os.remove(temp_path)

            # Return results
            return Response({
                'status': 'completed',
                'segments': results['segments'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary'],
                'processing_time': results['processing_time'],
                'model_used': results['model_used'],
                'confidence_score': results['confidence_score'],
                'result_image_url': request.build_absolute_uri(settings.MEDIA_URL + f'temp/{output_filename}')
            })

        except Exception as e:
            # Clean up temp files on error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def direct_object_detection(self, request):
        """
        Direct object detection processing - upload file and get results immediately
        """
        try:
            # Get uploaded file
            uploaded_file = request.FILES.get('file')
            
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            # Save file temporarily
            import tempfile
            import uuid
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_object_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)
            
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Process the object detection
            from .services.object_detection import ObjectDetectionService
            service = ObjectDetectionService()
            
            # Get confidence threshold from request
            confidence = float(request.POST.get('confidence', 0.5))
            
            # Process image and get detections with visualization
            detections, vis_path = service.process_image_with_viz(temp_path, confidence_threshold=confidence)
            
            # Handle the visualization file
            output_filename = f"object_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            
            if vis_path:
                # vis_path is relative, convert to absolute path
                absolute_vis_path = os.path.join(settings.MEDIA_ROOT, vis_path)
                if os.path.exists(absolute_vis_path):
                    import shutil
                    shutil.move(absolute_vis_path, output_path)
                else:
                    # If visualization file doesn't exist, create a simple copy of input
                    import shutil
                    shutil.copy2(temp_path, output_path)
            else:
                # If no visualization was created, copy the input image
                import shutil
                shutil.copy2(temp_path, output_path)

            # Clean up temp input file
            os.remove(temp_path)

            # Generate AI description using Gemini
            try:
                from .services.gemini_service import GeminiService
                gemini_service = GeminiService()
                ai_description = gemini_service.generate_description(detections, 'object_detection')
            except Exception as e:
                print(f"Gemini API error: {e}")
                # Fallback to simple description
                ai_description = f"Detected {len(detections)} objects in the image using YOLOv8 model."
            
            technical_summary = f"Object detection completed with {len(detections)} detections found using confidence threshold of {confidence}."
            
            # Return results
            return Response({
                'status': 'completed',
                'detections': detections,
                'ai_description': ai_description,
                'technical_summary': technical_summary,
                'processing_time': 0,  # Could be calculated if needed
                'model_used': 'YOLOv8',
                'confidence_threshold': confidence,
                'result_image_url': request.build_absolute_uri(settings.MEDIA_URL + f'temp/{output_filename}')
            })

        except Exception as e:
            # Clean up temp files on error
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'get'])
    def facial_recognition(self, request):
        # If GET with ?session_id=..., return the latest processing result for that session
        if request.method == 'GET':
            session_id = request.query_params.get('session_id')
            if not session_id:
                return Response({'error': 'session_id required (query param)'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                session = DemoSession.objects.get(session_id=session_id)
                facial_rec = FacialRecognition.objects.filter(session=session).first()
                if not facial_rec:
                    return Response({'session_id': str(session.session_id), 'status': session.status, 'results': None})
                
                input_url = request.build_absolute_uri(facial_rec.input_image.url) if facial_rec.input_image else None
                output_url = request.build_absolute_uri(facial_rec.result_image.url) if facial_rec.result_image else None
                
                return Response({
                    'session_id': str(session.session_id),
                    'status': session.status,
                    'recognized': facial_rec.recognized,
                    'confidence': facial_rec.confidence,
                    'input_image_url': input_url,
                    'output_image_url': output_url,
                    'ai_description': facial_rec.ai_description,
                    'technical_summary': facial_rec.technical_summary
                })
            except DemoSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # POST path continues below
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = DemoSession.objects.get(session_id=session_id)
            facial_rec = FacialRecognition.objects.filter(session=session).first()
            
            if not facial_rec or not facial_rec.input_image:
                return Response({'error': 'No image uploaded yet'}, status=status.HTTP_400_BAD_REQUEST)

            # Process the face
            service = FacialRecognitionService()
            input_path = os.path.join(settings.MEDIA_ROOT, facial_rec.input_image.name)

            results = service.process_face(input_path, facial_rec.name)

            # Generate result image with face box
            output_filename = f"facial_result_{session_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'facial_output', output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            service.draw_face_box(input_path, output_path)

            # Update model with results
            facial_rec.result_image = f"facial_output/{output_filename}"
            facial_rec.recognized = results['recognized']
            facial_rec.confidence = results['confidence']
            facial_rec.ai_description = results['ai_description']
            facial_rec.technical_summary = results['technical_summary']
            facial_rec.save()

            # Update session status
            session.status = 'completed'
            session.save()

            input_url = request.build_absolute_uri(facial_rec.input_image.url)
            output_url = request.build_absolute_uri(facial_rec.result_image.url)

            return Response({
                'session_id': str(session.session_id),
                'status': 'completed',
                'recognized': results['recognized'],
                'confidence': results['confidence'],
                'input_image_url': input_url,
                'output_image_url': output_url,
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary']
            })

        except DemoSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'get'])
    def gesture_recognition(self, request):
        # If GET with ?session_id=..., return the latest processing result for that session
        if request.method == 'GET':
            session_id = request.query_params.get('session_id')
            if not session_id:
                return Response({'error': 'session_id required (query param)'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                session = DemoSession.objects.get(session_id=session_id)
                gesture_rec = GestureControl.objects.filter(session=session).first()
                if not gesture_rec:
                    return Response({'session_id': str(session.session_id), 'status': session.status, 'results': None})
                
                input_url = request.build_absolute_uri(gesture_rec.input_image.url) if gesture_rec.input_image else None
                output_url = request.build_absolute_uri(gesture_rec.result_image.url) if gesture_rec.result_image else None
                
                return Response({
                    'session_id': str(session.session_id),
                    'status': session.status,
                    'input_image_url': input_url,
                    'output_image_url': output_url,
                    'landmarks': gesture_rec.landmarks,
                    'ai_description': gesture_rec.ai_description,
                    'technical_summary': gesture_rec.technical_summary
                })
            except DemoSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # POST path continues below
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = DemoSession.objects.get(session_id=session_id)
            gesture_rec = GestureControl.objects.filter(session=session).first()
            
            if not gesture_rec or not gesture_rec.input_image:
                return Response({'error': 'No image uploaded yet'}, status=status.HTTP_400_BAD_REQUEST)

            # Process the gesture
            service = GestureControlService()
            input_path = os.path.join(settings.MEDIA_ROOT, gesture_rec.input_image.name)

            results = service.process_gesture(input_path)

            # Generate result image with pose landmarks
            output_filename = f"gesture_result_{session_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'gesture_output', output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            service.draw_pose_landmarks(input_path, results['landmarks'], output_path)

            # Update model with results
            gesture_rec.result_image = f"gesture_output/{output_filename}"
            gesture_rec.landmarks = results['landmarks']
            gesture_rec.ai_description = results['ai_description']
            gesture_rec.technical_summary = results['technical_summary']
            gesture_rec.save()

            # Update session status
            session.status = 'completed'
            session.save()

            input_url = request.build_absolute_uri(gesture_rec.input_image.url)
            output_url = request.build_absolute_uri(gesture_rec.result_image.url)

            return Response({
                'session_id': str(session.session_id),
                'status': 'completed',
                'input_image_url': input_url,
                'output_image_url': output_url,
                'landmarks': results['landmarks'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary']
            })

        except DemoSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'get'])
    def image_segmentation(self, request):
        # If GET with ?session_id=..., return the latest processing result for that session
        if request.method == 'GET':
            session_id = request.query_params.get('session_id')
            if not session_id:
                return Response({'error': 'session_id required (query param)'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                session = DemoSession.objects.get(session_id=session_id)
                seg_rec = ImageSegmentation.objects.filter(session=session).first()
                if not seg_rec:
                    return Response({'session_id': str(session.session_id), 'status': session.status, 'results': None})
                
                input_url = request.build_absolute_uri(seg_rec.input_image.url) if seg_rec.input_image else None
                output_url = request.build_absolute_uri(seg_rec.result_image.url) if seg_rec.result_image else None
                
                return Response({
                    'session_id': str(session.session_id),
                    'status': session.status,
                    'input_image_url': input_url,
                    'output_image_url': output_url,
                    'segments': seg_rec.segments,
                    'ai_description': seg_rec.ai_description,
                    'technical_summary': seg_rec.technical_summary,
                    'processing_time': seg_rec.processing_time,
                    'model_used': seg_rec.model_used,
                    'confidence_score': seg_rec.confidence_score
                })
            except DemoSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # POST path continues below
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = DemoSession.objects.get(session_id=session_id)
            seg_rec = ImageSegmentation.objects.filter(session=session).first()
            
            if not seg_rec or not seg_rec.input_image:
                return Response({'error': 'No image uploaded yet'}, status=status.HTTP_400_BAD_REQUEST)

            # Process the segmentation
            service = ImageSegmentationService()
            input_path = os.path.join(settings.MEDIA_ROOT, seg_rec.input_image.name)

            results = service.process_segmentation(input_path)

            # Generate result image with segmentation visualization
            output_filename = f"segmentation_result_{session_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'segmentation_output', output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Create visualization (we need to get the prediction from the service)
            # For now, we'll create a simple visualization
            service.create_segmentation_visualization(input_path, None, output_path)

            # Update model with results
            seg_rec.result_image = f"segmentation_output/{output_filename}"
            seg_rec.segments = results['segments']
            seg_rec.ai_description = results['ai_description']
            seg_rec.technical_summary = results['technical_summary']
            seg_rec.processing_time = results['processing_time']
            seg_rec.model_used = results['model_used']
            seg_rec.confidence_score = results['confidence_score']
            seg_rec.save()

            # Update session status
            session.status = 'completed'
            session.save()

            input_url = request.build_absolute_uri(seg_rec.input_image.url)
            output_url = request.build_absolute_uri(seg_rec.result_image.url)

            return Response({
                'session_id': str(session.session_id),
                'status': 'completed',
                'input_image_url': input_url,
                'output_image_url': output_url,
                'segments': results['segments'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary'],
                'processing_time': results['processing_time'],
                'model_used': results['model_used'],
                'confidence_score': results['confidence_score']
            })

        except DemoSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def register_face(self, request):
        """
        Store face embedding in memory cache with session ID
        """
        try:
            uploaded_file = request.FILES.get('file')
            name = request.POST.get('name', 'Unknown')
            
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not name or name.strip() == '':
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Create temporary file
            import tempfile
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_face_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)

            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Extract face embedding
            service = FacialRecognitionService()
            embedding = service.extract_embedding(temp_path)
            
            # Clean up temp file
            os.remove(temp_path)
            
            if embedding is None:
                return Response({'error': 'No face detected in the uploaded image'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate session ID and store in cache
            session_id = str(uuid.uuid4())
            FACE_EMBEDDING_CACHE[session_id] = {
                'embedding': embedding,
                'name': name.strip()
            }
            
            return Response({
                'session_id': session_id,
                'name': name.strip(),
                'status': 'registered',
                'message': 'Face embedding extracted and stored successfully'
            })

        except Exception as e:
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def recognize_frame(self, request):
        """
        Compare webcam frame against stored embedding
        """
        try:
            session_id = request.POST.get('session_id')
            frame_base64 = request.POST.get('frame')
            
            if not session_id:
                return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not frame_base64:
                return Response({'error': 'frame data required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get reference embedding from cache
            if session_id not in FACE_EMBEDDING_CACHE:
                return Response({'error': 'Session not found or expired'}, status=status.HTTP_404_NOT_FOUND)
            
            cache_data = FACE_EMBEDDING_CACHE[session_id]
            reference_embedding = cache_data['embedding']
            person_name = cache_data['name']
            
            # Process frame
            service = FacialRecognitionService()
            results = service.process_webcam_frame(frame_base64, reference_embedding, person_name)
            
            if results['error']:
                return Response({'error': results['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'faces': results['faces'],
                'session_id': session_id,
                'reference_name': person_name,
                'total_faces': len(results['faces']),
                'matched_faces': len([f for f in results['faces'] if f['is_match']]),
                'unknown_faces': len([f for f in results['faces'] if not f['is_match']])
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def process_gesture_frame(self, request):
        """
        Process webcam frame with MediaPipe Hands for gesture recognition and UI control
        """
        try:
            frame_base64 = request.POST.get('frame')
            
            if not frame_base64:
                return Response({'error': 'frame data required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process frame with MediaPipe Hands
            service = GestureControlService()
            results = service.process_hand_gestures(frame_base64)
            
            if 'error' in results:
                return Response({'error': results['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'success': True,
                'mode': 'hands',
                'results': results,
                'timestamp': str(uuid.uuid4())  # Unique identifier for this frame
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_gesture_info(self, request):
        """
        Get educational information about MediaPipe Hands
        """
        try:
            service = GestureControlService()
            educational_info = service._get_educational_info()
            
            # Add general MediaPipe information focused on hands
            general_info = {
                'mediapipe_overview': {
                    'description': 'MediaPipe Hands provides real-time hand tracking and gesture recognition',
                    'capabilities': [
                        '21 landmarks per hand',
                        'Handedness detection',
                        'Real-time processing',
                        'Cross-platform support'
                    ],
                    'supported_platforms': ['Desktop', 'Mobile', 'Web', 'Edge devices']
                },
                'gesture_controls': [
                    {'gesture': 'Thumbs Up', 'emoji': '👍', 'action': 'Navigate to next feature', 'description': 'Move forward in the interface'},
                    {'gesture': 'Peace Sign', 'emoji': '✌️', 'action': 'Go back to previous feature', 'description': 'Move backward in the interface'},
                    {'gesture': 'Pointing', 'emoji': '👆', 'action': 'Select/click items', 'description': 'Interact with UI elements'},
                    {'gesture': 'Fist', 'emoji': '✊', 'action': 'Close current view', 'description': 'Exit or close current screen'},
                    {'gesture': 'OK Sign', 'emoji': '👌', 'action': 'Confirm/accept', 'description': 'Confirm actions or selections'},
                    {'gesture': 'Wave', 'emoji': '👋', 'action': 'Toggle between features', 'description': 'Switch between different modes'},
                    {'gesture': 'Open Hand', 'emoji': '👐', 'action': 'Open menu', 'description': 'Access main menu or options'}
                ],
                'technical_details': {
                    'landmarks_per_hand': 21,
                    'max_hands': 2,
                    'detection_confidence': 0.7,
                    'tracking_confidence': 0.5,
                    'processing_speed': 'Real-time (30+ FPS)'
                }
            }
            
            return Response({
                'mode': 'hands',
                'educational_info': educational_info,
                'general_info': general_info
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
