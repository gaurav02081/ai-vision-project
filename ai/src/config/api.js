// src/config/api.js
const API_CONFIG = {
  // Development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  
  // Endpoints
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
  }
};

export default API_CONFIG;
