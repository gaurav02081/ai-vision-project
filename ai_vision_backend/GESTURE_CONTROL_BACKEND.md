# Gesture Control Backend Implementation Guide

This guide explains how to implement the backend for the Gesture Control feature to make it fully functional.

## Overview

The Gesture Control feature allows users to upload images or videos, and the system detects human pose landmarks using MediaPipe Pose Detection, then provides an AI description using Gemini API.

## Prerequisites

1. Install MediaPipe and required dependencies:
```bash
pip install mediapipe
pip install opencv-python
```

2. Update requirements.txt:
```
mediapipe
opencv-python
```

## Backend Implementation Steps

### 1. Update Django Models

Add a model to store gesture control data in `apps/processing/models.py`:

```python
from django.db import models
import json

class GestureControl(models.Model):
    session = models.ForeignKey('demos.DemoSession', on_delete=models.CASCADE)
    input_image = models.FileField(upload_to='gesture_input/')
    result_image = models.ImageField(upload_to='gesture_output/', null=True, blank=True)
    landmarks = models.JSONField(default=list)  # Store pose landmarks as JSON
    ai_description = models.TextField(blank=True)
    technical_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. Create Gesture Control Service

Create `apps/processing/services/gesture_control_service.py`:

```python
import mediapipe as mp
import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path
import google.generativeai as genai

class GestureControlService:
    def __init__(self):
        # Initialize MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )

        # Configure Gemini API
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

    def process_gesture(self, image_path):
        """
        Process image/video and return pose detection results
        """
        try:
            # Load and process image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'landmarks': [],
                    'ai_description': 'Failed to load image.',
                    'technical_summary': 'Image loading failed.'
                }

            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process with MediaPipe Pose
            results = self.pose.process(image_rgb)

            if not results.pose_landmarks:
                return {
                    'landmarks': [],
                    'ai_description': 'No pose detected in the image.',
                    'technical_summary': 'Pose detection failed - no landmarks found.'
                }

            # Extract landmarks
            landmarks = self._extract_landmarks(results.pose_landmarks)

            # Generate AI description using Gemini
            ai_description = self._generate_ai_description(image, landmarks)

            return {
                'landmarks': landmarks,
                'ai_description': ai_description,
                'technical_summary': f'Detected {len(landmarks)} pose landmarks successfully.'
            }

        except Exception as e:
            return {
                'landmarks': [],
                'ai_description': f'Error processing image: {str(e)}',
                'technical_summary': f'Processing failed: {str(e)}'
            }

    def _extract_landmarks(self, pose_landmarks):
        """
        Extract pose landmarks into a structured format
        """
        landmarks = []
        landmark_names = [
            'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
            'right_eye_inner', 'right_eye', 'right_eye_outer',
            'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
            'left_index', 'right_index', 'left_thumb', 'right_thumb',
            'left_hip', 'right_hip', 'left_knee', 'right_knee',
            'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
            'left_foot_index', 'right_foot_index'
        ]

        for i, landmark in enumerate(pose_landmarks.landmark):
            landmarks.append({
                'name': landmark_names[i] if i < len(landmark_names) else f'point_{i}',
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            })

        return landmarks

    def _generate_ai_description(self, image, landmarks):
        """
        Generate AI description using Gemini API
        """
        try:
            # Convert image to base64 for Gemini
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            model = genai.GenerativeModel('gemini-pro-vision')

            # Count visible landmarks
            visible_landmarks = sum(1 for lm in landmarks if lm['visibility'] > 0.5)

            prompt = f"""
            Analyze this pose detection result. The image shows a person with {len(landmarks)} detected pose landmarks ({visible_landmarks} highly visible).

            Provide a detailed description including:
            - Body posture and stance
            - Arm and hand positions
            - Leg positions
            - Overall pose analysis
            - Any recognizable gestures or activities
            - Confidence in the pose detection

            Focus on the human pose and movement analysis.
            """

            response = model.generate_content([prompt, pil_image])
            return response.text

        except Exception as e:
            return f"AI analysis failed: {str(e)}"

    def draw_pose_landmarks(self, image_path, landmarks, output_path):
        """
        Draw pose landmarks on the image
        """
        image = cv2.imread(image_path)

        # Draw landmarks
        for landmark in landmarks:
            if landmark['visibility'] > 0.5:  # Only draw visible landmarks
                x = int(landmark['x'] * image.shape[1])
                y = int(landmark['y'] * image.shape[0])

                # Draw point
                cv2.circle(image, (x, y), 4, (0, 255, 0), -1)

                # Draw connections (simplified)
                self._draw_pose_connections(image, landmarks)

        cv2.imwrite(output_path, image)
        return output_path

    def _draw_pose_connections(self, image, landmarks):
        """
        Draw connections between pose landmarks
        """
        # Define connections (simplified pose skeleton)
        connections = [
            # Face
            (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
            (9, 10),
            # Body
            (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21),
            (12, 14), (14, 16), (16, 18), (16, 20), (16, 22),
            (11, 23), (12, 24), (23, 24), (23, 25), (25, 27), (27, 29), (27, 31),
            (24, 26), (26, 28), (28, 30), (28, 32)
        ]

        for connection in connections:
            start_idx, end_idx = connection
            if start_idx < len(landmarks) and end_idx < len(landmarks):
                start_lm = landmarks[start_idx]
                end_lm = landmarks[end_idx]

                if start_lm['visibility'] > 0.5 and end_lm['visibility'] > 0.5:
                    start_x = int(start_lm['x'] * image.shape[1])
                    start_y = int(start_lm['y'] * image.shape[0])
                    end_x = int(end_lm['x'] * image.shape[1])
                    end_y = int(end_lm['y'] * image.shape[0])

                    cv2.line(image, (start_x, start_y), (end_x, end_y), (255, 0, 0), 2)
```

### 3. Update Views

Add gesture control view in `apps/processing/views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import GestureControl
from .services.gesture_control_service import GestureControlService
import os

class GestureControlView(APIView):
    def post(self, request, session_id):
        try:
            session = DemoSession.objects.get(id=session_id)

            # Get or create gesture control record
            gesture_rec, created = GestureControl.objects.get_or_create(session=session)

            if not gesture_rec.input_image:
                return Response({
                    'error': 'No image uploaded yet'
                }, status=status.HTTP_400_BAD_REQUEST)

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

            return Response({
                'status': 'completed',
                'input_image_url': request.build_absolute_uri(gesture_rec.input_image.url),
                'output_image_url': request.build_absolute_uri(gesture_rec.result_image.url),
                'landmarks': results['landmarks'],
                'ai_description': results['ai_description'],
                'technical_summary': results['technical_summary']
            })

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 4. Update URLs

Add URL pattern in `apps/processing/urls.py`:

```python
from django.urls import path
from .views import GestureControlView

urlpatterns = [
    # ... existing URLs ...
    path('gesture-recognition/<int:session_id>/', GestureControlView.as_view(), name='gesture_control'),
]
```

### 5. Update File Upload

Modify the file upload view to handle gesture control sessions:

In `apps/demos/views.py`, update the upload view:

```python
def post(self, request, session_id):
    session = self.get_object(session_id)

    if session.demo_type == 'gesture_control':
        # Handle gesture control upload
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file
        file_path = f"gesture_input/gesture_{session_id}_{uploaded_file.name}"
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)

        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Create gesture control record
        from apps.processing.models import GestureControl
        GestureControl.objects.create(
            session=session,
            input_image=file_path
        )

        return Response({
            'message': 'File uploaded successfully',
            'file_url': request.build_absolute_uri(settings.MEDIA_URL + file_path)
        })

    # Handle other demo types...
```

### 6. Environment Variables

Add to `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 7. Database Migration

Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. Testing

Create a test script `test_gesture_control.py`:

```python
import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_vision_backend.settings')
django.setup()

from apps.processing.services.gesture_control_service import GestureControlService

def test_gesture_control():
    service = GestureControlService()

    # Test with a sample image containing a person
    test_image = "path/to/test/person/image.jpg"
    results = service.process_gesture(test_image)

    print("Gesture Detection Results:")
    print(f"Landmarks detected: {len(results['landmarks'])}")
    print(f"AI Description: {results['ai_description'][:200]}...")
    print(f"Technical Summary: {results['technical_summary']}")

    # Test landmark drawing
    output_path = "test_output.jpg"
    service.draw_pose_landmarks(test_image, results['landmarks'], output_path)
    print(f"Result image saved to: {output_path}")

if __name__ == "__main__":
    test_gesture_control()
```

## Production Considerations

1. **Video Processing**: Extend to handle video files with frame-by-frame processing
2. **Performance**: MediaPipe works well on CPU, but consider GPU acceleration for high throughput
3. **Real-time Processing**: For live gesture control, implement WebRTC streaming
4. **Gesture Recognition**: Add logic to recognize specific gestures based on landmark positions
5. **Privacy**: Ensure proper handling of sensitive pose data
6. **Scalability**: Consider using cloud-based pose detection services for high traffic

## Troubleshooting

- **MediaPipe Import Error**: Ensure all dependencies are installed correctly
- **Pose Detection Failures**: Check image quality and lighting conditions
- **Gemini API Errors**: Verify API key and quota limits
- **File Upload Issues**: Confirm MEDIA_ROOT and MEDIA_URL settings
- **Landmark Drawing**: Ensure output directory has write permissions

## Gesture Recognition Extensions

To add specific gesture recognition, extend the service with gesture classification:

```python
def classify_gesture(self, landmarks):
    """
    Classify specific gestures based on landmark positions
    """
    # Example: Detect raised hand
    left_wrist = next((lm for lm in landmarks if lm['name'] == 'left_wrist'), None)
    right_wrist = next((lm for lm in landmarks if lm['name'] == 'right_wrist'), None)
    nose = next((lm for lm in landmarks if lm['name'] == 'nose'), None)

    if left_wrist and nose and left_wrist['y'] < nose['y']:
        return "Left hand raised"
    elif right_wrist and nose and right_wrist['y'] < nose['y']:
        return "Right hand raised"

    return "Neutral pose"
```

This implementation provides a complete pose detection system with AI-powered analysis and visual landmark display.
