// src/config/api.js
const API_CONFIG = {
  // Django API server (PythonAnywhere) - for lightweight endpoints
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',

  // ML Service (HF Spaces) - for real-time ML endpoints
  ML_URL: process.env.REACT_APP_ML_URL || 'http://localhost:8080',

  API_VERSION: 'v1',

  // Endpoints on Django API server
  ENDPOINTS: {
    // Direct processing endpoints
    DIRECT_OBJECT_DETECTION: '/api/processing/direct_object_detection/',
    DIRECT_IMAGE_SEGMENTATION: '/api/processing/direct_image_segmentation/',

    // Chatbot
    CHATBOT: '/api/processing/chatbot/',

    // Simulation Lab
    SIMULATION_CSV: '/api/simulation/csv_simulate/',
    SIMULATION_RUN: '/api/simulation/run/',
    SIMULATION_PROBABILITIES: '/api/simulation/probabilities/',
    SIMULATION_SENSITIVITY: '/api/simulation/sensitivity/',
    SIMULATION_PATHS3D: '/api/simulation/paths3d/',

    // Student Performance Predictor
    STUDENT_PREDICT: '/api/processing/student-performance-predict/',

    // Gesture info (static data, no ML needed)
    GESTURE_INFO: '/api/processing/get_gesture_info/',
  },

  // Endpoints on ML Service (HF Spaces) - called directly from frontend
  ML_ENDPOINTS: {
    FACE_EMBEDDING: '/predict/face_embedding',
    RECOGNIZE_FRAME: '/predict/recognize_frame',
    GESTURE: '/predict/gesture',
  }
};

export default API_CONFIG;
