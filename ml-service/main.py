"""
FastAPI ML Service — serves heavy ML model predictions.
Runs on Oracle Cloud Free Tier (4 ARM cores, 24GB RAM).
"""
import io
import base64
import os
import tempfile
import json
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="AI Vision ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Lazy-loaded model singletons (saves memory — only loaded on first request)
# ---------------------------------------------------------------------------
_object_detector = None
_segmentation_service = None
_face_service = None
_gesture_service = None


def get_object_detector():
    global _object_detector
    if _object_detector is None:
        from services.object_detection import ObjectDetectionService
        _object_detector = ObjectDetectionService()
    return _object_detector


def get_segmentation_service():
    global _segmentation_service
    if _segmentation_service is None:
        from services.image_segmentation_service import ImageSegmentationService
        _segmentation_service = ImageSegmentationService()
    return _segmentation_service


def get_face_service():
    global _face_service
    if _face_service is None:
        from services.facial_recognition_service import FacialRecognitionService
        _face_service = FacialRecognitionService()
    return _face_service


def get_gesture_service():
    global _gesture_service
    if _gesture_service is None:
        from services.gesture_control_service import GestureControlService
        _gesture_service = GestureControlService()
    return _gesture_service


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict/object_detection")
async def object_detection(file: UploadFile = File(...), confidence: float = 0.5):
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(await file.read())
    tmp.close()

    try:
        service = get_object_detector()
        detections, vis_path = service.process_image_with_viz(
            tmp.name, confidence_threshold=confidence
        )

        # Read result image as base64
        result_b64 = None
        if vis_path:
            # vis_path may be relative to MEDIA_ROOT or absolute
            abs_path = vis_path if os.path.isabs(vis_path) else os.path.join("/app/media", vis_path)
            if os.path.exists(abs_path):
                with open(abs_path, "rb") as f:
                    result_b64 = base64.b64encode(f.read()).decode()
                os.remove(abs_path)

        return {"detections": detections, "result_image_b64": result_b64}
    finally:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)


@app.post("/predict/segmentation")
async def segmentation(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(await file.read())
    tmp.close()

    try:
        service = get_segmentation_service()
        results = service.process_segmentation(tmp.name)
        prediction = service.get_prediction_mask(tmp.name)

        out_path = tmp.name + "_seg.jpg"
        service.create_segmentation_visualization(tmp.name, prediction, out_path)

        result_b64 = None
        if os.path.exists(out_path):
            with open(out_path, "rb") as f:
                result_b64 = base64.b64encode(f.read()).decode()
            os.remove(out_path)

        return {**results, "result_image_b64": result_b64}
    finally:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)


@app.post("/predict/face_embedding")
async def face_embedding(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or ".jpg")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(await file.read())
    tmp.close()

    try:
        service = get_face_service()
        embedding = service.extract_embedding(tmp.name)

        if embedding is None:
            return JSONResponse(
                status_code=400, content={"error": "No face detected"}
            )
        emb_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding
        return {"embedding": emb_list}
    finally:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)


@app.post("/predict/recognize_frame")
async def recognize_frame(
    frame: str = Form(...),
    embedding: str = Form(...),
    name: str = Form("Unknown"),
):
    ref_embedding = np.array(json.loads(embedding))
    service = get_face_service()
    results = service.process_webcam_frame(frame, ref_embedding, name)
    return results


@app.post("/predict/gesture")
async def gesture(frame: str = Form(...)):
    service = get_gesture_service()
    results = service.process_hand_gestures(frame)
    return results
