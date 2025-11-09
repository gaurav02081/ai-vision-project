import insightface
import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path
import google.generativeai as genai
import base64
import io

class FacialRecognitionService:
    def __init__(self):
        # Initialize InsightFace model
        self.model = insightface.app.FaceAnalysis(name='buffalo_l')
        self.model.prepare(ctx_id=0, det_size=(640, 640))

        # Configure Gemini API
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

    def process_face(self, image_path, name):
        """
        Process face image and return recognition results
        """
        try:
            # Load and process image
            img = cv2.imread(image_path)
            faces = self.model.get(img)

            if not faces:
                return {
                    'recognized': False,
                    'confidence': 0.0,
                    'ai_description': 'No face detected in the image.',
                    'technical_summary': 'Face detection failed - no faces found.'
                }

            # For demo purposes, assume recognition if face is detected
            # In production, you'd compare against a database of known faces
            face = faces[0]  # Take the first face
            confidence = float(face.det_score)

            # Generate AI description using Gemini
            ai_description = self._generate_ai_description(img, name, confidence)

            return {
                'recognized': confidence > 0.5,  # Threshold for recognition
                'confidence': confidence,
                'ai_description': ai_description,
                'technical_summary': f'Detected face with confidence {confidence:.2f}. Facial features extracted successfully.'
            }

        except Exception as e:
            return {
                'recognized': False,
                'confidence': 0.0,
                'ai_description': f'Error processing image: {str(e)}',
                'technical_summary': f'Processing failed: {str(e)}'
            }

    def _generate_ai_description(self, image, name, confidence):
        """
        Generate AI description using Gemini API
        """
        try:
            # Convert image to base64 for Gemini
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            model = genai.GenerativeModel('gemini-pro-vision')

            prompt = f"""
            Analyze this facial image of {name}. Provide a detailed description including:
            - Age estimation
            - Gender
            - Ethnicity
            - Facial features
            - Expression
            - Any notable characteristics

            The face was recognized with {confidence:.2f} confidence.
            """

            response = model.generate_content([prompt, pil_image])
            return response.text

        except Exception as e:
            return f"AI analysis failed: {str(e)}"

    def draw_face_box(self, image_path, output_path):
        """
        Draw bounding box around detected face
        """
        img = cv2.imread(image_path)
        faces = self.model.get(img)

        for face in faces:
            bbox = face.bbox.astype(int)
            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)

        cv2.imwrite(output_path, img)
        return output_path

    def extract_embedding(self, image_path):
        """
        Extract 512-dimensional face embedding vector from reference image
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return None
            
            faces = self.model.get(img)
            if not faces:
                return None
            
            # Return the embedding of the first detected face
            return faces[0].embedding
            
        except Exception as e:
            print(f"Error extracting embedding: {e}")
            return None

    def compare_faces(self, embedding1, embedding2, threshold=0.4):
        """
        Compare embeddings using cosine similarity
        """
        try:
            if embedding1 is None or embedding2 is None:
                return 0.0, False
            
            # Calculate cosine similarity
            similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
            is_match = similarity >= threshold
            
            return float(similarity), is_match
            
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return 0.0, False

    def process_webcam_frame(self, frame_base64, reference_embedding, person_name):
        """
        Process webcam frame and return all detected faces with recognition status
        """
        try:
            # Decode base64 frame
            frame_data = base64.b64decode(frame_base64)
            frame_array = np.frombuffer(frame_data, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {'faces': [], 'error': 'Failed to decode frame'}
            
            # Detect all faces in the frame
            faces = self.model.get(frame)
            
            if not faces:
                return {'faces': [], 'error': None}
            
            # Process each detected face
            face_results = []
            for face in faces:
                # Extract embedding for this face
                face_embedding = face.embedding
                
                # Compare with reference embedding
                similarity, is_match = self.compare_faces(reference_embedding, face_embedding)
                
                # Get bounding box coordinates
                bbox = face.bbox.astype(int).tolist()
                
                # Determine name and confidence
                if is_match:
                    name = person_name
                    confidence = similarity
                else:
                    name = "Unknown"
                    confidence = face.det_score  # Use detection confidence for unknown faces
                
                face_results.append({
                    'bbox': bbox,
                    'name': name,
                    'confidence': float(confidence),
                    'is_match': is_match,
                    'similarity': float(similarity)
                })
            
            return {'faces': face_results, 'error': None}
            
        except Exception as e:
            print(f"Error processing webcam frame: {e}")
            return {'faces': [], 'error': str(e)}
