# Image Segmentation Backend Implementation Guide

## Overview
Implement the backend API endpoints to support the Image Segmentation feature. This feature allows users to upload an image, process it through image segmentation algorithms, and receive a segmented output image along with AI-generated descriptions from Gemini.

## API Endpoints Required

### 1. Demo Session Creation
**Endpoint:** `POST /api/demo-sessions`
**Request Body:**
```json
{
  "demo_type": "image_segmentation"
}
```
**Response:**
```json
{
  "id": 123,
  "session_id": "uuid-string",
  "demo_type": "image_segmentation",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 2. File Upload
**Endpoint:** `POST /api/sessions/{session_id}/upload`
**Content-Type:** `multipart/form-data`
**Form Data:**
- `file`: Image file (JPEG, PNG, etc.)
- `name` (optional): Custom name for the file

**Response:**
```json
{
  "file_id": "file-uuid",
  "filename": "uploaded-image.jpg",
  "url": "https://storage.example.com/files/file-uuid.jpg",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

### 3. Image Segmentation Processing
**Endpoint:** `POST /api/image-segmentation`
**Request Body:**
```json
{
  "session_id": "uuid-string"
}
```
**Response:**
```json
{
  "task_id": "task-uuid",
  "status": "processing",
  "message": "Image segmentation started"
}
```

### 4. Session Status Check
**Endpoint:** `GET /api/sessions/{session_id}/status`
**Response:**
```json
{
  "status": "completed", // or "processing", "failed"
  "progress": 100,
  "message": "Processing completed successfully"
}
```

### 5. Get Processing Results
**Endpoint:** `GET /api/sessions/{session_id}/results`
**Response:**
```json
{
  "input_image_url": "https://storage.example.com/files/input-uuid.jpg",
  "output_image_url": "https://storage.example.com/files/segmented-uuid.jpg",
  "segments": [
    {
      "class": "person",
      "label": "Person",
      "confidence": 0.95,
      "mask": "base64-encoded-mask-data" // optional
    },
    {
      "class": "car",
      "label": "Car",
      "confidence": 0.87,
      "mask": "base64-encoded-mask-data" // optional
    }
  ],
  "ai_description": "The image shows a person standing next to a car in a parking lot. The segmentation clearly identifies the human figure and the vehicle, separating them from the background.",
  "technical_summary": "Segmentation performed using DeepLabV3+ model with ResNet-101 backbone. Achieved 94.2% mean IoU on COCO dataset validation. Processing time: 2.3 seconds.",
  "processing_time": 2.3,
  "model_used": "DeepLabV3+",
  "confidence_score": 0.94
}
```

## Implementation Requirements

### Image Segmentation Algorithm
- Use a state-of-the-art segmentation model like DeepLabV3+, Mask R-CNN, or U-Net
- Support common image formats (JPEG, PNG, WebP)
- Process images up to reasonable size limits (e.g., 1920x1080, 10MB)
- Generate segmented output image with color-coded segments or overlay

### AI Description Integration
- Integrate with Google Gemini (or similar LLM) to generate descriptions
- Send the segmented image to Gemini with prompt like: "Describe what you see in this segmented image. Explain the different segments and their relationships."
- Include technical summary with model details, performance metrics, and processing information

### Data Structures
- **Segment Object:**
  ```typescript
  interface Segment {
    class: string;        // Machine-readable class name
    label: string;        // Human-readable label
    confidence: number;   // Confidence score (0-1)
    mask?: string;        // Base64-encoded mask data (optional)
    area?: number;        // Pixel area of segment (optional)
    bbox?: [number, number, number, number]; // Bounding box [x,y,w,h] (optional)
  }
  ```

### Error Handling
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Handle timeouts (max 30 seconds processing time)
- Validate file types and sizes

### Storage Requirements
- Temporary storage for uploaded images
- Processed result storage with URLs
- Cleanup old files after session expiration

## Testing Checklist

### API Endpoints
- [ ] Demo session creation returns valid session ID
- [ ] File upload accepts image files and returns URLs
- [ ] Image segmentation processing starts successfully
- [ ] Status endpoint shows progress updates
- [ ] Results endpoint returns complete data structure

### Image Processing
- [ ] Segmentation produces accurate masks/outputs
- [ ] Output image shows clear segment boundaries
- [ ] Handles various image types and sizes
- [ ] Processing completes within timeout limits

### AI Integration
- [ ] Gemini generates relevant descriptions
- [ ] Technical summary includes model details
- [ ] Error handling for AI service failures

### Edge Cases
- [ ] Invalid file types rejected
- [ ] Large files handled appropriately
- [ ] Corrupted images handled gracefully
- [ ] Network timeouts managed
- [ ] Concurrent processing handled

## Performance Considerations
- Optimize model inference for real-time processing
- Implement caching for repeated requests
- Use efficient image processing libraries
- Consider GPU acceleration for better performance

## Security Considerations
- Validate uploaded file types and content
- Implement rate limiting
- Secure file storage and access
- Sanitize AI-generated content if displayed

## Deployment Notes
- Ensure model weights are available in deployment environment
- Configure Gemini API credentials securely
- Set up proper logging and monitoring
- Implement health checks for all services
