import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "./Footer";
import apiService from "../services/apiService";

export default function ImageSegmentationPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setProcessingStatus('processing');
    setError(null);

    try {
      // Direct processing - no session required
      const results = await apiService.directImageSegmentation(file);
      setResults(results);
      setProcessingStatus('completed');

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      setProcessingStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!results?.result_image_url) {
      setError('No results to download');
      return;
    }

    try {
      const response = await fetch(results.result_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "image-segmentation-result.jpg";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError('Download failed');
    }
  };

  // Handle image modal
  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showImageModal) {
        handleCloseModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

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
          IMAGE SEGMENTATION
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

      {/* Status Display */}
      {processingStatus !== 'idle' && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-blue-400">
            Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
          </p>
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
                {uploadedFile ? (
                  <>
                    <img
                      alt="Input image"
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      src={URL.createObjectURL(uploadedFile)}
                      onClick={() => handleImageClick(URL.createObjectURL(uploadedFile))}
                    />
                    {/* Zoom overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="bg-white bg-opacity-20 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </>
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
              <div className="bg-gray-900 rounded-lg h-48 relative group">
                {results?.result_image_url ? (
                  <>
                    <img
                      alt="Processed result"
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      src={`${results.result_image_url}?t=${Date.now()}`}
                      onClick={() => handleImageClick(results.result_image_url)}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        setError(`Failed to load result image.`);
                      }}
                    />
                    {/* Zoom overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="bg-white bg-opacity-20 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </>
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
              disabled={processingStatus === 'processing'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                processingStatus === 'processing'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white`}
            >
              <span className="material-icons">upload</span>
              <span>
                {processingStatus === 'processing' ? 'Processing...' : 'Upload Image'}
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
            {results?.result_image_url && (
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
          {results?.segments && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-200 mb-2">Detected Segments:</h4>
              <div className="grid grid-cols-2 gap-2">
                {results.segments.map((segment, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    <span className="font-medium">{segment.label}:</span> {Math.round(segment.confidence * 100)}%
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Description */}
          {results?.ai_description && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-400 mb-2">AI Description</h4>
              <p className="text-gray-300 text-sm">{results.ai_description}</p>
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
              <span className="material-icons text-gray-400">
                {showInfo ? "Collapse" : "expand_more"}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Algorithm Name</h4>
              <p className="text-sm text-gray-400 mb-4">
                DeepLabV3+ - Advanced semantic segmentation using atrous convolution and spatial pyramid pooling
              </p>
              <h4 className="font-semibold text-gray-200 mb-1">
                Real-World Value
              </h4>
              <p className="text-sm text-gray-400 mb-6">
                Enables medical imaging analysis, autonomous vehicle navigation, robotics object manipulation, and photo editing applications
              </p>
              <div className="bg-[#0f172a] rounded-lg aspect-video overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/hEdQAhuYO3A?si=V5cchpIfeGTe5qgC" 
                  title="Image Segmentation Demo" 
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
            <span className="material-icons">Open</span>
          </button>
        )}
      </main>
      
      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img
              src={modalImageUrl}
              alt="Full size view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
              Click outside or press ESC to close
            </div>
          </div>
        </div>
      )}

      <Footer className="mt-auto" />
    </div>
  );
}


