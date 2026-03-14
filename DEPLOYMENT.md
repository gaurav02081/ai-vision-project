# AI Vision Lab - Deployment & Maintenance Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Docker Setup](#docker-setup)
3. [Frontend - Vercel](#frontend---vercel)
4. [Backend - PythonAnywhere](#backend---pythonanywhere)
5. [ML Service - Hugging Face Spaces](#ml-service---hugging-face-spaces)
6. [How FastAPI ML Service Works](#how-fastapi-ml-service-works)
7. [Maintenance & Updates](#maintenance--updates)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Logs](#monitoring--logs)

---

## Deployment Overview

| Service | Platform | URL | Cost |
|---------|----------|-----|------|
| **Frontend** | Vercel | `https://ai-vision-project.vercel.app` | Free |
| **API Server** | PythonAnywhere | `https://gaurav000.pythonanywhere.com` | Free |
| **ML Service** | Hugging Face Spaces | `https://gauravkarmakar-ai-vision-ml.hf.space` | Free |

### Free Tier Limitations

| Platform | Limitation | Impact |
|----------|-----------|--------|
| Vercel | 100GB bandwidth/month | Sufficient for moderate traffic |
| PythonAnywhere | 512MB disk, no external HTTP (whitelist only) | ML calls go direct from frontend |
| HF Spaces | 16GB RAM, sleeps after 15min inactivity | First request after sleep takes ~30s (cold start) |

---

## Docker Setup

### Local Development (All 3 services)

```bash
cd ai-vision-project

# Build and start all services
docker compose up --build

# Frontend:    http://localhost:3000
# Backend:     http://localhost:8000
# ML Service:  http://localhost:8080
```

### Docker Architecture

```
docker-compose.yml
├── backend (port 8000)
│   ├── Dockerfile.light (Python 3.11, ~200MB)
│   ├── No ML dependencies
│   └── Calls ml-service via HTTP
│
├── ml-service (port 8080)
│   ├── Dockerfile (Python 3.11, ~4GB)
│   ├── PyTorch, YOLOv8, InsightFace, MediaPipe
│   └── Lazy-loads models on first request
│
└── frontend (port 3000)
    ├── Dockerfile (multi-stage: Node build → Nginx serve)
    └── ~55MB final image
```

### Dockerfile Breakdown

#### Frontend (`ai/Dockerfile`)
```dockerfile
# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

#### Backend Light (`ai_vision_backend/Dockerfile.light`)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements-light.txt .
RUN pip install --no-cache-dir -r requirements-light.txt
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "ai_vision_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### ML Service (`ml-service/Dockerfile`)
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 g++ ...
WORKDIR /app
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Image Sizes

| Image | Size | Contents |
|-------|------|----------|
| `ai-frontend` | 55MB (compressed) | Nginx + static React build |
| `ai-backend-light` | 176MB (compressed) | Django + numpy + requests |
| `ai-backend` (full) | 890MB (compressed) | Django + all ML libraries |
| `ml-service` | ~3-4GB | FastAPI + PyTorch + all ML models |

---

## Frontend - Vercel

### How to Access
- **Dashboard**: https://vercel.com/gaurav02081s-projects/ai-vision-project
- **Live site**: https://ai-vision-project.vercel.app

### How Deployment Works
1. Every push to `main` branch triggers auto-deployment
2. Vercel runs `CI=false npm run build` from the `ai/` directory
3. Static files are served globally via Vercel's CDN

### Settings
| Setting | Value |
|---------|-------|
| Root Directory | `ai` |
| Framework Preset | Create React App |
| Build Command | `CI=false npm run build` (in package.json) |
| Output Directory | `build` |
| Node.js Version | 20.x |

### Environment Variables
| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://gaurav000.pythonanywhere.com` |
| `REACT_APP_ML_URL` | `https://gauravkarmakar-ai-vision-ml.hf.space` |

### How to Update Frontend
```bash
# Make changes to ai/src/...
cd ai-vision-project
git add ai/
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys within 2-3 minutes
```

### Important Files
- `ai/vercel.json` - Routing config. `"handle": "filesystem"` ensures static assets (images, videos, CSVs) are served before the SPA fallback.
- `ai/package.json` - `engines.node: "20.x"` and `CI=false` in build script.

---

## Backend - PythonAnywhere

### How to Access
- **Dashboard**: https://www.pythonanywhere.com/user/gaurav000/
- **Bash Console**: Dashboard → Consoles → Bash
- **Web App Config**: Dashboard → Web tab
- **Files**: Dashboard → Files tab
- **Live API**: https://gaurav000.pythonanywhere.com

### Project Location on Server
```
/home/gaurav000/ai-vision-project/ai_vision_backend/
├── .env                    # Environment variables
├── manage.py
├── ai_vision_backend/      # Django project
├── apps/                   # Django apps
├── venv/                   # Virtual environment
├── staticfiles/            # Collected static files
└── media/                  # User uploads
```

### WSGI Configuration
File: `/var/www/gaurav000_pythonanywhere_com_wsgi.py`
```python
import os
import sys
from dotenv import load_dotenv

path = '/home/gaurav000/ai-vision-project/ai_vision_backend'
if path not in sys.path:
    sys.path.append(path)

load_dotenv(os.path.join(path, '.env'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'ai_vision_backend.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### Virtualenv Path
```
/home/gaurav000/ai-vision-project/ai_vision_backend/venv
```

### Static Files Config (Web tab)
| URL | Directory |
|-----|-----------|
| `/static/` | `/home/gaurav000/ai-vision-project/ai_vision_backend/staticfiles` |
| `/media/` | `/home/gaurav000/ai-vision-project/ai_vision_backend/media` |

### How to Update Backend
```bash
# SSH into PythonAnywhere Bash console
cd ~/ai-vision-project
git pull origin main

# If dependencies changed:
cd ai_vision_backend
source venv/bin/activate
pip install -r requirements-light.txt

# If models changed:
python manage.py migrate
python manage.py collectstatic --noinput

# Then go to Web tab → Click "Reload"
```

### How to Edit .env
```bash
cd ~/ai-vision-project/ai_vision_backend
nano .env
# Edit values, save with Ctrl+X → Y → Enter
# Then go to Web tab → Reload
```

---

## ML Service - Hugging Face Spaces

### How to Access
- **Space Dashboard**: https://huggingface.co/spaces/gauravkarmakar/ai-vision-ml
- **Logs**: Space page → "Logs" tab (or Runtime logs button)
- **API**: https://gauravkarmakar-ai-vision-ml.hf.space
- **API Docs**: https://gauravkarmakar-ai-vision-ml.hf.space/docs

### How it Works
1. HF Spaces builds a Docker container from the `Dockerfile`
2. Container runs `uvicorn main:app --host 0.0.0.0 --port 7860`
3. FastAPI serves ML prediction endpoints
4. Models are lazy-loaded on first request (cold start ~30s)
5. Space sleeps after 15 minutes of inactivity

### How to Update ML Service

**Option 1: Via the hf-space directory (recommended)**
```bash
cd ai-vision-project

# Make changes to ml-service/
# Then copy to hf-space and push
cp ml-service/main.py hf-space/
cp ml-service/requirements.txt hf-space/
cp -r ml-service/services/* hf-space/services/

cd hf-space
git add -A
git commit -m "Update ML service"
git push
# HF rebuilds automatically (5-15 min)
```

**Option 2: Via HF web editor**
- Go to space → Files tab → Edit files directly in browser

### HF Spaces Authentication
```bash
# Set remote with token (replace YOUR_TOKEN)
cd hf-space
git remote set-url origin https://gauravkarmakar:hf_YOUR_TOKEN@huggingface.co/spaces/gauravkarmakar/ai-vision-ml

# Get token from: https://huggingface.co/settings/tokens
# Need "Write" access token
```

### Cold Start Behavior
- After 15 min of no requests, the Space goes to sleep
- Next request triggers a wake-up (~30 seconds)
- Models then need to be re-loaded on first use
- **Tip**: The `/health` endpoint wakes the space without loading models

---

## How FastAPI ML Service Works

### Architecture

```python
# main.py - FastAPI Application

app = FastAPI(title="AI Vision ML Service")

# CORS middleware allows browser to call directly
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

# Lazy-loaded singletons - models load on first request
_object_detector = None
def get_object_detector():
    global _object_detector
    if _object_detector is None:
        _object_detector = ObjectDetectionService()  # Loads YOLOv8
    return _object_detector

# Endpoints accept files/form data, return JSON
@app.post("/predict/object_detection")
async def object_detection(file: UploadFile, confidence: float = 0.5):
    # 1. Save uploaded file to temp
    # 2. Run YOLOv8 inference
    # 3. Create visualization image
    # 4. Return detections + base64 result image
```

### Request Flow Example (Object Detection)

```
1. Frontend sends POST with image file
   Content-Type: multipart/form-data

2. FastAPI receives the file via UploadFile
   - Saves to tempfile

3. ObjectDetectionService.process_image_with_viz()
   - Loads YOLOv8n model (first time only)
   - Runs inference: model(image_path, conf=0.5)
   - Extracts bounding boxes, class names, confidence
   - Draws boxes on image using OpenCV
   - Saves visualization

4. Response:
   {
     "detections": [
       {"class": "person", "confidence": 0.95, "bbox": [x1, y1, x2, y2]},
       ...
     ],
     "result_image_b64": "base64_encoded_image..."
   }
```

### Face Recognition Flow

```
Step 1: Register Face
  Frontend → POST /predict/face_embedding (with photo)
  ML Service → InsightFace extracts 512-dimensional embedding vector
  Response → {embedding: [0.75, 0.74, -0.005, ...]}  (512 floats)
  Frontend stores embedding locally

Step 2: Recognize (every 5 seconds)
  Frontend captures webcam frame as JPEG base64
  Frontend → POST /predict/recognize_frame
    Body: frame (base64), embedding (JSON array), name ("Gaurav")
  ML Service:
    1. Decode base64 frame → OpenCV image
    2. Detect all faces with InsightFace
    3. For each face, extract embedding
    4. Compare with reference using cosine similarity
    5. If similarity >= 0.4 → match
  Response → {faces: [{name: "Gaurav", is_match: true, similarity: 0.85, bbox: [...]}]}
```

### Gesture Detection Flow

```
Frontend captures webcam frame as JPEG base64
Frontend → POST /predict/gesture (body: frame=base64)
ML Service:
  1. Decode base64 → OpenCV image
  2. Convert BGR to RGB
  3. MediaPipe Hands processes frame
  4. Extract 21 landmarks per hand (x, y, z coordinates)
  5. Classify gesture based on finger positions:
     - Thumbs Up: thumb tip above thumb IP, other fingers closed
     - Peace Sign: index + middle up, ring + pinky down
     - Pointing: only index extended
     - Fist: all fingers closed
     - OK Sign: thumb tip near index tip
     - Open Hand: all fingers extended
  6. Map gestures to UI actions (next, previous, select, close, etc.)
Response → {hands: [...], gestures: [{name: "Thumbs Up", action: "next"}], ...}
```

---

## Maintenance & Updates

### Adding a New Feature

1. **Frontend component**: Create `ai/src/components/NewFeature.jsx`
2. **Add route**: Update `ai/src/App.js`
3. **API endpoint** (if needed):
   - Django: Add to `ai_vision_backend/apps/processing/views.py`
   - ML: Add to `ml-service/main.py`
4. **Push**: `git push origin main` → Vercel auto-deploys
5. **Update backend**: SSH PythonAnywhere → `git pull` → Reload
6. **Update ML**: Copy to `hf-space/` → `git push`

### Updating Dependencies

**Frontend:**
```bash
cd ai
npm install new-package
npm run build  # Test locally
git add package.json package-lock.json
git push origin main
```

**Backend (PythonAnywhere):**
```bash
# Add to requirements-light.txt
# SSH into PythonAnywhere:
cd ~/ai-vision-project/ai_vision_backend
source venv/bin/activate
pip install new-package
# Web tab → Reload
```

**ML Service:**
```bash
# Add to ml-service/requirements.txt
# Copy to hf-space/requirements.txt
cd hf-space && git push
# Wait for HF rebuild (10-15 min)
```

### Updating ML Models

To swap a model (e.g., YOLOv8n → YOLOv8s):
1. Edit `ml-service/services/object_detection.py`
2. Change `YOLO('yolov8n.pt')` to `YOLO('yolov8s.pt')`
3. Push to hf-space
4. Model auto-downloads on first request

### Database Migrations

```bash
# On PythonAnywhere:
cd ~/ai-vision-project/ai_vision_backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
# Web tab → Reload
```

### Rotating Gemini API Key

1. Get new key from https://aistudio.google.com/apikey
2. SSH into PythonAnywhere
3. `nano ~/ai-vision-project/ai_vision_backend/.env`
4. Update `GEMINI_API_KEY=new_key_here`
5. Web tab → Reload

---

## Troubleshooting

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Build fails on Vercel | Check logs: `CI=false` must be in build script |
| Assets not loading | Check `vercel.json` has `"handle": "filesystem"` rule |
| API calls failing | Check env vars in Vercel dashboard |
| Blank page | Check browser console for errors |

### Backend Issues

| Problem | Solution |
|---------|----------|
| 500 error | Check PythonAnywhere error log (Web tab → Error log) |
| Module not found | Check WSGI path and virtualenv path |
| Disk quota exceeded | Delete unused files: `rm -rf ~/.cache/pip` |
| CORS error | Check `CORS_ALLOWED_ORIGINS` in `.env` |

### ML Service Issues

| Problem | Solution |
|---------|----------|
| 500 error | Check HF Spaces Logs tab |
| numpy.bool_ error | Ensure all numpy types are cast to Python types |
| MediaPipe error | Ensure `mediapipe==0.10.14` is pinned |
| Cold start slow | First request loads models (~30s). Use `/health` to wake. |
| Space sleeping | Send any request to wake it up |

### Common Commands

```bash
# Test ML service health
curl https://gauravkarmakar-ai-vision-ml.hf.space/health

# Test Django health
curl https://gaurav000.pythonanywhere.com/admin/

# Check PythonAnywhere error logs
cat /var/log/gaurav000.pythonanywhere.com.error.log | tail -50

# Rebuild HF Space (push empty commit)
cd hf-space
git commit --allow-empty -m "Rebuild"
git push
```

---

## Monitoring & Logs

### Vercel
- **Deployments**: Dashboard → Deployments tab
- **Build logs**: Click on any deployment
- **Analytics**: Dashboard → Analytics (page views, performance)

### PythonAnywhere
- **Error log**: Web tab → Error log link
- **Server log**: Web tab → Server log link
- **Access log**: Web tab → Access log link
- **Console**: Consoles tab → Bash

### Hugging Face Spaces
- **Build logs**: Space page → Settings → See build logs
- **Runtime logs**: Space page → Logs button (top right)
- **Status**: Space page shows "Running", "Building", or "Sleeping"

### Health Check Script
```bash
#!/bin/bash
echo "Frontend:" && curl -s -o /dev/null -w "%{http_code}" https://ai-vision-project.vercel.app
echo ""
echo "Backend:" && curl -s -o /dev/null -w "%{http_code}" https://gaurav000.pythonanywhere.com/admin/
echo ""
echo "ML Service:" && curl -s https://gauravkarmakar-ai-vision-ml.hf.space/health
echo ""
```

---

## Future Improvements

1. **Database**: Switch from SQLite to PostgreSQL (Supabase free tier) for persistent data
2. **Authentication**: Add user accounts with JWT tokens
3. **Media Storage**: Use Cloudinary (free: 25GB) for persistent image storage
4. **Caching**: Add Redis for face embedding persistence
5. **Custom Domain**: Point a custom domain to Vercel (free with Vercel)
6. **CI/CD**: Add GitHub Actions for automated testing
7. **Monitoring**: Add uptime monitoring (e.g., UptimeRobot free tier)
8. **GPU**: Upgrade HF Spaces to GPU tier for faster inference ($0.60/hr)
