import os
import uuid
import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .services.object_detection import ObjectDetectionService
from .services.gemini_service import GeminiService
from .services.facial_recognition_service import FacialRecognitionService
from .services.gesture_control_service import GestureControlService
from .services.image_segmentation_service import ImageSegmentationService
from .services.chatbot_service import ChatbotService

# Global cache for face embeddings (session-based)
FACE_EMBEDDING_CACHE = {}

class ProcessingViewSet(viewsets.ViewSet):
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

    @action(detail=False, methods=['post'])
    def chatbot(self, request):
        """
        Chatbot endpoint for AI-powered assistance
        """
        try:
            message = request.data.get('message')
            context = request.data.get('context', 'home')
            history = request.data.get('history', [])
            
            if not message or not message.strip():
                return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize chatbot service
            chatbot_service = ChatbotService()
            
            # Generate response
            response = chatbot_service.generate_response(message, context, history)
            
            return Response({
                'response': response['response'],
                'timestamp': response['timestamp'],
                'context': response['context']
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
