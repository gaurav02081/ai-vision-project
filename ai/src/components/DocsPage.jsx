import { useState, useEffect } from "react";
import yoloPerformanceGraph from "../assets/images/yolo_performance_graph.jpeg";
import trainingCurves from "../assets/images/training_curves.jpeg";
import colabScreenshot1 from "../assets/images/colab_screenshot_1.jpeg";
import colabScreenshot2 from "../assets/images/colab_screenshot_2.jpeg";
import colabScreenshot3 from "../assets/images/colab_screenshot_3.jpeg";
import colabScreenshot4 from "../assets/images/colab_screenshot_4.jpeg";
import colabScreenshot5 from "../assets/images/colab_screenshot_5.jpeg";
import colabScreenshot6 from "../assets/images/colab_screenshot_6.jpeg";
import colabScreenshot7 from "../assets/images/colab_screenshot_7.jpeg";
import colabScreenshot8 from "../assets/images/colab_screenshot_8.jpeg";
import colabScreenshot9 from "../assets/images/colab_screenshot_9.jpeg";

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    "introduction",
    "getting-started",
    "architecture",
    "features",
    "object-detection",
    "facial-recognition",
    "gesture-control",
    "image-segmentation",
    "how-to-train-models",
    "performance-metrics",
    "api-reference",
    "research-papers",
    "faq",
  ];

  // Scroll-spy logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.unobserve(el);
    });
  }, []);

  return (
    <div
      className={`${darkMode ? "dark-mode" : ""} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 min-h-screen bg-[#121212] text-gray-200`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">AI Vision Lab Documentation</h1>
        <p className="text-xl text-gray-400">Comprehensive Computer Vision Platform</p>
      </div>

      {/* Main */}
      <main className="grid grid-cols-12 gap-8 mt-8">
        {/* Sidebar */}
        <aside className="col-span-3 sticky top-24 self-start">
          <nav className="space-y-2">
            {sections.map((sec) => (
              <a
                key={sec}
                href={`#${sec}`}
                className={`block px-4 py-2 rounded-md ${
                  activeSection === sec
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {sec.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="col-span-9 p-6 bg-[#1E1E1E] rounded-lg shadow-md prose prose-invert max-w-none">
          
          {/* Introduction */}
          <div id="introduction">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Introduction</h5>
            <p className="text-base md:text-lg">
              <strong>AI Vision Lab</strong> is a comprehensive computer vision platform that demonstrates 
              cutting-edge AI technologies through interactive web applications. Built with modern web 
              technologies and powered by state-of-the-art deep learning models, this platform showcases 
              real-time computer vision capabilities including object detection, facial recognition, 
              gesture control, and semantic image segmentation.
            </p>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Project Goals</h3>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Educational Platform:</strong> Teach computer vision concepts through interactive demos</li>
              <li><strong>Technical Showcase:</strong> Demonstrate full-stack AI application development</li>
              <li><strong>Research Integration:</strong> Implement latest research papers in practical applications</li>
              <li><strong>Performance Optimization:</strong> Achieve real-time processing with minimal latency</li>
            </ul>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-blue-400 font-semibold">Frontend</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>React.js 18+</li>
                  <li>Tailwind CSS</li>
                  <li>WebRTC (Camera API)</li>
                  <li>Canvas API</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-green-400 font-semibold">Backend</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>Django 4.2+</li>
                  <li>Django REST Framework</li>
                  <li>Python 3.11+</li>
                  <li>SQLite Database</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div id="getting-started" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Getting Started</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Prerequisites</h3>
            <ul className="text-base md:text-lg space-y-2">
              <li>Python 3.11 or higher</li>
              <li>Node.js 16+ and npm</li>
              <li>Webcam for real-time features</li>
              <li>Modern web browser with WebRTC support</li>
            </ul>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Installation</h3>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <h4 className="text-3xl font-semibold mt-6 mb-4">Backend Setup</h4>
              <pre className="text-green-400"><code>{`# Clone the repository
git clone <repository-url>
cd ai-vision-project/ai_vision_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver`}</code></pre>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <h4 className="text-3xl font-semibold mt-6 mb-4">Frontend Setup</h4>
              <pre className="text-blue-400"><code>{`# Navigate to frontend directory
cd ai-vision-project/ai

# Install dependencies
npm install

# Start development server
npm start`}</code></pre>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">First Steps</h3>
            <ol className="text-base md:text-lg space-y-2">
              <li><strong>Access the Platform:</strong> Open http://localhost:3000 in your browser</li>
              <li><strong>Enable Camera:</strong> Allow camera access for real-time features</li>
              <li><strong>Explore Features:</strong> Navigate through Object Detection, Facial Recognition, Gesture Control, and Image Segmentation</li>
              <li><strong>Upload Images:</strong> Test static image processing capabilities</li>
            </ol>
          </div>

          {/* Architecture */}
          <div id="architecture" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">System Architecture</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">High-Level Architecture</h3>
            <div className="bg-gray-800 p-6 rounded-lg my-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-900 p-4 rounded">
                  <h4 className="text-blue-300">Frontend Layer</h4>
                  <p className="text-base md:text-lg">React.js UI Components</p>
                  <p className="text-base md:text-lg">WebRTC Camera Integration</p>
                  <p className="text-base md:text-lg">Real-time Visualization</p>
                </div>
                <div className="bg-green-900 p-4 rounded">
                  <h4 className="text-green-300">API Layer</h4>
                  <p className="text-base md:text-lg">Django REST Framework</p>
                  <p className="text-base md:text-lg">RESTful Endpoints</p>
                  <p className="text-base md:text-lg">Authentication & CORS</p>
                </div>
                <div className="bg-purple-900 p-4 rounded">
                  <h4 className="text-purple-300">AI Processing</h4>
                  <p className="text-base md:text-lg">PyTorch Models</p>
                  <p className="text-base md:text-lg">MediaPipe Integration</p>
                  <p className="text-base md:text-lg">Gemini AI Descriptions</p>
                </div>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Data Flow</h3>
            <ol className="text-base md:text-lg space-y-2">
              <li><strong>Input Capture:</strong> Webcam or uploaded image</li>
              <li><strong>Preprocessing:</strong> Image normalization and resizing</li>
              <li><strong>AI Processing:</strong> Model inference on GPU/CPU</li>
              <li><strong>Post-processing:</strong> Results formatting and visualization</li>
              <li><strong>Response:</strong> JSON data with bounding boxes, landmarks, or masks</li>
            </ol>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Model Integration</h3>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-yellow-400">Object Detection</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>YOLOv8 (Ultralytics)</li>
                  <li>COCO Dataset (80 classes)</li>
                  <li>Real-time inference</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-pink-400">Facial Recognition</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>InsightFace</li>
                  <li>ArcFace embeddings</li>
                  <li>Face detection & recognition</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-cyan-400">Gesture Control</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>MediaPipe Hands</li>
                  <li>21 hand landmarks</li>
                  <li>Real-time tracking</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400">Image Segmentation</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>DeepLabV3+ (ResNet-50)</li>
                  <li>COCO + Pascal VOC</li>
                  <li>Pixel-level classification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div id="features" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Features Overview</h5>
            
            <div className="grid grid-cols-2 gap-6 my-6">
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-lg">
                <h3 className="text-blue-300 text-xl font-semibold mb-3">Object Detection</h3>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• Real-time YOLOv8 inference</li>
                  <li>• 80 COCO object classes</li>
                  <li>• Bounding box visualization</li>
                  <li>• Confidence scoring</li>
                  <li>• AI-powered descriptions</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-pink-900 to-pink-800 p-6 rounded-lg">
                <h3 className="text-pink-300 text-xl font-semibold mb-3">Facial Recognition</h3>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• InsightFace model integration</li>
                  <li>• Face detection & embedding</li>
                  <li>• Identity matching</li>
                  <li>• Multi-face support</li>
                  <li>• Real-time processing</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 p-6 rounded-lg">
                <h3 className="text-cyan-300 text-xl font-semibold mb-3">Gesture Control</h3>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• MediaPipe hand tracking</li>
                  <li>• 21 landmark detection</li>
                  <li>• Gesture classification</li>
                  <li>• Real-time visualization</li>
                  <li>• Educational hand anatomy</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-6 rounded-lg">
                <h3 className="text-orange-300 text-xl font-semibold mb-3">Image Segmentation</h3>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• DeepLabV3+ semantic segmentation</li>
                  <li>• Pixel-level classification</li>
                  <li>• COCO + Pascal VOC classes</li>
                  <li>• Mask visualization</li>
                  <li>• AI analysis integration</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Object Detection */}
          <div id="object-detection" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Object Detection</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Technical Implementation</h3>
            <p className="text-base md:text-lg">
              Our object detection system leverages <strong>YOLOv8</strong> (You Only Look Once version 8) 
              from Ultralytics, providing state-of-the-art real-time object detection capabilities.
            </p>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Model Details</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Architecture:</strong> YOLOv8n (nano variant for speed)</li>
              <li><strong>Dataset:</strong> COCO 2017 (80 object classes)</li>
              <li><strong>Input Size:</strong> 640x640 pixels</li>
              <li><strong>Framework:</strong> PyTorch with Ultralytics wrapper</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Mathematical Formulation</h4>
            <p className="text-base md:text-lg">
              YOLOv8 uses a unified loss function that combines classification and localization losses:
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`L_total = L_cls + λ_box * L_box + λ_obj * L_obj

Where:
L_cls = -Σ[I_ij^obj * Σ[c_i^true * log(c_i^pred) + (1 - c_i^true) * log(1 - c_i^pred)]]

L_box = Σ[I_ij^obj * (1 - IoU(box_pred, box_true))]

L_obj = -Σ[I_ij^obj * log(p_ij^obj) + (1 - I_ij^obj) * log(1 - p_ij^obj)]

Parameters:
- λ_box = 0.05 (box loss weight)
- λ_obj = 1.0 (objectness loss weight)
- I_ij^obj: indicator function (1 if object exists in cell i,j)
- IoU: Intersection over Union
- c_i^true/pred: true/predicted class probabilities
- p_ij^obj: predicted objectness score`}</code></pre>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Performance Comparison</h4>
            <p className="text-base md:text-lg">
              The following graph shows the performance-latency trade-off for various YOLO models and other object detection architectures:
            </p>
            <div className="bg-gray-800 p-6 rounded-lg my-6 text-center">
              <img 
                src={yoloPerformanceGraph} 
                alt="YOLO Performance-Latency Graph showing mAP vs processing time"
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                style={{ maxHeight: '500px' }}
              />
                <p className="text-base md:text-lg text-gray-400 mt-4 text-left">
                <strong>Figure 1: YOLO Performance-Latency Comparison</strong><br/>
                This graph compares various YOLO models and other object detection architectures on the COCO dataset. 
                The X-axis shows latency (processing time per image) on NVIDIA T4 GPU with TensorRT10 FP16, 
                while the Y-axis shows mAP@0.5:0.95 (mean Average Precision) on COCO validation set.
              </p>
              <div className="text-xs text-gray-500 mt-2 text-left">
                <strong>Key Insights:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>YOLO11 consistently forms the Pareto front, offering the best accuracy-latency trade-off</li>
                  <li>YOLO11n achieves ~39.5 mAP at ~1.5ms/img (fastest inference)</li>
                  <li>YOLO11x achieves ~54.5 mAP at ~12ms/img (highest accuracy)</li>
                  <li>Our implementation uses YOLOv8n for optimal real-time performance</li>
                </ul>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Supported Object Classes</h4>
            <div className="grid grid-cols-4 gap-2 text-xs my-4">
              {['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 
                'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 
                'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 
                'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 
                'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 
                'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 
                'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 
                'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 
                'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 
                'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 
                'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 
                'toothbrush'].map((item, index) => (
                <span key={index} className="bg-gray-700 px-2 py-1 rounded text-center">
                  {item}
                </span>
              ))}
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Performance Metrics</h4>
            <div className="bg-gray-800 p-4 rounded-lg my-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h5 className="text-green-400">Speed</h5>
                  <p className="text-2xl font-bold">~45ms</p>
                  <p className="text-xs">per frame</p>
                </div>
                <div>
                  <h5 className="text-blue-400">Accuracy</h5>
                  <p className="text-2xl font-bold">mAP@0.5</p>
                  <p className="text-xs">37.3%</p>
                </div>
                <div>
                  <h5 className="text-purple-400">Model Size</h5>
                  <p className="text-2xl font-bold">6.2MB</p>
                  <p className="text-xs">YOLOv8n</p>
                </div>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">API Endpoint</h4>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`POST /api/processing/direct_object_detection/
Content-Type: multipart/form-data

{
  "image": <file>,
  "confidence_threshold": 0.5
}

Response:
{
  "success": true,
  "detections": [
    {
      "class_id": 0,
      "class_name": "person",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 300]
    }
  ],
  "result_image_url": "/media/result.jpg",
  "ai_description": "AI-generated description..."
}`}</code></pre>
            </div>
          </div>

          {/* Facial Recognition */}
          <div id="facial-recognition" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Facial Recognition</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Technical Implementation</h3>
            <p className="text-base md:text-lg">
              Our facial recognition system uses <strong>InsightFace</strong>, a state-of-the-art 
              face recognition library that provides high-accuracy face detection and recognition capabilities.
            </p>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Model Details</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Framework:</strong> InsightFace with ArcFace loss</li>
              <li><strong>Embedding Size:</strong> 512-dimensional face embeddings</li>
              <li><strong>Detection:</strong> RetinaFace for face detection</li>
              <li><strong>Recognition:</strong> ArcFace for face recognition</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Mathematical Formulation</h4>
            <p className="text-base md:text-lg">
              InsightFace uses ArcFace loss function for deep face recognition:
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`ArcFace Loss Function:
L = -1/N * Σ[log(e^(s*cos(θ_yi + m)) / (e^(s*cos(θ_yi + m)) + Σ[e^(s*cos(θ_j))]))]

Where:
- θ_yi = arccos(W_yi^T * x_i / (||W_yi|| * ||x_i||))
- m: additive angular margin (typically 0.5)
- s: feature scale (typically 64)
- W_yi: weight vector for class yi
- x_i: normalized feature vector
- N: batch size

Face Similarity:
similarity = cos(θ) = (f1 · f2) / (||f1|| * ||f2||)

Where:
- f1, f2: face embedding vectors
- θ: angle between vectors`}</code></pre>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Key Features</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Multi-face Detection:</strong> Detects multiple faces in a single image</li>
              <li><strong>Face Embeddings:</strong> Generates unique 512D vectors for each face</li>
              <li><strong>Identity Matching:</strong> Compares faces using cosine similarity</li>
              <li><strong>Robust Recognition:</strong> Works under various lighting conditions</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Performance Metrics</h4>
            <div className="bg-gray-800 p-4 rounded-lg my-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h5 className="text-green-400">Accuracy</h5>
                  <p className="text-2xl font-bold">99.4%</p>
                  <p className="text-xs">LFW Dataset</p>
                </div>
                <div>
                  <h5 className="text-blue-400">Speed</h5>
                  <p className="text-2xl font-bold">~120ms</p>
                  <p className="text-xs">per face</p>
                </div>
                <div>
                  <h5 className="text-purple-400">Embedding</h5>
                  <p className="text-2xl font-bold">512D</p>
                  <p className="text-xs">vector size</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gesture Control */}
          <div id="gesture-control" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Gesture Control</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Technical Implementation</h3>
            <p className="text-base md:text-lg">
              Our gesture control system leverages <strong>MediaPipe Hands</strong>, Google's 
              real-time hand tracking solution that provides accurate hand landmark detection 
              and gesture recognition.
            </p>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Model Details</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Framework:</strong> MediaPipe Hands</li>
              <li><strong>Landmarks:</strong> 21 hand keypoints per hand</li>
              <li><strong>Max Hands:</strong> 2 hands simultaneously</li>
              <li><strong>Detection Confidence:</strong> 0.7 (configurable)</li>
              <li><strong>Tracking Confidence:</strong> 0.5 (configurable)</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Mathematical Formulation</h4>
            <p className="text-base md:text-lg">
              MediaPipe Hands uses a two-stage pipeline for hand landmark detection:
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`Stage 1: Hand Detection
- Uses BlazePalm model to detect hand bounding boxes
- Output: [x_center, y_center, width, height, confidence]

Stage 2: Landmark Detection
- Crops hand region and predicts 21 3D landmarks
- Each landmark: [x, y, z, visibility]

Landmark Coordinates:
- x, y: normalized coordinates [0, 1]
- z: relative depth (smaller = closer to camera)
- visibility: confidence [0, 1]

Gesture Classification:
For each gesture G, compute feature vector F:
F = [d_1, d_2, ..., d_n, θ_1, θ_2, ..., θ_m]

Where:
- d_i: distances between key landmarks
- θ_j: angles between landmark vectors

Decision Rule:
gesture = argmax(P(G|F)) = argmax(softmax(W * F + b))`}</code></pre>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Hand Landmark Structure</h4>
            <div className="bg-gray-800 p-4 rounded-lg my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-cyan-400">Landmark Points</h5>
                  <ul className="text-base md:text-lg space-y-1">
                    <li>• Wrist (0)</li>
                    <li>• Thumb (1-4)</li>
                    <li>• Index Finger (5-8)</li>
                    <li>• Middle Finger (9-12)</li>
                    <li>• Ring Finger (13-16)</li>
                    <li>• Pinky (17-20)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-cyan-400">Coordinate System</h5>
                  <ul className="text-base md:text-lg space-y-1">
                    <li>• X: 0-1 (left to right)</li>
                    <li>• Y: 0-1 (top to bottom)</li>
                    <li>• Z: relative depth</li>
                    <li>• Visibility: 0-1</li>
                  </ul>
                </div>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Supported Gestures</h4>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="text-green-400">Basic Gestures</h5>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• Open Hand</li>
                  <li>• Closed Fist</li>
                  <li>• Thumbs Up</li>
                  <li>• Thumbs Down</li>
                  <li>• Peace Sign</li>
                  <li>• Pointing</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="text-blue-400">Advanced Gestures</h5>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• OK Sign</li>
                  <li>• Rock Paper Scissors</li>
                  <li>• Counting (1-5)</li>
                  <li>• Stop Sign</li>
                  <li>• Wave</li>
                  <li>• Custom Gestures</li>
                </ul>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Performance Metrics</h4>
            <div className="bg-gray-800 p-4 rounded-lg my-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h5 className="text-green-400">FPS</h5>
                  <p className="text-2xl font-bold">30+</p>
                  <p className="text-xs">real-time</p>
                </div>
                <div>
                  <h5 className="text-blue-400">Latency</h5>
                  <p className="text-2xl font-bold">&lt;33ms</p>
                  <p className="text-xs">per frame</p>
                </div>
                <div>
                  <h5 className="text-purple-400">Accuracy</h5>
                  <p className="text-2xl font-bold">95%+</p>
                  <p className="text-xs">landmark detection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Segmentation */}
          <div id="image-segmentation" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Image Segmentation</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Technical Implementation</h3>
            <p className="text-base md:text-lg">
              Our image segmentation system uses <strong>DeepLabV3+</strong> with ResNet-50 backbone, 
              providing state-of-the-art semantic segmentation capabilities for pixel-level 
              object classification.
            </p>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Model Details</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Architecture:</strong> DeepLabV3+ with ResNet-50</li>
              <li><strong>Dataset:</strong> COCO + Pascal VOC (91 classes)</li>
              <li><strong>Input Size:</strong> 520x520 pixels</li>
              <li><strong>Framework:</strong> PyTorch with torchvision</li>
              <li><strong>Output:</strong> Pixel-level class predictions</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Mathematical Formulation</h4>
            <p className="text-base md:text-lg">
              DeepLabV3+ uses atrous (dilated) convolutions and ASPP for multi-scale feature extraction:
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`Atrous Convolution:
y[i] = Σ[x[i + r*k] * w[k]]

Where:
- r: dilation rate
- k: kernel index
- x: input feature map
- w: convolution weights

ASPP (Atrous Spatial Pyramid Pooling):
ASPP(x) = Concat[Conv1x1(x), Conv3x3_r6(x), Conv3x3_r12(x), Conv3x3_r18(x), GlobalAvgPool(x)]

Loss Function (Cross-Entropy):
L = -1/N * Σ[Σ[y_ij * log(p_ij)]]

Where:
- N: number of pixels
- y_ij: ground truth label for pixel (i,j)
- p_ij: predicted probability for pixel (i,j)

Mean Intersection over Union (mIoU):
mIoU = (1/C) * Σ[|P_i ∩ T_i| / |P_i ∪ T_i|]

Where:
- C: number of classes
- P_i: predicted pixels for class i
- T_i: ground truth pixels for class i`}</code></pre>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Segmentation Classes</h4>
            <div className="grid grid-cols-4 gap-2 text-xs my-4">
              {['person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 
                'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 
                'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 
                'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 
                'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 
                'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 
                'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 
                'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 
                'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 
                'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 
                'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 
                'toothbrush'].map((item, index) => (
                <span key={index} className="bg-gray-700 px-2 py-1 rounded text-center">
                  {item}
                </span>
              ))}
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Performance Metrics</h4>
            <div className="bg-gray-800 p-4 rounded-lg my-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h5 className="text-green-400">mIoU</h5>
                  <p className="text-2xl font-bold">42.1%</p>
                  <p className="text-xs">COCO val</p>
                </div>
                <div>
                  <h5 className="text-blue-400">Speed</h5>
                  <p className="text-2xl font-bold">~200ms</p>
                  <p className="text-xs">per image</p>
                </div>
                <div>
                  <h5 className="text-purple-400">Model Size</h5>
                  <p className="text-2xl font-bold">169MB</p>
                  <p className="text-xs">ResNet-50</p>
                </div>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Post-Processing</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Segment Extraction:</strong> Identifies connected components</li>
              <li><strong>Area Filtering:</strong> Removes segments outside size thresholds</li>
              <li><strong>Confidence Scoring:</strong> Assigns confidence to each segment</li>
              <li><strong>Bounding Box Generation:</strong> Creates bounding boxes for segments</li>
              <li><strong>AI Description:</strong> Generates natural language descriptions</li>
            </ul>
          </div>

          {/* How to Train Custom Models */}
          <div id="how-to-train-models" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">How to Train Custom Models</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Overview</h3>
            <p className="text-base md:text-lg">
              This section provides comprehensive guidance on training custom models for each AI feature. 
              We'll cover data preparation, model architecture, training procedures, and evaluation methods 
              with practical examples using Google Colab.
            </p>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Training Object Detection Model (YOLOv8)</h3>
            
            <h4 className="text-3xl font-semibold mt-6 mb-4">Data Preparation</h4>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Dataset Format:</strong> YOLO format with .txt annotation files</li>
              <li><strong>Image Requirements:</strong> Minimum 640x640 pixels, various lighting conditions</li>
              <li><strong>Annotation:</strong> Bounding boxes with class labels</li>
              <li><strong>Data Split:</strong> 70% train, 20% validation, 10% test</li>
            </ul>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Training Configuration</h4>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-green-400"><code>{`# YOLOv8 Training Configuration
model = YOLO('yolov8n.pt')  # Load pre-trained model

# Training parameters
results = model.train(
    data='path/to/dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    lr0=0.01,
    weight_decay=0.0005,
    momentum=0.937,
    device='cuda'  # Use GPU if available
)`}</code></pre>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Training Progress Visualization</h4>
            <p className="text-base md:text-lg">
              <strong>Training Loss and Accuracy Curves:</strong> Monitor model performance during training
            </p>
            <div className="bg-gray-800 p-6 rounded-lg my-6 text-center">
              <img 
                src={trainingCurves} 
                alt="Training accuracy and loss curves over 150 epochs"
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                style={{ maxHeight: '500px' }}
              />
                <p className="text-base md:text-lg text-gray-400 mt-4 text-left">
                <strong>Figure 2: Training Progress Over 150 Epochs</strong><br/>
                This graph shows the training and validation performance of our YOLOv8 model over 150 epochs. 
                The top plot (a) displays model accuracy, while the bottom plot (b) shows model loss.
              </p>
              <div className="text-xs text-gray-500 mt-2 text-left">
                <strong>Key Observations:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Accuracy (Top Plot):</strong> Both training and validation accuracy start around 0.2 and rapidly increase to 1.0 by epoch 60</li>
                  <li><strong>Loss (Bottom Plot):</strong> Training and validation loss decrease from ~1.75 to near 0.0 by epoch 60</li>
                  <li><strong>Convergence:</strong> Model achieves excellent performance with perfect accuracy and minimal loss after 60 epochs</li>
                  <li><strong>Stability:</strong> Performance remains stable for the remaining 90 epochs, indicating good generalization</li>
                  <li><strong>No Overfitting:</strong> Validation curves closely follow training curves, showing healthy learning</li>
                </ul>
              </div>
            </div>

            <h4 className="text-3xl font-semibold mt-6 mb-4">Google Colab Notebook</h4>
            <p className="text-base md:text-lg">
              <strong>Complete Training Pipeline:</strong> Step-by-step implementation in Google Colab
            </p>
            
            <div className="space-y-6 my-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-blue-400">1. Environment Setup & Data Loading</h5>
                <img 
                  src={colabScreenshot1} 
                  alt="Colab notebook showing environment setup and data loading"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Initial setup including library imports, GPU configuration, and dataset preparation.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-green-400">2. Model Architecture & Configuration</h5>
                <img 
                  src={colabScreenshot2} 
                  alt="Colab notebook showing YOLOv8 model configuration"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  YOLOv8 model initialization with custom parameters and configuration settings.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-purple-400">3. Training Loop Implementation</h5>
                <img 
                  src={colabScreenshot3} 
                  alt="Colab notebook showing training loop and optimization"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Complete training loop with loss computation, backpropagation, and optimization steps.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-yellow-400">4. Validation & Metrics</h5>
                <img 
                  src={colabScreenshot4} 
                  alt="Colab notebook showing validation and metrics calculation"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Validation process and performance metrics calculation during training.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-red-400">5. Model Evaluation</h5>
                <img 
                  src={colabScreenshot5} 
                  alt="Colab notebook showing model evaluation and testing"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Final model evaluation on test dataset with comprehensive performance analysis.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-cyan-400">6. Results Visualization</h5>
                <img 
                  src={colabScreenshot6} 
                  alt="Colab notebook showing results visualization and predictions"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Visualization of model predictions and performance results on sample images.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-orange-400">7. Performance Analysis</h5>
                <img 
                  src={colabScreenshot7} 
                  alt="Colab notebook showing detailed performance analysis"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Detailed analysis of model performance including accuracy, precision, and recall metrics.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-pink-400">8. Model Export & Deployment</h5>
                <img 
                  src={colabScreenshot8} 
                  alt="Colab notebook showing model export and deployment preparation"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Model export in various formats and preparation for deployment in production environment.
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-xl font-semibold mb-4 text-indigo-400">9. Final Results & Summary</h5>
                <img 
                  src={colabScreenshot9} 
                  alt="Colab notebook showing final results and training summary"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto mb-4"
                  style={{ maxHeight: '400px' }}
                />
                <p className="text-base md:text-lg text-gray-400 text-left">
                  Comprehensive summary of training results, final metrics, and model performance insights.
                </p>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg my-6">
              <h5 className="text-lg font-semibold mb-3 text-green-400">Complete Training Pipeline Overview</h5>
              <div className="grid grid-cols-3 gap-4 text-base md:text-lg">
                <div>
                  <h6 className="font-semibold text-blue-400 mb-2">Setup & Data</h6>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Environment configuration</li>
                    <li>• Dataset loading</li>
                    <li>• Data preprocessing</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-semibold text-green-400 mb-2">Training</h6>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Model initialization</li>
                    <li>• Training loop</li>
                    <li>• Validation</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-semibold text-purple-400 mb-2">Evaluation</h6>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Performance metrics</li>
                    <li>• Results visualization</li>
                    <li>• Model export</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Best Practices</h3>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Data Quality:</strong> Ensure high-quality, diverse training data</li>
              <li><strong>Hyperparameter Tuning:</strong> Use grid search or random search for optimal parameters</li>
              <li><strong>Regularization:</strong> Apply dropout, batch normalization, and data augmentation</li>
              <li><strong>Monitoring:</strong> Use TensorBoard or Weights & Biases for training visualization</li>
              <li><strong>Validation:</strong> Always validate on held-out test set</li>
              <li><strong>Model Selection:</strong> Choose best model based on validation metrics</li>
            </ul>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Hardware Requirements</h3>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-blue-400">Minimum Requirements</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• 8GB RAM</li>
                  <li>• NVIDIA GTX 1060 (6GB VRAM)</li>
                  <li>• 50GB storage</li>
                  <li>• Google Colab Pro</li>
                </ul>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-green-400">Recommended</h4>
                <ul className="text-base md:text-lg space-y-1">
                  <li>• 16GB+ RAM</li>
                  <li>• NVIDIA RTX 3080+ (10GB+ VRAM)</li>
                  <li>• 100GB+ SSD storage</li>
                  <li>• Local GPU setup</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div id="performance-metrics" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Performance Metrics</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">System Performance</h3>
            <div className="bg-gray-800 p-6 rounded-lg my-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-green-400 mb-3">Real-time Processing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Object Detection:</span>
                      <span className="text-green-400">~45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Facial Recognition:</span>
                      <span className="text-green-400">~120ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gesture Control:</span>
                      <span className="text-green-400">~33ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Image Segmentation:</span>
                      <span className="text-green-400">~200ms</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-blue-400 mb-3">Accuracy Scores</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Object Detection (mAP@0.5):</span>
                      <span className="text-blue-400">37.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Facial Recognition (LFW):</span>
                      <span className="text-blue-400">99.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gesture Detection:</span>
                      <span className="text-blue-400">95%+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Segmentation (mIoU):</span>
                      <span className="text-blue-400">42.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Resource Usage</h3>
            <div className="grid grid-cols-3 gap-4 my-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <h4 className="text-yellow-400">CPU Usage</h4>
                <p className="text-2xl font-bold">15-25%</p>
                <p className="text-xs">during inference</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <h4 className="text-red-400">Memory Usage</h4>
                <p className="text-2xl font-bold">2-4GB</p>
                <p className="text-xs">RAM consumption</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <h4 className="text-purple-400">GPU Usage</h4>
                <p className="text-2xl font-bold">1-2GB</p>
                <p className="text-xs">VRAM (if available)</p>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Scalability</h3>
            <ul className="text-base md:text-lg space-y-2">
              <li><strong>Concurrent Users:</strong> Supports 10+ simultaneous users</li>
              <li><strong>Request Rate:</strong> 100+ requests per minute</li>
              <li><strong>Image Size:</strong> Up to 4K resolution supported</li>
              <li><strong>Batch Processing:</strong> Multiple images in single request</li>
            </ul>
          </div>

          {/* API Reference */}
          <div id="api-reference" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">API Reference</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Base URL</h3>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <code className="text-green-400">http://localhost:8000/api/processing/</code>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Authentication</h3>
            <p className="text-base md:text-lg">Currently, the API is open for development. In production, implement JWT authentication.</p>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Endpoints</h3>
            
            <div className="space-y-6 my-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-blue-400">Object Detection</h4>
                <div className="bg-gray-900 p-3 rounded mt-2">
                  <pre className="text-green-400"><code>{`POST /direct_object_detection/
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- confidence_threshold: float (optional, default: 0.5)

Response:
{
  "success": true,
  "detections": [...],
  "result_image_url": "...",
  "ai_description": "..."
}`}</code></pre>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-pink-400">Facial Recognition</h4>
                <div className="bg-gray-900 p-3 rounded mt-2">
                  <pre className="text-green-400"><code>{`POST /direct_facial_recognition/
Content-Type: multipart/form-data

Parameters:
- image: File (required)

Response:
{
  "success": true,
  "faces": [...],
  "result_image_url": "...",
  "ai_description": "..."
}`}</code></pre>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-cyan-400">Gesture Control</h4>
                <div className="bg-gray-900 p-3 rounded mt-2">
                  <pre className="text-green-400"><code>{`POST /process_gesture_frame/
Content-Type: application/json

Parameters:
- frame: base64 string (required)

Response:
{
  "success": true,
  "results": {
    "hands": [...],
    "gestures": [...]
  }
}`}</code></pre>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400">Image Segmentation</h4>
                <div className="bg-gray-900 p-3 rounded mt-2">
                  <pre className="text-green-400"><code>{`POST /direct_image_segmentation/
Content-Type: multipart/form-data

Parameters:
- image: File (required)

Response:
{
  "success": true,
  "segments": [...],
  "result_image_url": "...",
  "ai_description": "..."
}`}</code></pre>
                </div>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Error Handling</h3>
            <div className="bg-gray-900 p-4 rounded-lg my-4">
              <pre className="text-red-400"><code>{`{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE"
}`}</code></pre>
            </div>
          </div>

          {/* Research Papers */}
          <div id="research-papers" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Research Papers & References</h5>
            
            <h3 className="text-3xl font-semibold mt-6 mb-4">Core Technologies</h3>
            
            <div className="space-y-4 my-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-blue-400">YOLO: You Only Look Once</h4>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Authors:</strong> Redmon, J., Divvala, S., Girshick, R., & Farhadi, A.
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Conference:</strong> CVPR 2016
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>DOI:</strong> <a href="https://arxiv.org/abs/1506.02640" className="text-blue-400 hover:underline">arXiv:1506.02640</a>
                </p>
                <p className="text-base md:text-lg">
                  Introduced the revolutionary YOLO architecture for real-time object detection, 
                  treating detection as a regression problem to spatially separated bounding boxes 
                  and associated class probabilities.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-pink-400">ArcFace: Additive Angular Margin Loss</h4>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Authors:</strong> Deng, J., Guo, J., Xue, N., & Zafeiriou, S.
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Conference:</strong> CVPR 2019
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>DOI:</strong> <a href="https://arxiv.org/abs/1801.07698" className="text-blue-400 hover:underline">arXiv:1801.07698</a>
                </p>
                <p className="text-base md:text-lg">
                  Proposed ArcFace loss function for deep face recognition, providing better 
                  discriminative power and improved performance on face recognition benchmarks.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-cyan-400">MediaPipe: A Framework for Building Perception Pipelines</h4>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Authors:</strong> Lugaresi, C., Tang, J., Nash, H., et al.
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Conference:</strong> CVPR 2019
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>DOI:</strong> <a href="https://arxiv.org/abs/1906.08172" className="text-blue-400 hover:underline">arXiv:1906.08172</a>
                </p>
                <p className="text-base md:text-lg">
                  Introduced MediaPipe, a framework for building multimodal applied machine learning 
                  pipelines, with specific focus on real-time hand tracking and gesture recognition.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400">DeepLabV3+: Encoder-Decoder with Atrous Separable Convolution</h4>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Authors:</strong> Chen, L. C., Zhu, Y., Papandreou, G., et al.
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>Conference:</strong> ECCV 2018
                </p>
                <p className="text-base md:text-lg text-gray-300 mb-2">
                  <strong>DOI:</strong> <a href="https://arxiv.org/abs/1802.02611" className="text-blue-400 hover:underline">arXiv:1802.02611</a>
                </p>
                <p className="text-base md:text-lg">
                  Extended DeepLabV3 with a simple yet effective decoder module to refine the 
                  segmentation results, especially along object boundaries.
                </p>
              </div>
            </div>

            <h3 className="text-3xl font-semibold mt-6 mb-4">Additional References</h3>
            <ul className="space-y-2">
              <li>
                <strong>COCO Dataset:</strong> 
                <a href="https://arxiv.org/abs/1405.0312" className="text-blue-400 hover:underline ml-2">Lin et al., ECCV 2014</a>
              </li>
              <li>
                <strong>Pascal VOC:</strong> 
                <a href="http://host.robots.ox.ac.uk/pascal/VOC/" className="text-blue-400 hover:underline ml-2">Everingham et al., IJCV 2010</a>
              </li>
              <li>
                <strong>ResNet Architecture:</strong> 
                <a href="https://arxiv.org/abs/1512.03385" className="text-blue-400 hover:underline ml-2">He et al., CVPR 2016</a>
              </li>
              <li>
                <strong>InsightFace:</strong> 
                <a href="https://github.com/deepinsight/insightface" className="text-blue-400 hover:underline ml-2">Deng et al., GitHub</a>
              </li>
            </ul>
          </div>

          {/* FAQ */}
          <div id="faq" className="mt-12">
            <h5 className="text-5xl font-semibold mt-6 mb-4">Frequently Asked Questions</h5>
            
            <div className="space-y-6 my-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-blue-400">What image formats are supported?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  We support JPEG, PNG, BMP, and WebP formats. For best results, use high-resolution 
                  images (minimum 640x640 pixels) with good lighting and contrast.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-green-400">What are the system requirements?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  <strong>Minimum:</strong> Python 3.11+, Node.js 16+, 4GB RAM, WebGL-capable browser<br/>
                  <strong>Recommended:</strong> 8GB+ RAM, GPU with CUDA support, modern multi-core CPU
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-purple-400">How accurate are the AI models?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  <strong>Object Detection:</strong> 37.3% mAP@0.5 on COCO dataset<br/>
                  <strong>Facial Recognition:</strong> 99.4% accuracy on LFW benchmark<br/>
                  <strong>Gesture Control:</strong> 95%+ landmark detection accuracy<br/>
                  <strong>Image Segmentation:</strong> 42.1% mIoU on COCO validation set
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-yellow-400">Is my data secure and private?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  Yes, all image processing is done in-memory and images are not permanently stored 
                  on our servers. Temporary files are automatically cleaned up after processing. 
                  We do not collect or store personal data.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-red-400">Can I run this on my own server?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  Absolutely! This is an open-source project. You can deploy it on any server 
                  with the required dependencies. See the installation section for detailed setup instructions.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-cyan-400">How can I contribute to this project?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  We welcome contributions! You can contribute by reporting bugs, suggesting features, 
                  improving documentation, or submitting pull requests. Check our GitHub repository 
                  for contribution guidelines.
                </p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-orange-400">What's the difference between object detection and segmentation?</h4>
                <p className="text-base md:text-lg text-gray-300">
                  <strong>Object Detection:</strong> Identifies objects and draws bounding boxes around them<br/>
                  <strong>Image Segmentation:</strong> Classifies each pixel, creating precise masks for objects<br/>
                  Segmentation provides more detailed information but is computationally more expensive.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
