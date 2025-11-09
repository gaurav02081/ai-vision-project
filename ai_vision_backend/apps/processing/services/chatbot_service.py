import google.generativeai as genai
import os
from django.conf import settings
from datetime import datetime
import json

class ChatbotService:
    def __init__(self):
        # Initialize Gemini API using existing configuration
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required in Django settings or environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Define system context about the AI Vision project
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

FEATURE DETAILS:
- Object Detection: Detects and classifies objects with confidence scores, supports both images and videos
- Facial Recognition: Can register faces and recognize them in real-time, supports webcam input
- Gesture Control: Recognizes hand gestures like thumbs up, peace sign, pointing, fist, OK sign, wave, and open hand
- Image Segmentation: Segments images at pixel level to identify different objects and regions

You should provide helpful, accurate information about these features and help users understand how to use them effectively.
"""
    
    def get_context_info(self, context):
        """Get context-specific information based on current page/feature"""
        context_info = {
            'home': """
Current Context: You're on the main homepage of the AI Vision Lab.
Available Features: Object Detection, Facial Recognition, Gesture Control, Image Segmentation
Users can explore different AI vision capabilities and see live demos.
""",
            'object-detection': """
Current Context: You're on the Object Detection feature page.
This feature uses YOLOv8 model to detect and classify objects in real-time.
Users can upload images or videos and get detailed object detection results with confidence scores.
The system can detect 80+ different object classes including people, vehicles, animals, and everyday objects.
""",
            'facial-recognition': """
Current Context: You're on the Facial Recognition feature page.
This feature uses InsightFace for face detection and recognition.
Users can register faces by uploading photos and then recognize those faces in real-time using webcam.
The system provides confidence scores and can handle multiple faces in a single image.
""",
            'gesture-control': """
Current Context: You're on the Gesture Control feature page.
This feature uses MediaPipe Hands for real-time hand tracking and gesture recognition.
Supported gestures: Thumbs Up (next), Peace Sign (previous), Pointing (select), Fist (close), OK Sign (confirm), Wave (toggle), Open Hand (menu).
Users can control the interface using hand gestures detected through webcam.
""",
            'image-segmentation': """
Current Context: You're on the Image Segmentation feature page.
This feature uses DeepLabV3+ for pixel-level semantic segmentation.
Users can upload images and get detailed segmentation results showing different objects and regions.
The system can segment 20+ different object classes at the pixel level.
""",
            'docs': """
Current Context: You're on the Documentation page.
This page contains technical documentation, API references, and usage guides for the AI Vision Lab features.
Users can find detailed information about how to use each feature and integrate with the API.
""",
            'contact': """
Current Context: You're on the Contact page.
This page provides contact information and ways to get in touch with the AI Vision Lab team.
Users can find support information and contact details here.
"""
        }
        
        return context_info.get(context, """
Current Context: You're browsing the AI Vision Lab website.
This is a comprehensive computer vision platform with multiple AI-powered features for object detection, facial recognition, gesture control, and image segmentation.
""")
    
    def format_conversation_history(self, history):
        """Format conversation history for the prompt"""
        if not history or len(history) == 0:
            return "No previous conversation history."
        
        formatted_history = "Previous conversation:\n"
        for msg in history[-10:]:  # Keep last 10 messages
            role = "User" if msg.get('role') == 'user' else "Assistant"
            content = msg.get('content', '')
            formatted_history += f"{role}: {content}\n"
        
        return formatted_history
    
    def generate_response(self, message, context='home', history=None):
        """
        Generate chatbot response with context awareness
        
        Args:
            message (str): User's message
            context (str): Current page/feature context
            history (list): Previous conversation messages
        
        Returns:
            dict: Response with message and timestamp
        """
        try:
            # Get context-specific information
            context_info = self.get_context_info(context)
            
            # Format conversation history
            history_text = self.format_conversation_history(history)
            
            # Create the full prompt
            prompt = f"""
{self.system_prompt}

{context_info}

{history_text}

Current User Message: {message}

Please provide a helpful, accurate response. Be conversational and informative. If the user is asking about a specific feature, provide detailed information about that feature. If they're asking general questions, feel free to answer them while staying relevant to the AI Vision Lab context when appropriate.

Keep your response concise but informative (2-4 sentences typically).
"""
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            return {
                'response': response.text.strip(),
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
    
    def get_feature_help(self, feature):
        """Get specific help information for a feature"""
        help_info = {
            'object-detection': {
                'description': 'Detect and classify objects in images and videos using YOLOv8',
                'usage': 'Upload an image or video file to get real-time object detection results',
                'supported_formats': 'Images: JPG, PNG, GIF. Videos: MP4, AVI, MOV',
                'output': 'Bounding boxes around detected objects with class names and confidence scores'
            },
            'facial-recognition': {
                'description': 'Detect and recognize faces using InsightFace technology',
                'usage': 'First register a face by uploading a photo, then use webcam for real-time recognition',
                'features': 'Face detection, recognition, embedding extraction, and confidence scoring',
                'output': 'Face bounding boxes with recognition results and confidence scores'
            },
            'gesture-control': {
                'description': 'Control interface using hand gestures detected via webcam',
                'usage': 'Enable webcam and use hand gestures to navigate and interact with the interface',
                'gestures': 'Thumbs Up (next), Peace Sign (previous), Pointing (select), Fist (close), OK Sign (confirm), Wave (toggle), Open Hand (menu)',
                'output': 'Real-time gesture recognition with UI control actions'
            },
            'image-segmentation': {
                'description': 'Segment images at pixel level using DeepLabV3+ model',
                'usage': 'Upload an image to get detailed pixel-level segmentation results',
                'supported_formats': 'Images: JPG, PNG',
                'output': 'Segmented image with different colors for different object classes'
            }
        }
        
        return help_info.get(feature, {
            'description': 'Feature information not available',
            'usage': 'Please check the documentation for usage instructions',
            'output': 'Results vary by feature'
        })
