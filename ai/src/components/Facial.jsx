import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "./Footer";
import apiService from "../services/apiService";

export default function FacialRecognitionPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [personName, setPersonName] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, matched: 0, unknown: 0 });
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

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

  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!personName.trim()) {
      setError("Please enter a name for the person");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadedFile(file);

    try {
      // Register face and get session ID
      const result = await apiService.registerFace(file, personName.trim());
      setSessionId(result.session_id);
      console.log('Face registered successfully:', result);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to register face');
    } finally {
      setIsProcessing(false);
    }
  };

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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setWebcamActive(false);
    setRecognitionResults([]);
    setStats({ total: 0, matched: 0, unknown: 0 });
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const startRecognitionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        await captureAndRecognize();
      }
    }, 5000); // Every 5 seconds for free-tier API
  };

  const captureAndRecognize = async () => {
    if (!sessionId || !videoRef.current) return;

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to base64
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      // Send to backend
      const results = await apiService.recognizeFrame(sessionId, frameBase64);
      setRecognitionResults(results.faces);
      setStats({
        total: results.total_faces,
        matched: results.matched_faces,
        unknown: results.unknown_faces
      });
      
      // Draw bounding boxes
      drawBoundingBoxes(results.faces);
      
    } catch (err) {
      console.error('Recognition error:', err);
      // Don't set error for individual frame failures, just log them
    }
  };

  const drawBoundingBoxes = (faces) => {
    if (!canvasRef.current || !faces) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    faces.forEach(face => {
      const [x1, y1, x2, y2] = face.bbox;
      const width = x2 - x1;
      const height = y2 - y1;
      
      // Draw bounding box
      ctx.strokeStyle = face.is_match ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);
      
      // Draw label background
      ctx.fillStyle = face.is_match ? '#00ff00' : '#ff0000';
      const labelWidth = 150;
      const labelHeight = 30;
      ctx.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.fillText(
        `${face.name} (${(face.confidence * 100).toFixed(1)}%)`, 
        x1 + 5, 
        y1 - 10
      );
    });
  };

  return (
    <div className={`${darkMode ? "dark-mode" : ""} w-full min-h-screen bg-[#0b0f14] text-gray-100 relative px-2 sm:px-3 flex flex-col`}>
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>

        {/* Center Title */}
        <div className="text-xl font-semibold text-white tracking-wide">
          FACIAL RECOGNITION
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

        {/* Main Content Area */}
        <section className={`${showInfo ? "col-span-7" : "col-span-10"} p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300`}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Input Section */}
            <div className="border-2 border-blue-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-blue-400 tracking-wider text-center">
                REFERENCE IMAGE
              </h3>
              
              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Person's Name
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter person's name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing || webcamActive}
                />
              </div>

              {/* File Upload */}
              <div className="bg-gray-900 rounded-lg h-48 relative group">
                {uploadedFile ? (
                  <img
                    alt="Reference image"
                    className="w-full h-full object-cover rounded-lg"
                    src={URL.createObjectURL(uploadedFile)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Upload reference image
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                disabled={isProcessing || webcamActive || !personName.trim()}
                className={`w-full mt-4 px-4 py-2 rounded-md transition ${
                  isProcessing || webcamActive || !personName.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                } text-white`}
              >
                {isProcessing ? 'Processing...' : 'Upload Reference Image'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>

            {/* Webcam Section */}
            <div className="border-2 border-green-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-green-400 tracking-wider text-center">
                LIVE RECOGNITION
              </h3>
              
              {/* Webcam Feed */}
              <div className="bg-gray-900 rounded-lg h-48 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover rounded-lg ${!webcamActive ? 'hidden' : ''}`}
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute top-0 left-0 w-full h-full pointer-events-none ${!webcamActive ? 'hidden' : ''}`}
                />
                {!webcamActive && (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {sessionId ? 'Click Start Recognition' : 'Upload reference image first'}
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="mt-4 space-y-2">
                {!webcamActive ? (
                  <button
                    onClick={startWebcam}
                    disabled={!sessionId}
                    className={`w-full px-4 py-2 rounded-md transition ${
                      !sessionId
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-500'
                    } text-white`}
                  >
                    Start Recognition
                  </button>
                ) : (
                  <button
                    onClick={stopWebcam}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"
                  >
                    Stop Recognition
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recognition Stats */}
          {webcamActive && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-200 mb-2">Recognition Statistics:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                  <div className="text-gray-400">Total Faces</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.matched}</div>
                  <div className="text-gray-400">Recognized</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.unknown}</div>
                  <div className="text-gray-400">Unknown</div>
                </div>
              </div>
            </div>
          )}

          {/* Current Results */}
          {recognitionResults.length > 0 && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-200 mb-2">Current Frame Results:</h4>
              <div className="space-y-2">
                {recognitionResults.map((face, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${face.is_match ? 'text-green-400' : 'text-red-400'}`}>
                      {face.name}
                    </span>
                    <span className="text-gray-400">
                      Confidence: {(face.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Panel - Collapsible */}
        {showInfo && (
          <aside className="col-span-3 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300">
            <div
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setShowInfo(!showInfo)}
            >
              <h3 className="text-xl font-semibold text-gray-100">Feature Info</h3>
              <span className="material-icons">
                {showInfo ? "expand_less" : "expand_more"}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Real-Time Recognition</h4>
              <p className="text-sm text-gray-400 mb-4">
                Upload a reference image and use your webcam for live facial recognition. 
                The system will identify the person and mark unknown faces.
              </p>
              <h4 className="font-semibold text-gray-200 mb-1">How It Works</h4>
              <p className="text-sm text-gray-400 mb-6">
                1. Upload reference image with person's name<br/>
                2. Click "Start Recognition" to activate webcam<br/>
                3. System processes frames every 2 seconds<br/>
                4. Green boxes show recognized faces, red boxes show unknown faces
              </p>
              <div className="bg-[#0f172a] rounded-lg aspect-video overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/Wm1DucuQk70?si=h4ecU6UfOBF-S8fu" 
                  title="Facial Recognition Demo" 
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
        {!showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#111827] border border-gray-700 px-2 py-1 rounded-l-md text-gray-400 hover:text-white"
          >
            <span className="material-icons">chevron_left</span>
          </button>
        )}
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}