import os
import json
import requests
from django.conf import settings
from datetime import datetime


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class ChatbotService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required in Django settings or environment variables")
        self.model = 'gemini-2.0-flash'

        self.system_prompt = """
You are an AI assistant for the AI Vision Lab project, a comprehensive computer vision platform. You help users understand and use the various AI vision features.

PROJECT OVERVIEW:
The AI Vision Lab is a web application that provides real-time computer vision capabilities including:
- Object Detection (YOLOv8)
- Facial Recognition (InsightFace)
- Gesture Control (MediaPipe Hands)
- Image Segmentation (DeepLabV3+)

TECHNICAL CAPABILITIES:
1. Object Detection: Uses YOLOv8 model for real-time object detection in images and videos
2. Facial Recognition: Uses InsightFace for face detection, recognition, and embedding extraction
3. Gesture Control: Uses MediaPipe Hands for real-time hand tracking and gesture recognition
4. Image Segmentation: Uses DeepLabV3+ for pixel-level semantic segmentation

You should provide helpful, accurate information about these features and help users understand how to use them effectively.
"""

    def _call_gemini(self, prompt):
        """Call Gemini API directly via REST."""
        url = GEMINI_API_URL.format(model=self.model) + f"?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    def get_context_info(self, context):
        context_info = {
            'home': "Current Context: Main homepage. Available Features: Object Detection, Facial Recognition, Gesture Control, Image Segmentation.",
            'object-detection': "Current Context: Object Detection page. Uses YOLOv8 to detect 80+ object classes with confidence scores.",
            'facial-recognition': "Current Context: Facial Recognition page. Uses InsightFace for face detection and recognition via webcam.",
            'gesture-control': "Current Context: Gesture Control page. Uses MediaPipe Hands. Gestures: Thumbs Up (next), Peace Sign (previous), Pointing (select), Fist (close), OK Sign (confirm), Wave (toggle), Open Hand (menu).",
            'image-segmentation': "Current Context: Image Segmentation page. Uses DeepLabV3+ for pixel-level semantic segmentation.",
            'docs': "Current Context: Documentation page with technical docs and API references.",
            'contact': "Current Context: Contact page with support information.",
        }
        return context_info.get(context, "Current Context: AI Vision Lab website.")

    def format_conversation_history(self, history):
        if not history or len(history) == 0:
            return "No previous conversation history."
        formatted = "Previous conversation:\n"
        for msg in history[-10:]:
            role = "User" if msg.get('role') == 'user' else "Assistant"
            formatted += f"{role}: {msg.get('content', '')}\n"
        return formatted

    def generate_response(self, message, context='home', history=None):
        try:
            context_info = self.get_context_info(context)
            history_text = self.format_conversation_history(history)

            prompt = f"""{self.system_prompt}

{context_info}

{history_text}

Current User Message: {message}

Please provide a helpful, accurate response. Keep it concise (2-4 sentences).
"""
            response_text = self._call_gemini(prompt)

            return {
                'response': response_text,
                'timestamp': datetime.now().isoformat(),
                'context': context
            }

        except Exception as e:
            print(f"Error generating chatbot response: {e}")
            return {
                'response': "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
                'timestamp': datetime.now().isoformat(),
                'context': context,
                'error': str(e)
            }
