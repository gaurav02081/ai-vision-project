// src/services/apiService.js
import API_CONFIG from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoints = API_CONFIG.ENDPOINTS;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Direct processing methods (no session required)
  async directObjectDetection(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${this.endpoints.DIRECT_OBJECT_DETECTION}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  async directImageSegmentation(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${this.endpoints.DIRECT_IMAGE_SEGMENTATION}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Real-time facial recognition methods
  async registerFace(file, name) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    const url = `${this.baseURL}/api/processing/register_face/`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  async recognizeFrame(sessionId, frameBase64) {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('frame', frameBase64);

    const url = `${this.baseURL}/api/processing/recognize_frame/`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Real-time hand gesture control methods
  async processGestureFrame(frameBase64) {
    const formData = new FormData();
    formData.append('frame', frameBase64);

    const url = `${this.baseURL}/api/processing/process_gesture_frame/`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  async getGestureInfo() {
    const url = `${this.baseURL}/api/processing/get_gesture_info/`;

    const response = await fetch(url, {
      method: 'GET',
    });

    return this.handleResponse(response);
  }

  // Monte Carlo Simulation Lab
  async csvSimulate(file, horizonDays = 30, numSimulations = 10000) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('horizon_days', horizonDays);
    formData.append('num_simulations', numSimulations);

    const url = `${this.baseURL}${this.endpoints.SIMULATION_CSV}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse(response);
  }

  async runSimulation(params) {
    const url = `${this.baseURL}${this.endpoints.SIMULATION_RUN}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  async getSimulationProbabilities(params) {
    const url = `${this.baseURL}${this.endpoints.SIMULATION_PROBABILITIES}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  async runSensitivityAnalysis(params) {
    const url = `${this.baseURL}${this.endpoints.SIMULATION_SENSITIVITY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  async getSimulationPaths3D(params) {
    const url = `${this.baseURL}${this.endpoints.SIMULATION_PATHS3D}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }
}

export default new ApiService();
