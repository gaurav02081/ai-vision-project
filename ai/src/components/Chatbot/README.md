# AI Chatbot Widget

A context-aware AI chatbot powered by Google Gemini that provides assistance for the AI Vision Lab project.

## Features

- **Context-Aware**: Understands which page/feature the user is currently viewing
- **Real-time Chat**: Instant responses powered by Google Gemini API
- **Floating Widget**: Always accessible from any page
- **Conversation History**: Maintains context during the session
- **Responsive Design**: Works on desktop and mobile devices

## Components

### ChatbotWidget.jsx
Main chatbot component with:
- Floating button (bottom-right corner)
- Expandable chat window
- Message history display
- Input field with send functionality
- Loading states and error handling
- Minimize/maximize functionality

### ChatMessage.jsx
Individual message component with:
- User vs bot message styling
- Timestamp display
- Proper text formatting

## Context Awareness

The chatbot automatically detects the current page and provides relevant help:

- **Home**: General project overview and feature introduction
- **Object Detection**: YOLOv8 model details and usage instructions
- **Facial Recognition**: InsightFace technology and face registration process
- **Gesture Control**: MediaPipe Hands gestures and UI control
- **Image Segmentation**: DeepLabV3+ model and pixel-level segmentation
- **Documentation**: API references and technical guides
- **Contact**: Support information and contact details

## API Integration

- **Backend**: `/api/processing/chatbot/` endpoint
- **Service**: `chatbotService.js` handles API calls and context detection
- **Configuration**: Uses existing `GEMINI_API_KEY` from Django settings

## Usage

The chatbot widget appears automatically on all pages. Users can:
1. Click the floating message button to open the chat
2. Type questions about AI Vision Lab features
3. Get context-aware responses based on current page
4. Minimize/close the chat window as needed

## Technical Details

- **Frontend**: React with Tailwind CSS styling
- **Backend**: Django REST Framework with Google Gemini integration
- **State Management**: React hooks for local state
- **API**: RESTful endpoint with JSON communication
- **Error Handling**: Graceful fallbacks for API failures
