// src/services/apiService.js
import API_CONFIG from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoints = API_CONFIG.ENDPOINTS;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.request(this.endpoints.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request(this.endpoints.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request(this.endpoints.PROFILE);
  }

  // Demo session methods
  async createDemoSession(demoType) {
    return this.request(this.endpoints.DEMO_SESSIONS, {
      method: 'POST',
      body: JSON.stringify({ demo_type: demoType }),
    });
  }

  async uploadFile(sessionId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${this.endpoints.UPLOAD_FILE.replace('{session_id}', sessionId)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    return this.handleResponse(response);
  }

  async getSessionStatus(sessionId) {
    const endpoint = this.endpoints.SESSION_STATUS.replace('{session_id}', sessionId);
    return this.request(endpoint);
  }

  async getSessionResults(sessionId) {
    const endpoint = this.endpoints.SESSION_RESULTS.replace('{session_id}', sessionId);
    return this.request(endpoint);
  }

  // Processing methods
  async processObjectDetection(sessionId) {
    return this.request(this.endpoints.OBJECT_DETECTION, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  async processFacialRecognition(sessionId) {
    return this.request(this.endpoints.FACIAL_RECOGNITION, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  async processGestureRecognition(sessionId) {
    return this.request(this.endpoints.GESTURE_RECOGNITION, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  async processImageSegmentation(sessionId) {
    return this.request(this.endpoints.IMAGE_SEGMENTATION, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  // Feedback method
  async submitFeedback(feedbackData) {
    return this.request(this.endpoints.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }
}

export default new ApiService();
