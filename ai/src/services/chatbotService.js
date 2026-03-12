// Chatbot service for API calls and context detection
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const sendMessage = async (message, context = 'home', history = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.CHATBOT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: context,
        history: history
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw error;
  }
};

// Context detection utilities
export const getContextFromPath = (pathname) => {
  if (pathname === '/') return 'home';
  if (pathname.includes('object-detection')) return 'object-detection';
  if (pathname.includes('facial-recognition')) return 'facial-recognition';
  if (pathname.includes('gesture-control')) return 'gesture-control';
  if (pathname.includes('image-segmentation')) return 'image-segmentation';
  if (pathname.includes('docs')) return 'docs';
  return 'home';
};

// Local storage utilities for conversation history
export const saveConversationHistory = (messages) => {
  try {
    localStorage.setItem('chatbot_history', JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving conversation history:', error);
  }
};

export const loadConversationHistory = () => {
  try {
    const history = localStorage.getItem('chatbot_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
};

export const clearConversationHistory = () => {
  try {
    localStorage.removeItem('chatbot_history');
  } catch (error) {
    console.error('Error clearing conversation history:', error);
  }
};
