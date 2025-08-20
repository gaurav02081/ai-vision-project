// src/config/api.js
const API_CONFIG = {
  // Development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  
  // Endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/v1/auth/login/',
    REGISTER: '/api/v1/auth/register/',
    PROFILE: '/api/v1/auth/profile/',
    
    // Demo Sessions
    DEMO_SESSIONS: '/api/v1/demos/',
    UPLOAD_FILE: '/api/v1/demos/{session_id}/upload_file/',
    SESSION_STATUS: '/api/v1/demos/{session_id}/status/',
    SESSION_RESULTS: '/api/v1/demos/{session_id}/results/',
    
    // Processing
    OBJECT_DETECTION: '/api/v1/processing/object_detection/',
    FACIAL_RECOGNITION: '/api/v1/processing/facial_recognition/',
    GESTURE_RECOGNITION: '/api/v1/processing/gesture_recognition/',
    IMAGE_SEGMENTATION: '/api/v1/processing/image_segmentation/',
    
    // Feedback
    FEEDBACK: '/api/v1/feedback/',
  }
};

export default API_CONFIG;
