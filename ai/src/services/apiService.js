// src/services/apiService.js
import API_CONFIG from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.mlURL = API_CONFIG.ML_URL;
    this.endpoints = API_CONFIG.ENDPOINTS;
    this.mlEndpoints = API_CONFIG.ML_ENDPOINTS;

    // Local cache for face embeddings (replaces server-side session)
    this._faceEmbeddings = {};
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // === Django API endpoints (via PythonAnywhere) ===

  async directObjectDetection(file) {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${this.baseURL}${this.endpoints.DIRECT_OBJECT_DETECTION}`;
    const response = await fetch(url, { method: 'POST', body: formData });
    return this.handleResponse(response);
  }

  async directImageSegmentation(file) {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${this.baseURL}${this.endpoints.DIRECT_IMAGE_SEGMENTATION}`;
    const response = await fetch(url, { method: 'POST', body: formData });
    return this.handleResponse(response);
  }

  async getGestureInfo() {
    const url = `${this.baseURL}${this.endpoints.GESTURE_INFO}`;
    const response = await fetch(url, { method: 'GET' });
    return this.handleResponse(response);
  }

  // Monte Carlo Simulation Lab
  async csvSimulate(file, horizonDays = 30, numSimulations = 10000) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('horizon_days', horizonDays);
    formData.append('num_simulations', numSimulations);
    const url = `${this.baseURL}${this.endpoints.SIMULATION_CSV}`;
    const response = await fetch(url, { method: 'POST', body: formData });
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

  async predictStudentPerformance(params) {
    const url = `${this.baseURL}${this.endpoints.STUDENT_PREDICT}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  // Chatbot
  async sendChatMessage(message, context, history) {
    const url = `${this.baseURL}${this.endpoints.CHATBOT}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, history }),
    });
    return this.handleResponse(response);
  }

  // === ML Service endpoints (direct to HF Spaces) ===

  async registerFace(file, name) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.mlURL}${this.mlEndpoints.FACE_EMBEDDING}`;
    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await this.handleResponse(response);

    if (result.embedding) {
      // Store embedding locally with a session ID
      const sessionId = crypto.randomUUID();
      this._faceEmbeddings[sessionId] = {
        embedding: result.embedding,
        name: name,
      };
      return {
        session_id: sessionId,
        name: name,
        status: 'registered',
        message: 'Face embedding extracted and stored successfully',
      };
    }

    throw new Error(result.error || 'No face detected in the uploaded image');
  }

  async recognizeFrame(sessionId, frameBase64) {
    const cached = this._faceEmbeddings[sessionId];
    if (!cached) {
      throw new Error('Session not found. Please register a face first.');
    }

    const formData = new FormData();
    formData.append('frame', frameBase64);
    formData.append('embedding', JSON.stringify(cached.embedding));
    formData.append('name', cached.name);

    const url = `${this.mlURL}${this.mlEndpoints.RECOGNIZE_FRAME}`;
    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await this.handleResponse(response);

    const faces = result.faces || [];
    return {
      faces: faces,
      session_id: sessionId,
      reference_name: cached.name,
      total_faces: faces.length,
      matched_faces: faces.filter(f => f.is_match).length,
      unknown_faces: faces.filter(f => !f.is_match).length,
    };
  }

  async processGestureFrame(frameBase64) {
    const formData = new FormData();
    formData.append('frame', frameBase64);

    const url = `${this.mlURL}${this.mlEndpoints.GESTURE}`;
    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await this.handleResponse(response);

    return {
      success: true,
      mode: 'hands',
      results: result,
      timestamp: crypto.randomUUID(),
    };
  }
}

export default new ApiService();
