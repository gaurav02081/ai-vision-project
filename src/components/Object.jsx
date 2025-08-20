import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "./Footer";
import apiService from "../services/apiService";
import { useAuth } from "../context/AuthContext";

export default function FeaturesPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Upload handler
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    try {
      setProcessingStatus('uploading');
      setError(null);

      // Upload file
      await apiService.uploadFile(sessionId, file);
      setProcessingStatus('processing');

      // Start object detection processing
      await apiService.processObjectDetection(sessionId);

      // Poll for results
      pollForResults();

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message);
      setProcessingStatus('error');
    }
  };

  const pollForResults = async () => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await apiService.getSessionStatus(sessionId);
        
        if (status.status === 'completed') {
          const results = await apiService.getSessionResults(sessionId);
          setResults(results);
          setProcessingStatus('completed');
        } else if (status.status === 'failed') {
          setError('Processing failed');
          setProcessingStatus('error');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000); // Poll every second
        } else {
          setError('Processing timeout');
          setProcessingStatus('error');
        }
      } catch (error) {
        setError(error.message);
        setProcessingStatus('error');
      }
    };

    poll();
  };

  // Submit feedback
  const handleFeedbackSubmit = async (feedbackText) => {
    try {
      await apiService.submitFeedback({
        demo_type: 'object_detection',
        message: feedbackText,
        rating: 5, // You can add a rating system
      });
      // Show success message
    } catch (error) {
      setError('Failed to submit feedback');
    }
  };

  // Download handler
  const handleDownload = async () => {
    if (!results?.result_file) {
      setError('No results to download');
      return;
    }

    try {
      const response = await fetch(results.result_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "object-detection-result.jpg";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError('Download failed');
    }
  };

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Initialize demo session
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const session = await apiService.createDemoSession('object_detection');
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Failed to initialize demo session');
    }
  };

  return (
    <div
      className={`${
        darkMode ? "dark-mode" : ""
      } w-full min-h-screen bg-[#0b0f14] text-gray-100 relative px-2 sm:px-3`}
    >
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>

        {/* Center Title */}
        <div className="text-xl font-semibold text-white tracking-wide">
          OBJECT DETECTION
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
            Home
          </Link>
          {user && (
            <span className="text-sm text-gray-400">
              Welcome, {user.username}
            </span>
          )}
          {/* Dark Mode Toggle */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400 mr-3">Theme</span>
            <label
              className="inline-flex relative items-center cursor-pointer select-none"
              aria-label="Toggle dark mode"
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-500/40">
                <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow flex items-center justify-center transition-transform duration-300 peer-checked:translate-x-6">
                  {darkMode ? (
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-[#111827]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-[#111827]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-1v3h1zm0 19v-3h-1v3h1zM4 13H1v-1h3v1zm19 0h-3v-1h3v1zM6.76 19.16l-1.42 1.42-1.79-1.8 1.41-1.41 1.8 1.79zM20.24 4.84l-1.4-1.4-1.8 1.79 1.41 1.41 1.79-1.8zM12 7a5 5 0 100 10 5 5 0 000-10z" />
                    </svg>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Status Display */}
      {processingStatus !== 'idle' && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-blue-400">
            Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="grid grid-cols-12 gap-6 mt-8">
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
            showInfo ? "col-span-7" : "col-span-10"
          } p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300`}
        >
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Input */}
            <div className="border-2 border-blue-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-blue-400 tracking-wider text-center">
                INPUT
              </h3>
              <div className="bg-gray-900 rounded-lg h-48 relative group">
                {results?.input_image ? (
                  <img
                    alt="Input image"
                    className="w-full h-full object-cover rounded-lg"
                    src={results.input_image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Upload an image to start
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="border-2 border-green-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-green-400 tracking-wider text-center">
                RESULTS
              </h3>
              <div className="bg-gray-900 rounded-lg h-48">
                {results?.result_image ? (
                  <img
                    alt="Processed result"
                    className="w-full h-full object-cover rounded-lg"
                    src={results.result_image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Processing results will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-4 text-sm">
            <button
              onClick={handleUploadClick}
              disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                processingStatus === 'uploading' || processingStatus === 'processing'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white`}
            >
              <span className="material-icons">upload</span>
              <span>
                {processingStatus === 'uploading' ? 'Uploading...' : 
                 processingStatus === 'processing' ? 'Processing...' : 'Upload Image'}
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
            {results?.result_file && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition"
              >
                <span className="material-icons">download</span>
                <span>Download Result</span>
              </button>
            )}
          </div>

          {/* Results Display */}
          {results?.detections && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-200 mb-2">Detected Objects:</h4>
              <div className="grid grid-cols-2 gap-2">
                {results.detections.map((detection, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    <span className="font-medium">{detection.class}:</span> {Math.round(detection.confidence * 100)}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Box */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-200 mb-2">Provide Feedback</h4>
            <textarea
              id="feedback-text"
              className="w-full bg-[#111827] border border-gray-700 rounded-md p-2 text-gray-100 placeholder-gray-500 focus:ring-[#00C2FF] focus:border-[#00C2FF]"
              placeholder="Tell us what you think..."
              rows="3"
            ></textarea>
            <button 
              onClick={() => {
                const feedbackText = document.getElementById('feedback-text').value;
                if (feedbackText.trim()) {
                  handleFeedbackSubmit(feedbackText);
                  document.getElementById('feedback-text').value = '';
                }
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f172a] focus:ring-blue-500"
            >
              Submit Feedback
            </button>
          </div>
        </section>

        {/* Right Panel - Collapsible */}
        {showInfo && (
          <aside className="col-span-3 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300">
            <div
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setShowInfo(!showInfo)}
            >
              <h3 className="text-xl font-semibold text-gray-100">Feature Info</h3>
              <span className="material-icons text-gray-400">
                {showInfo ? "Collapse" : "expand_more"}
              </span>
          </div>

          <div>
              <h4 className="font-semibold text-gray-200 mb-1">Algorithm Name</h4>
              <p className="text-sm text-gray-400 mb-4">
              Based on strongly it considers the meaning of computer vision
            </p>
              <h4 className="font-semibold text-gray-200 mb-1">
                Real-World Value
              </h4>
              <p className="text-sm text-gray-400 mb-6">
              Based on strongly it considers the meaning of computer vision
            </p>
              <div className="bg-[#0f172a] rounded-lg aspect-video flex items-center justify-center">
                <button className="bg-black/50 rounded-full p-3">
                  <span className="material-icons text-white text-3xl">
                    play_arrow
                  </span>
              </button>
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
            <span className="material-icons">Open</span>
          </button>
        )}
      </main>
      <Footer />
    </div>
  );
}
