# AI Vision Lab - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Frontend](#frontend)
5. [Backend API Server](#backend-api-server)
6. [ML Service](#ml-service)
7. [API Reference](#api-reference)
8. [Data Flow](#data-flow)
9. [Environment Variables](#environment-variables)

---

## Project Overview

AI Vision Lab is a comprehensive, full-stack computer vision platform that provides real-time AI-powered capabilities including:

- **Object Detection** - YOLOv8-based detection of 80+ object classes
- **Image Segmentation** - Pixel-level semantic segmentation using DeepLabV3+
- **Facial Recognition** - Real-time face detection and recognition using InsightFace
- **Gesture Control** - Hand gesture detection and UI control via MediaPipe Hands
- **Monte Carlo Simulation Lab** - GBM-based financial simulation with 3D visualization
- **Student Performance Predictor** - Logistic regression classifier
- **Neural Network Lab** - Interactive neural network training visualizer
- **AI Chatbot** - Context-aware assistant powered by Google Gemini 2.0 Flash

---

## Architecture

The project uses a **3-service microservice architecture**:

```
                    ┌──────────────────────────┐
                    │      React Frontend       │
                    │    (Vercel - Free)         │
                    │  ai-vision-project.vercel  │
                    └───────┬──────────┬────────┘
                            │          │
              Lightweight   │          │  Real-time ML
              endpoints     │          │  (direct calls)
                            ▼          ▼
              ┌─────────────────┐  ┌──────────────────────┐
              │  Django API      │  │  FastAPI ML Service   │
              │  (PythonAnywhere)│  │  (HF Spaces - Free)   │
              │  gaurav000.      │  │  gauravkarmakar-ai-   │
              │  pythonanywhere  │  │  vision-ml.hf.space    │
              └─────────────────┘  └──────────────────────┘
                      │                      │
                      │                      │
              ┌───────▼──────┐    ┌──────────▼─────────┐
              │ Google       │    │  ML Models           │
              │ Gemini API   │    │  - YOLOv8            │
              │              │    │  - DeepLabV3+        │
              │              │    │  - InsightFace        │
              │              │    │  - MediaPipe Hands    │
              └──────────────┘    └──────────────────────┘
```

### Why 3 Services?

| Concern | Solution |
|---------|----------|
| ML models need high RAM (4GB+) | Separate ML service on HF Spaces (16GB free) |
| Django API needs to be lightweight | PythonAnywhere free tier (512MB) with no ML deps |
| Frontend needs fast CDN delivery | Vercel with global edge network |
| Real-time features need low latency | Frontend calls ML service directly, skipping Django |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Tailwind CSS 3 | Styling |
| Framer Motion | Animations |
| React Router DOM 7 | Client-side routing |
| Plotly.js | Data visualization & 3D charts |
| Three.js (React Three Fiber) | 3D neural network visualization |
| Lucide React / React Icons | Icon libraries |

### Backend API Server
| Technology | Purpose |
|-----------|---------|
| Django 4.2 | Web framework |
| Django REST Framework | API layer |
| NumPy | Numerical computation |
| WhiteNoise | Static file serving |
| Gunicorn | Production WSGI server |
| Requests | HTTP client for ML service |

### ML Service
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async API framework |
| Uvicorn | ASGI server |
| PyTorch (CPU) | Deep learning framework |
| Ultralytics YOLOv8 | Object detection |
| DeepLabV3+ (torchvision) | Image segmentation |
| InsightFace | Facial recognition |
| MediaPipe 0.10.14 | Hand gesture detection |
| OpenCV | Image processing |
| ONNX Runtime | Model inference |

---

## Frontend

### Project Structure
```
ai/src/
├── App.js                      # Route definitions
├── config/
│   └── api.js                  # API endpoint configuration
├── services/
│   ├── apiService.js           # HTTP client (handles both Django & ML service)
│   └── chatbotService.js       # Chatbot integration
├── components/
│   ├── hero.jsx                # Landing page hero section with video background
│   ├── navbar.jsx              # Navigation bar
│   ├── features.jsx            # Feature cards section
│   ├── Footer.jsx              # Footer
│   ├── Object.jsx              # Object Detection page
│   ├── Segmentation.jsx        # Image Segmentation page
│   ├── Facial.jsx              # Facial Recognition page (webcam)
│   ├── Gesture.jsx             # Gesture Control page (webcam)
│   ├── MonteCarlo.jsx          # Monte Carlo Simulation Lab
│   ├── StudentPredictor.jsx    # Student Performance Predictor
│   ├── NeuralNetworkLab.jsx    # Interactive Neural Network visualizer
│   ├── DocsPage.jsx            # Technical documentation page
│   ├── RealWorldValue.jsx      # Real-world applications section
│   ├── LiveDemo.jsx            # Live demo section
│   └── Chatbot/
│       └── ChatbotWidget.jsx   # AI chatbot floating widget
└── assets/
    └── images/                 # Static images and media
```

### API Service Architecture

The `apiService.js` intelligently routes requests:

- **Django API endpoints** (via `REACT_APP_API_URL`): Chatbot, simulation, object detection, segmentation, student predictor
- **ML Service endpoints** (via `REACT_APP_ML_URL`): Face recognition, gesture control (direct calls for low latency)

Face embeddings are cached client-side in `apiService._faceEmbeddings` to avoid round-trips through Django.

---

## Backend API Server

### Project Structure
```
ai_vision_backend/
├── ai_vision_backend/
│   ├── settings.py             # Django configuration
│   ├── urls.py                 # Root URL routing
│   └── wsgi.py                 # WSGI entry point
├── apps/
│   ├── processing/
│   │   ├── views.py            # ProcessingViewSet (all CV endpoints)
│   │   ├── urls.py             # Processing URL patterns
│   │   ├── ml_client.py        # HTTP client for external ML service
│   │   └── services/
│   │       ├── gemini_service.py       # Google Gemini API (REST, no SDK)
│   │       ├── chatbot_service.py      # Context-aware chatbot
│   │       └── student_predictor.py    # Pure numpy logistic regression
│   └── quant_simulation/
│       ├── views.py            # SimulationViewSet
│       ├── urls.py             # Simulation URL patterns
│       └── services/
│           ├── monte_carlo.py  # GBM simulation engine
│           ├── probability.py  # VaR, CVaR analysis
│           └── sensitivity.py  # Parameter sensitivity analysis
├── requirements.txt            # Full dependencies (development)
├── requirements-light.txt      # Lightweight dependencies (production)
├── Dockerfile                  # Full Docker image (~4GB)
├── Dockerfile.light            # Lightweight Docker image (~200MB)
└── .env                        # Environment variables
```

### Key Design Decisions

1. **No `google-generativeai` SDK** - Uses direct REST API calls via `requests` to save 150MB disk space
2. **No `scikit-learn`** - Student predictor uses pure NumPy logistic regression to save 50MB
3. **ML Client pattern** - `ml_client.py` forwards heavy ML requests to the external FastAPI service
4. **In-memory face cache** - `FACE_EMBEDDING_CACHE` stores session embeddings (resets on restart)

---

## ML Service

### Project Structure
```
ml-service/
├── main.py                     # FastAPI application & endpoints
├── services/
│   ├── __init__.py
│   ├── object_detection.py     # YOLOv8 wrapper
│   ├── image_segmentation_service.py  # DeepLabV3+ wrapper
│   ├── facial_recognition_service.py  # InsightFace wrapper
│   └── gesture_control_service.py     # MediaPipe Hands wrapper
├── requirements.txt            # ML dependencies
├── Dockerfile                  # Docker configuration
└── .dockerignore
```

### Lazy-Loaded Model Singletons

Models are loaded only on first request to save memory:

```python
_object_detector = None
def get_object_detector():
    global _object_detector
    if _object_detector is None:
        from services.object_detection import ObjectDetectionService
        _object_detector = ObjectDetectionService()
    return _object_detector
```

This means:
- First request to each endpoint is slow (model loading)
- Subsequent requests are fast (model cached in memory)
- Unused models don't consume memory

### Model Details

| Model | Size | Input | Output |
|-------|------|-------|--------|
| YOLOv8n | ~6MB | Image file | Detections with bboxes + visualization |
| DeepLabV3+ (ResNet50) | ~160MB | Image file | Segments + colored mask visualization |
| InsightFace buffalo_l | ~280MB | Image file / base64 frame | 512-dim embedding / face matches |
| MediaPipe Hands | ~10MB | Base64 frame | 21 landmarks per hand + gestures |

---

## API Reference

### Django API Endpoints

#### Processing Endpoints (`/api/processing/`)

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST | `/direct_object_detection/` | Detect objects in image | `file` (image), `confidence` (float) |
| POST | `/direct_image_segmentation/` | Segment image | `file` (image) |
| POST | `/register_face/` | Register face for recognition | `file` (image), `name` (string) |
| POST | `/recognize_frame/` | Recognize faces in webcam frame | `session_id`, `frame` (base64) |
| POST | `/process_gesture_frame/` | Detect hand gestures | `frame` (base64) |
| GET | `/get_gesture_info/` | Get gesture documentation | — |
| POST | `/chatbot/` | AI chatbot response | `message`, `context`, `history` |
| POST | `/student-performance-predict/` | Predict student pass/fail | `study_hours`, `attendance`, `gpa`, `assignments`, `sleep_hours` |

#### Simulation Endpoints (`/api/simulation/`)

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| POST | `/csv_simulate/` | Simulate from CSV data | `file` (CSV), `horizon_days`, `num_simulations` |
| POST | `/run/` | Run manual simulation | `start_price`, `annual_drift`, `annual_volatility`, `horizon_days` |
| POST | `/probabilities/` | Probability analysis | Same as `/run/` + `custom_levels` |
| POST | `/sensitivity/` | Sensitivity analysis | `start_price`, `volatility_levels`, `drift_levels` |
| POST | `/paths3d/` | 3D path visualization data | Same as `/run/` + `sample_count` |

### ML Service Endpoints (FastAPI)

| Method | Endpoint | Description | Input |
|--------|----------|-------------|-------|
| GET | `/health` | Health check | — |
| POST | `/predict/object_detection` | YOLOv8 detection | `file` (image), `confidence` (float) |
| POST | `/predict/segmentation` | DeepLabV3+ segmentation | `file` (image) |
| POST | `/predict/face_embedding` | Extract face embedding | `file` (image) |
| POST | `/predict/recognize_frame` | Compare frame vs embedding | `frame` (b64), `embedding` (JSON), `name` |
| POST | `/predict/gesture` | Detect hand gestures | `frame` (base64) |

---

## Data Flow

### Object Detection
```
User uploads image
  → Frontend sends POST to Django /api/processing/direct_object_detection/
    → Django saves temp file, calls ML service /predict/object_detection
      → ML service runs YOLOv8, returns detections + visualization (base64)
    → Django saves result image, calls Gemini API for AI description
  → Frontend displays annotated image + detections + AI description
```

### Facial Recognition (Direct ML)
```
User uploads reference photo
  → Frontend sends POST directly to ML service /predict/face_embedding
    → ML service extracts 512-dim embedding using InsightFace
  → Frontend stores embedding locally with session ID

User starts webcam recognition
  → Frontend captures frame every 5 seconds
  → Frontend sends POST directly to ML service /predict/recognize_frame
    → ML service detects faces, compares with reference embedding
  → Frontend draws bounding boxes (green=match, red=unknown)
```

### Monte Carlo Simulation
```
User uploads CSV or enters parameters
  → Frontend sends POST to Django /api/simulation/csv_simulate/ or /run/
    → Django estimates GBM parameters from historical prices
    → Django runs vectorized Monte Carlo simulation (up to 50,000 paths)
    → Django computes percentiles, confidence bands, statistics
  → Frontend renders Plotly charts (fan chart, histogram, 3D paths)
```

---

## Environment Variables

### Frontend (Vercel)
| Variable | Value | Purpose |
|----------|-------|---------|
| `REACT_APP_API_URL` | `https://gaurav000.pythonanywhere.com` | Django API server URL |
| `REACT_APP_ML_URL` | `https://gauravkarmakar-ai-vision-ml.hf.space` | ML service URL |

### Backend (PythonAnywhere .env)
| Variable | Value | Purpose |
|----------|-------|---------|
| `SECRET_KEY` | (random string) | Django secret key |
| `DEBUG` | `False` | Production mode |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API key |
| `ALLOWED_HOSTS` | `gaurav000.pythonanywhere.com` | Allowed hosts |
| `CORS_ALLOWED_ORIGINS` | `https://ai-vision-project.vercel.app` | CORS whitelist |
| `ML_SERVICE_URL` | `https://gauravkarmakar-ai-vision-ml.hf.space` | ML service URL |

### ML Service (HF Spaces)
No environment variables needed — models auto-download on first use.
