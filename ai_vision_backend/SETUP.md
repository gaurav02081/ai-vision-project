# AI Vision Lab - Simplified Setup

## Overview
This is a simplified version of the AI Vision Lab project for college demonstration. It removes complex user management and focuses on core AI vision functionality.

## Features
- **Object Detection**: Upload images and get AI-powered object detection with descriptions
- **Facial Recognition**: Analyze faces in images
- **Gesture Control**: Recognize hand gestures
- **Image Segmentation**: Segment images into different regions
- **AI Descriptions**: Google Generative AI (Gemini) provides natural language descriptions of results

## Setup Instructions

### 1. Backend Setup
```bash
cd ai_vision_backend
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the backend directory with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 3. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Run Backend
```bash
python manage.py runserver
```

### 5. Frontend Setup
```bash
cd ../ai
npm install
npm start
```

## Usage
1. Go to any feature page (Object Detection, Facial Recognition, etc.)
2. Upload an image or video
3. Wait for processing
4. View results with AI-generated descriptions
5. Download the processed results

## API Endpoints
- `POST /api/demo-sessions/` - Create a new demo session
- `POST /api/demo-sessions/{id}/upload_file/` - Upload file to session
- `POST /api/processing/object_detection/` - Process object detection
- `GET /api/processing/object_detection/?session_id={uuid}` - Get results

## Notes
- No authentication required
- No user accounts or API keys needed
- Perfect for college project demonstration
- All processing results include AI-generated descriptions via Gemini
