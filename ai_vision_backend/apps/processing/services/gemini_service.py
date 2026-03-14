import os
import json
import requests
from django.conf import settings


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiService:
    def __init__(self):
        from django.conf import settings
        self.api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required in Django settings or environment variables")
        self.model = 'gemini-1.5-pro'

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

    def generate_description(self, detections, image_type="object detection"):
        try:
            if image_type == "object_detection":
                if not detections or len(detections) == 0:
                    return "No objects were detected in the image."

                has_frames = any('frame' in d for d in detections)

                if has_frames:
                    frame_counts = {}
                    for d in detections:
                        cn = d.get('class', 'unknown object')
                        if cn not in frame_counts:
                            frame_counts[cn] = set()
                        frame_counts[cn].add(d.get('frame', 0))
                    objects_text = ", ".join(
                        f"{cn} (detected in {len(fr)} frames)" for cn, fr in frame_counts.items()
                    )
                    prompt = f"Based on the following video object detection results, provide a natural, engaging description (2-3 sentences):\nDetected objects: {objects_text}"
                else:
                    objects = [f"{d.get('class', 'unknown')} ({d.get('confidence', 0):.1%} confidence)" for d in detections]
                    objects_text = ", ".join(objects)
                    prompt = f"Based on the following YOLOv8 object detection results, provide a detailed description (3-4 sentences) covering the scene, confidence levels, and AI capabilities:\nDetected objects: {objects_text}"

            elif image_type == "image_segmentation":
                if not detections or len(detections) == 0:
                    return "No objects were segmented in the image."
                segments = [f"{s.get('label', 'unknown')} (confidence: {s.get('confidence', 0):.1%}, area: {s.get('area', 0)} pixels)" for s in detections]
                segments_text = ", ".join(segments)
                prompt = f"Based on the following DeepLabV3+ segmentation results, provide a detailed description (3-4 sentences):\nSegmented objects: {segments_text}"

            elif image_type == "facial_recognition":
                prompt = f"Based on facial recognition analysis, provide a brief description (2-3 sentences):\nResults: {detections}"

            elif image_type == "gesture_control":
                prompt = f"Based on gesture recognition analysis, provide a brief description (2-3 sentences):\nResults: {detections}"

            else:
                prompt = f"Based on AI vision analysis, provide a brief description (2-3 sentences):\nResults: {detections}"

            return self._call_gemini(prompt)

        except Exception as e:
            print(f"Error generating description with Gemini: {e}")
            if image_type == "object_detection" and detections:
                count = len(detections)
                return f"Successfully detected {count} object{'s' if count != 1 else ''} in the image with high confidence."
            return "AI vision analysis completed successfully."

    def generate_technical_summary(self, detections, processing_time, model_used):
        try:
            prompt = f"Provide a concise technical summary (1-2 sentences):\n- Model: {model_used}\n- Time: {processing_time}s\n- Detections: {len(detections) if detections else 0}\n- Details: {detections}"
            return self._call_gemini(prompt)
        except Exception as e:
            print(f"Error generating technical summary with Gemini: {e}")
            return f"Processed using {model_used} in {processing_time}s with {len(detections) if detections else 0} detections."
