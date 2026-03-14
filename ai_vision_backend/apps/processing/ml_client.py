"""
HTTP client for communicating with the external ML service (FastAPI).
Used when the Django API server runs in "light" mode without ML dependencies.
"""
import requests
import os
import json
import base64

ML_SERVICE_URL = os.environ.get("ML_SERVICE_URL", "http://localhost:8080")
ML_SERVICE_TIMEOUT = int(os.environ.get("ML_SERVICE_TIMEOUT", "120"))


def _ml_url(endpoint):
    return f"{ML_SERVICE_URL}{endpoint}"


def detect_objects(file_path, confidence=0.5):
    """
    Send image to ML service for object detection.
    Returns: { detections: [...], result_image_b64: str|None }
    """
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        data = {"confidence": str(confidence)}
        resp = requests.post(
            _ml_url("/predict/object_detection"),
            files=files,
            data=data,
            timeout=ML_SERVICE_TIMEOUT,
        )
    resp.raise_for_status()
    return resp.json()


def segment_image(file_path):
    """
    Send image to ML service for segmentation.
    Returns: { segments, ai_description, technical_summary, ..., result_image_b64 }
    """
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        resp = requests.post(
            _ml_url("/predict/segmentation"),
            files=files,
            timeout=ML_SERVICE_TIMEOUT,
        )
    resp.raise_for_status()
    return resp.json()


def extract_face_embedding(file_path):
    """
    Send image to ML service for face embedding extraction.
    Returns: { embedding: [float, ...] } or raises on error.
    """
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        resp = requests.post(
            _ml_url("/predict/face_embedding"),
            files=files,
            timeout=ML_SERVICE_TIMEOUT,
        )
    resp.raise_for_status()
    return resp.json()


def recognize_frame(frame_base64, reference_embedding, person_name):
    """
    Send webcam frame + reference embedding to ML service for face recognition.
    Returns: { faces: [...], error: str|None }
    """
    data = {
        "frame": frame_base64,
        "embedding": json.dumps(reference_embedding),
        "name": person_name,
    }
    resp = requests.post(
        _ml_url("/predict/recognize_frame"),
        data=data,
        timeout=ML_SERVICE_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


def process_gesture(frame_base64):
    """
    Send webcam frame to ML service for gesture recognition.
    Returns: { hands, gestures, ui_actions, stats, educational_info }
    """
    data = {"frame": frame_base64}
    resp = requests.post(
        _ml_url("/predict/gesture"),
        data=data,
        timeout=ML_SERVICE_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


def health_check():
    """Check if ML service is reachable."""
    try:
        resp = requests.get(_ml_url("/health"), timeout=5)
        return resp.status_code == 200
    except requests.RequestException:
        return False
