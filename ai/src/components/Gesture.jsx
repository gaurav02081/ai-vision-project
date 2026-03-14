import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import apiService from "../services/apiService";

export default function GestureControlPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [detectedGestures, setDetectedGestures] = useState([]);
  const [educationalInfo, setEducationalInfo] = useState({});
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(0);
  const [showEducationalPanel, setShowEducationalPanel] = useState(false);
  const [currentGesture, setCurrentGesture] = useState('No gesture detected');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const fpsRef = useRef({ frames: 0, lastTime: Date.now() });
  const location = useLocation();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);



  const startWebcam = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          // Set canvas size to match video
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };
      }
      
      setWebcamActive(true);
      startRecognitionLoop();
      
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Failed to access webcam. Please check permissions.');
    }
  };

  const stopWebcam = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Camera track stopped');
        });
        videoRef.current.srcObject = null;
      }
      
      setWebcamActive(false);
      setDetectedGestures([]);
      setFps(0);
      setCurrentGesture('No gesture detected');
      setError(null); // Clear any previous errors
      
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      
      console.log('Webcam stopped successfully');
    } catch (err) {
      console.error('Error stopping webcam:', err);
    }
  };

  const startRecognitionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        await captureAndProcess();
      }
    }, 200); // 5 FPS for better performance
  };

  const captureAndProcess = async () => {
    if (!videoRef.current) return;

    try {
      setIsProcessing(true);
      
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to base64
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Send to backend
      const results = await apiService.processGestureFrame(frameBase64);
      
      if (results.success) {
        setDetectedGestures(results.results.gestures || []);
        
        // Update current gesture
        if (results.results.gestures && results.results.gestures.length > 0) {
          const gesture = results.results.gestures[0];
          setCurrentGesture(`${gesture.emoji} ${gesture.name}`);
        } else {
          setCurrentGesture('No gesture detected');
        }
        
        // Draw landmarks and connections
        drawVisualizations(results.results);
        
        // Update FPS
        updateFPS();
      } else if (results.error) {
        // Handle MediaPipe errors gracefully
        console.warn('Gesture processing error:', results.error);
        if (results.error.includes('MediaPipe') || results.error.includes('pthread')) {
          console.warn('MediaPipe error detected, stopping camera to prevent server crash');
          stopWebcam();
          setError('MediaPipe error detected. Camera stopped to prevent server issues.');
        }
      }
      
    } catch (err) {
      console.error('Processing error:', err);
      // Don't set error for individual frame failures
    } finally {
      setIsProcessing(false);
    }
  };


  const drawVisualizations = (results) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw hand landmarks
    if (showLandmarks && results.hands) {
      drawHandLandmarks(ctx, results.hands);
    }
    
    // Draw connections
    if (showConnections && results.hands) {
      drawHandConnections(ctx, results.hands);
    }
    
  };

  const drawHandLandmarks = (ctx, handsData) => {
    handsData.forEach((hand, handIndex) => {
      // Updated color coding to match corrected handedness
      const color = hand.handedness === 'Left' ? '#00ffff' : '#ff00ff';
      
      hand.landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvasRef.current.width;
        const y = landmark.y * canvasRef.current.height;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw hand label
        if (index === 0) { // Wrist landmark
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.fillText(`${hand.handedness} Hand`, x + 6, y - 6);
        }
      });
    });
  };

  const drawHandConnections = (ctx, handsData) => {
    // Define hand connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];
    
    handsData.forEach((hand) => {
      // Updated color coding to match corrected handedness
      const color = hand.handedness === 'Left' ? '#00ffff' : '#ff00ff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      connections.forEach(([startIdx, endIdx]) => {
        if (startIdx < hand.landmarks.length && endIdx < hand.landmarks.length) {
          const start = hand.landmarks[startIdx];
          const end = hand.landmarks[endIdx];
          
          const startX = start.x * canvasRef.current.width;
          const startY = start.y * canvasRef.current.height;
          const endX = end.x * canvasRef.current.width;
          const endY = end.y * canvasRef.current.height;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
    });
  };


  const updateFPS = () => {
    fpsRef.current.frames++;
    const now = Date.now();
    if (now - fpsRef.current.lastTime >= 1000) {
      setFps(Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime)));
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDetectedGestures([]);
    setCurrentGesture('No gesture detected');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className={`${
        darkMode ? "dark-mode" : ""
      } w-full min-h-screen bg-[#0b0f14] text-gray-100 relative px-2 sm:px-3 flex flex-col`}
    >
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>

        {/* Center Title */}
        <div className="text-xl font-semibold text-white tracking-wide">
          GESTURE CONTROL
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
            Home
          </Link>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="grid grid-cols-12 gap-6 mt-8 flex-1">
        {/* Sidebar */}
        <aside className="col-span-2">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Features</h2>
          <nav className="space-y-1">
            <Link
              to="/features/object-detection"
              className={`block px-3 py-2 rounded-md ${isActive('/features/object-detection') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Object Detection
            </Link>
            <Link
              to="/features/facial-recognition"
              className={`block px-3 py-2 rounded-md ${isActive('/features/facial-recognition') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Facial Recognition
            </Link>
            <Link
              to="/features/gesture-control"
              className={`block px-3 py-2 rounded-md ${isActive('/features/gesture-control') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Gesture Control
            </Link>
            <Link
              to="/features/image-segmentation"
              className={`block px-3 py-2 rounded-md ${isActive('/features/image-segmentation') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Image Segmentation
            </Link>
          </nav>
        </aside>

        {/* Main Video + Controls */}
        <section
          className={`${
            showEducationalPanel ? "col-span-7" : "col-span-10"
          } p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300`}
        >
          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-4 text-sm">
            {!webcamActive ? (
              <button
                onClick={startWebcam}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition"
              >
                Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={stopWebcam}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"
                >
                  Stop Camera
                </button>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition"
                >
                  Clear
                </button>
              </>
            )}
            {webcamActive && (
              <>
                <button
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`px-4 py-2 rounded-md transition ${
                    showLandmarks ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {showLandmarks ? 'Hide' : 'Show'} Landmarks
                </button>
                <button
                  onClick={() => setShowConnections(!showConnections)}
                  className={`px-4 py-2 rounded-md transition ${
                    showConnections ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {showConnections ? 'Hide' : 'Show'} Connections
                </button>
              </>
            )}
          </div>

          {/* Current Gesture Display */}
          <div className="mb-4 p-4 bg-[#0f172a] border border-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {currentGesture}
              </div>
              <div className="text-sm text-gray-400">
                FPS: {fps} | Hands: {detectedGestures.length > 0 ? detectedGestures[0].handedness : 'None'}
              </div>
            </div>
          </div>

          {/* Single Camera Feed Box */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden h-96">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!webcamActive ? 'hidden' : ''}`}
              />
              <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!webcamActive ? 'hidden' : ''}`}
              />
              {!webcamActive && (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">✋</div>
                    <div>Camera feed will appear here</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel - Collapsible */}
        {showEducationalPanel && (
          <aside className="col-span-3 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300">
            <div
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setShowEducationalPanel(!showEducationalPanel)}
            >
              <h3 className="text-xl font-semibold text-gray-100">Feature Info</h3>
              <span className="material-icons text-gray-400">
                {showEducationalPanel ? "Collapse" : "expand_more"}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Algorithm Name</h4>
              <p className="text-sm text-gray-400 mb-4">
                MediaPipe Hands - Real-time hand tracking and gesture recognition using 21 landmarks per hand
              </p>
              <h4 className="font-semibold text-gray-200 mb-1">
                Real-World Value
              </h4>
              <p className="text-sm text-gray-400 mb-6">
                Enables touchless interaction, sign language recognition, virtual reality controls, and accessibility applications
              </p>
              <div className="bg-[#0f172a] rounded-lg aspect-video overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/0wUT5X2CRkw?si=fG7UvVYwwDUCSA4z" 
                  title="Gesture Control Demo" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </aside>
        )}

        {/* Collapse Button (when hidden) */}
        {!showEducationalPanel && (
          <button
            onClick={() => setShowEducationalPanel(true)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#111827] border border-gray-700 px-2 py-1 rounded-l-md text-gray-400 hover:text-white"
          >
            <span className="material-icons">Open</span>
          </button>
        )}
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}