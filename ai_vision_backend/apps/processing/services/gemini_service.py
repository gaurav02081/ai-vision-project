import google.generativeai as genai  # pyright: ignore[reportMissingImports]
import os
from django.conf import settings  # pyright: ignore[reportMissingImports]

class GeminiService:
    def __init__(self):
        # Initialize Gemini API
        from django.conf import settings
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required in Django settings or environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
    
    def generate_description(self, detections, image_type="object detection"):
        """
        Generate a natural language description of the AI vision results
        """
        try:
            if image_type == "object_detection":
                if not detections or len(detections) == 0:
                    return "No objects were detected in the image."
                
                # Check if this is video data (has frame information)
                has_frames = any('frame' in detection for detection in detections)
                
                if has_frames:
                    # Video processing
                    frame_counts = {}
                    for detection in detections:
                        frame = detection.get('frame', 0)
                        class_name = detection.get('class', 'unknown object')
                        if class_name not in frame_counts:
                            frame_counts[class_name] = set()
                        frame_counts[class_name].add(frame)
                    
                    # Format video description
                    objects_text = []
                    for class_name, frames in frame_counts.items():
                        frame_count = len(frames)
                        objects_text.append(f"{class_name} (detected in {frame_count} frames)")
                    
                    objects_text = ", ".join(objects_text)
                    
                    prompt = f"""
                    Based on the following video object detection results, provide a natural, engaging description of what was found in the video:
                    
                    Detected objects: {objects_text}
                    
                    Please provide a brief, informative description (2-3 sentences) that explains what objects were detected throughout the video and their frequency. Make it sound natural and educational.
                    """
                else:
                    # Image processing
                    objects = []
                    for detection in detections:
                        confidence = detection.get('confidence', 0)
                        class_name = detection.get('class', 'unknown object')
                        objects.append(f"{class_name} ({confidence:.1%} confidence)")
                    
                    objects_text = ", ".join(objects)
                    
                    prompt = f"""
                    Based on the following object detection results from a YOLOv8 computer vision model, provide a natural, engaging description of what was found in the image:
                    
                    Detected objects: {objects_text}
                    
                    Please provide a detailed, informative description (3-4 sentences) that:
                    1. Describes the scene and what objects were detected
                    2. Mentions the confidence levels and detection quality
                    3. Provides context about the computer vision technology used
                    4. Makes it sound natural, educational, and professional
                    
                    Focus on accuracy, confidence levels, and the technical capabilities of the AI system.
                    """
                
            elif image_type == "facial_recognition":
                prompt = f"""
                Based on facial recognition analysis, provide a natural description of the faces detected in the image.
                Results: {detections}
                
                Please provide a brief, informative description (2-3 sentences) about the facial recognition results.
                """
                
            elif image_type == "gesture_control":
                prompt = f"""
                Based on gesture recognition analysis, provide a natural description of the gestures detected in the image.
                Results: {detections}
                
                Please provide a brief, informative description (2-3 sentences) about the gesture recognition results.
                """
                
            elif image_type == "image_segmentation":
                if not detections or len(detections) == 0:
                    return "No objects were segmented in the image."
                
                # Format segmentation results
                segments = []
                for segment in detections:
                    label = segment.get('label', 'unknown object')
                    confidence = segment.get('confidence', 0)
                    area = segment.get('area', 0)
                    segments.append(f"{label} (confidence: {confidence:.1%}, area: {area} pixels)")
                
                segments_text = ", ".join(segments)
                
                prompt = f"""
                Based on the following semantic segmentation results from a DeepLabV3+ computer vision model, provide a natural, engaging description of what was found in the image:
                
                Segmented objects: {segments_text}
                
                Please provide a detailed, informative description (3-4 sentences) that:
                1. Describes the scene and what objects were segmented
                2. Mentions the confidence levels and segmentation quality
                3. Explains how semantic segmentation works at the pixel level
                4. Makes it sound natural, educational, and professional
                
                Focus on the technical capabilities of semantic segmentation and how it identifies objects at the pixel level.
                """
            
            else:
                prompt = f"""
                Based on the AI vision analysis results, provide a natural description of what was found in the image.
                Results: {detections}
                
                Please provide a brief, informative description (2-3 sentences) about the analysis results.
                """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating description with Gemini: {e}")
            # Fallback description
            if image_type == "object_detection" and detections:
                count = len(detections)
                return f"Successfully detected {count} object{'s' if count != 1 else ''} in the image with high confidence."
            else:
                return "AI vision analysis completed successfully."
    
    def generate_technical_summary(self, detections, processing_time, model_used):
        """
        Generate a technical summary of the processing results
        """
        try:
            prompt = f"""
            Provide a technical summary of the AI vision processing results:
            
            - Model used: {model_used}
            - Processing time: {processing_time} seconds
            - Number of detections: {len(detections) if detections else 0}
            - Detection details: {detections}
            
            Please provide a concise technical summary (1-2 sentences) suitable for developers or technical users.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating technical summary with Gemini: {e}")
            return f"Processed using {model_used} in {processing_time}s with {len(detections) if detections else 0} detections."
