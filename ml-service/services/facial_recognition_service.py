import insightface
import cv2
import numpy as np
import base64


class FacialRecognitionService:
    def __init__(self):
        self.model = insightface.app.FaceAnalysis(name='buffalo_l')
        self.model.prepare(ctx_id=0, det_size=(320, 320))

    def extract_embedding(self, image_path):
        try:
            img = cv2.imread(image_path)
            if img is None:
                return None
            faces = self.model.get(img)
            if not faces:
                return None
            return faces[0].embedding
        except Exception as e:
            print(f"Error extracting embedding: {e}")
            return None

    def compare_faces(self, embedding1, embedding2, threshold=0.4):
        try:
            if embedding1 is None or embedding2 is None:
                return 0.0, False
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )
            return float(similarity), similarity >= threshold
        except Exception as e:
            print(f"Error comparing faces: {e}")
            return 0.0, False

    def process_webcam_frame(self, frame_base64, reference_embedding, person_name):
        try:
            frame_data = base64.b64decode(frame_base64)
            frame_array = np.frombuffer(frame_data, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

            if frame is None:
                return {'faces': [], 'error': 'Failed to decode frame'}

            faces = self.model.get(frame)
            if not faces:
                return {'faces': [], 'error': None}

            face_results = []
            for face in faces:
                face_embedding = face.embedding
                similarity, is_match = self.compare_faces(reference_embedding, face_embedding)
                bbox = face.bbox.astype(int).tolist()

                if is_match:
                    name = person_name
                    confidence = similarity
                else:
                    name = "Unknown"
                    confidence = float(face.det_score)

                face_results.append({
                    'bbox': bbox,
                    'name': name,
                    'confidence': float(confidence),
                    'is_match': bool(is_match),
                    'similarity': float(similarity)
                })

            return {'faces': face_results, 'error': None}
        except Exception as e:
            print(f"Error processing webcam frame: {e}")
            return {'faces': [], 'error': str(e)}
