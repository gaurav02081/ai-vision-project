import os
import uuid
import base64
import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings

from . import ml_client
from .services.gemini_service import GeminiService
from .services.chatbot_service import ChatbotService

# Global cache for face embeddings (session-based)
FACE_EMBEDDING_CACHE = {}


def _save_b64_image(b64_data, output_path):
    """Decode base64 image data and save to file."""
    if b64_data:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(b64_data))
        return True
    return False


class ProcessingViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def direct_object_detection(self, request):
        """
        Direct object detection processing - upload file and get results immediately
        """
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            # Save file temporarily
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_object_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)

            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            confidence = float(request.POST.get('confidence', 0.5))

            # Call ML service
            ml_result = ml_client.detect_objects(temp_path, confidence)
            detections = ml_result.get('detections', [])

            # Save result image from base64
            output_filename = f"object_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            result_b64 = ml_result.get('result_image_b64')

            if not _save_b64_image(result_b64, output_path):
                # Fallback: copy input image
                import shutil
                if os.path.exists(temp_path):
                    shutil.copy2(temp_path, output_path)

            # Clean up temp input
            if os.path.exists(temp_path):
                os.remove(temp_path)

            # Generate AI description using Gemini
            try:
                gemini_service = GeminiService()
                ai_description = gemini_service.generate_description(detections, 'object_detection')
            except Exception as e:
                print(f"Gemini API error: {e}")
                ai_description = f"Detected {len(detections)} objects in the image using YOLOv8 model."

            technical_summary = f"Object detection completed with {len(detections)} detections found using confidence threshold of {confidence}."

            if not os.path.exists(output_path):
                return Response({
                    'error': 'Failed to create result image',
                    'status': 'error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            media_url = settings.MEDIA_URL.rstrip('/')
            image_path = f'{media_url}/temp/{output_filename}'
            result_image_url = request.build_absolute_uri(image_path)

            return Response({
                'status': 'completed',
                'detections': detections,
                'ai_description': ai_description,
                'technical_summary': technical_summary,
                'processing_time': 0,
                'model_used': 'YOLOv8',
                'confidence_threshold': confidence,
                'result_image_url': result_image_url,
                'result_file': result_image_url
            })

        except Exception as e:
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def direct_image_segmentation(self, request):
        """
        Direct image segmentation processing - upload file and get results immediately
        """
        try:
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_segmentation_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)

            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Call ML service
            ml_result = ml_client.segment_image(temp_path)

            # Save result image from base64
            output_filename = f"segmentation_result_{file_id}.jpg"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            result_b64 = ml_result.get('result_image_b64')

            if not _save_b64_image(result_b64, output_path):
                import shutil
                if os.path.exists(temp_path):
                    shutil.copy2(temp_path, output_path)

            # Clean up temp input
            if os.path.exists(temp_path):
                os.remove(temp_path)

            if not os.path.exists(output_path):
                return Response({
                    'error': 'Failed to create result image',
                    'status': 'error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            media_url = settings.MEDIA_URL.rstrip('/')
            image_path = f'{media_url}/temp/{output_filename}'
            result_image_url = request.build_absolute_uri(image_path)

            return Response({
                'status': 'completed',
                'segments': ml_result.get('segments', []),
                'ai_description': ml_result.get('ai_description', ''),
                'technical_summary': ml_result.get('technical_summary', ''),
                'processing_time': ml_result.get('processing_time', 0),
                'model_used': ml_result.get('model_used', 'DeepLabV3+'),
                'confidence_score': ml_result.get('confidence_score', 0),
                'result_image_url': result_image_url
            })

        except Exception as e:
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

            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(uploaded_file.name)[1]
            temp_filename = f"temp_face_{file_id}{file_extension}"
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', temp_filename)

            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)

            # Call ML service for face embedding
            ml_result = ml_client.extract_face_embedding(temp_path)

            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            embedding = ml_result.get('embedding')
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

            if session_id not in FACE_EMBEDDING_CACHE:
                return Response({'error': 'Session not found or expired'}, status=status.HTTP_404_NOT_FOUND)

            cache_data = FACE_EMBEDDING_CACHE[session_id]
            reference_embedding = cache_data['embedding']
            person_name = cache_data['name']

            # Call ML service
            results = ml_client.recognize_frame(frame_base64, reference_embedding, person_name)

            if results.get('error'):
                return Response({'error': results['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            faces = results.get('faces', [])
            return Response({
                'faces': faces,
                'session_id': session_id,
                'reference_name': person_name,
                'total_faces': len(faces),
                'matched_faces': len([f for f in faces if f['is_match']]),
                'unknown_faces': len([f for f in faces if not f['is_match']])
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

            # Call ML service
            results = ml_client.process_gesture(frame_base64)

            if 'error' in results:
                return Response({'error': results['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'success': True,
                'mode': 'hands',
                'results': results,
                'timestamp': str(uuid.uuid4())
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_gesture_info(self, request):
        """
        Get educational information about MediaPipe Hands
        """
        # This is static data — no ML service needed
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
                {'gesture': 'Thumbs Up', 'emoji': '\U0001f44d', 'action': 'Navigate to next feature', 'description': 'Move forward in the interface'},
                {'gesture': 'Peace Sign', 'emoji': '\u270c\ufe0f', 'action': 'Go back to previous feature', 'description': 'Move backward in the interface'},
                {'gesture': 'Pointing', 'emoji': '\U0001f446', 'action': 'Select/click items', 'description': 'Interact with UI elements'},
                {'gesture': 'Fist', 'emoji': '\u270a', 'action': 'Close current view', 'description': 'Exit or close current screen'},
                {'gesture': 'OK Sign', 'emoji': '\U0001f44c', 'action': 'Confirm/accept', 'description': 'Confirm actions or selections'},
                {'gesture': 'Wave', 'emoji': '\U0001f44b', 'action': 'Toggle between features', 'description': 'Switch between different modes'},
                {'gesture': 'Open Hand', 'emoji': '\U0001f450', 'action': 'Open menu', 'description': 'Access main menu or options'}
            ],
            'technical_details': {
                'landmarks_per_hand': 21,
                'max_hands': 2,
                'detection_confidence': 0.7,
                'tracking_confidence': 0.5,
                'processing_speed': 'Real-time (30+ FPS)'
            }
        }

        educational_info = {
            'mode': 'hands',
            'description': 'MediaPipe Hands detects 21 landmarks per hand for precise gesture recognition',
            'landmarks_count': 42,
            'capabilities': ['Hand gesture recognition', 'Finger tracking', 'Handedness detection', 'Real-time processing'],
            'use_cases': ['UI control', 'Sign language', 'Virtual controllers', 'AR/VR interaction'],
            'gesture_controls': general_info['gesture_controls']
        }

        return Response({
            'mode': 'hands',
            'educational_info': educational_info,
            'general_info': general_info
        })

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

            chatbot_service = ChatbotService()
            response = chatbot_service.generate_response(message, context, history)

            return Response({
                'response': response['response'],
                'timestamp': response['timestamp'],
                'context': response['context']
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def student_performance_predict(self, request):
        """
        POST /api/processing/student-performance-predict/
        Predict student PASS/FAIL using Logistic Regression.
        """
        try:
            data = request.data
            study_hours = float(data.get('study_hours', 0))
            attendance = float(data.get('attendance', 0))
            gpa = float(data.get('gpa', 0))
            assignments = float(data.get('assignments', 0))
            sleep_hours = float(data.get('sleep_hours', 0))

            from .services.student_predictor import get_predictor
            predictor = get_predictor()
            result = predictor.predict(study_hours, attendance, gpa, assignments, sleep_hours)

            return Response(result)

        except (ValueError, TypeError) as e:
            return Response({'error': f'Invalid input: {e}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
