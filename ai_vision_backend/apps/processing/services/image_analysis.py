import os
import base64
import io
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from .object_detection import ObjectDetectionService

# Load environment variables
load_dotenv()

class ImageAnalysisService:
    def __init__(self):
        # Initialize YOLO service
        self.object_detection_service = ObjectDetectionService()

        # Initialize Gemini
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel(
                'gemini-2.5-flash',
                system_instruction="You are an AI expert in image understanding and caption generation."
            )
        else:
            print("Warning: GEMINI_API_KEY not found. Caption generation will be disabled.")
            self.gemini_model = None

    def analyze_image_data_uri(self, image_data_uri, confidence_threshold=0.5):
        """
        Analyze image from data URI: decode, detect objects, generate caption
        Returns: {
            'imageDataUrl': original_data_uri,
            'objects': detected_objects_list,
            'caption': generated_caption
        }
        """
        try:
            # 1. Decode the Data URI
            header, encoded = image_data_uri.split(",", 1)
            image_data = base64.b64decode(encoded)
            image = Image.open(io.BytesIO(image_data)).convert("RGB")

            # 2. Save temporarily for YOLO processing
            temp_path = self._save_temp_image(image)
            if not temp_path:
                return {'error': 'Failed to process image'}

            try:
                # 3. Perform Object Detection with YOLO
                detections, vis_path = self.object_detection_service.process_image_with_viz(
                    temp_path, confidence_threshold=confidence_threshold
                )

                # 4. Convert detections to the expected format
                detected_objects = []
                for d in detections:
                    try:
                        bbox = d.get('bbox', [])
                        if bbox and len(bbox) >= 4:
                            x1, y1, x2, y2 = bbox[:4]
                            detected_objects.append({
                                "class": self.object_detection_service.model.names[d.get('class_id', 0)] if self.object_detection_service.model else f"class_{d.get('class_id', 0)}",
                                "confidence": float(d.get('confidence', 0)),
                                "box": {
                                    "x1": x1 / image.width,
                                    "y1": y1 / image.height,
                                    "x2": x2 / image.width,
                                    "y2": y2 / image.height,
                                },
                            })
                    except Exception as e:
                        print(f"Error processing detection: {e}")
                        continue

                # 5. Generate AI Caption with Gemini
                caption = ""
                if self.gemini_model and detected_objects:
                    try:
                        prompt = self._build_caption_prompt(detected_objects)
                        response = self.gemini_model.generate_content(prompt)
                        caption = response.text.strip()
                        if caption.startswith('"') and caption.endswith('"'):
                            caption = caption[1:-1]  # Clean up quotes
                    except Exception as e:
                        print(f"Error generating caption: {e}")
                        caption = "Caption generation failed"

                # 6. Return combined result
                return {
                    'imageDataUrl': image_data_uri,
                    'objects': detected_objects,
                    'caption': caption,
                }

            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        except Exception as e:
            return {'error': f'An unexpected error occurred: {str(e)}'}

    def _save_temp_image(self, image):
        """Save PIL image to temporary file and return path"""
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                image.save(temp_file, format='JPEG')
                return temp_file.name
        except Exception as e:
            print(f"Error saving temp image: {e}")
            return None

    def _build_caption_prompt(self, objects):
        """Build prompt for Gemini caption generation"""
        object_list_str = "\n".join([f"- {obj['class']} (Confidence: {obj['confidence']:.2f})" for obj in objects])

        return f"""
        Generate a concise and informative caption for an image based on the following detected objects.
        The caption should describe the recognized objects, their count, and other salient characteristics.
        Do not start with "This is an image of...". Just describe the scene naturally.

        Detected Objects:
        {object_list_str}

        Caption:
        """
