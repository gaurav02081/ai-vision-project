import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "./Footer";

export default function FacialRecognitionPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = () => {};
  const handleDownload = () => {};

  return (
    <div className={`${darkMode ? "dark-mode" : ""} w-full min-h-screen bg-[#0b0f14] text-gray-100 relative px-2 sm:px-3`}>
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>
        <div className="text-xl font-semibold text-white tracking-wide">FACIAL RECOGNITION</div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10">Home</Link>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400 mr-3">Theme</span>
            <label className="inline-flex relative items-center cursor-pointer select-none" aria-label="Toggle dark mode">
              <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <div className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-500/40">
                <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow flex items-center justify-center transition-transform duration-300 peer-checked:translate-x-6">
                  {darkMode ? (
                    <svg aria-hidden="true" className="h-3.5 w-3.5 text-[#111827]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                  ) : (
                    <svg aria-hidden="true" className="h-3.5 w-3.5 text-[#111827]" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-1v3h1zm0 19v-3h-1v3h1zM4 13H1v-1h3v1zm19 0h-3v-1h3v1zM6.76 19.16l-1.42 1.42-1.79-1.8 1.41-1.41 1.8 1.79zM20.24 4.84l-1.4-1.4-1.8 1.79 1.41 1.41 1.79-1.8zM12 7a5 5 0 100 10 5 5 0 000-10z" /></svg>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6 mt-8">
        <aside className="col-span-2">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Features</h2>
          <nav className="space-y-1">
            <Link to="/features/object-detection" className={`block px-3 py-2 rounded-md ${isActive('/features/object-detection') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>Object Detection</Link>
            <Link to="/features/facial-recognition" className={`block px-3 py-2 rounded-md ${isActive('/features/facial-recognition') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>Facial Recognition</Link>
            <Link to="/features/gesture-control" className={`block px-3 py-2 rounded-md ${isActive('/features/gesture-control') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>Gesture Control</Link>
            <Link to="/features/image-segmentation" className={`block px-3 py-2 rounded-md ${isActive('/features/image-segmentation') ? 'bg-gray-800 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>Image Segmentation</Link>
          </nav>
        </aside>

        <section className={`${showInfo ? 'col-span-7' : 'col-span-10'} p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300`}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-blue-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-blue-400 tracking-wider text-center">VIDEO</h3>
              <div className="bg-gray-900 rounded-lg h-48" />
            </div>
            <div className="border-2 border-green-500 rounded-xl p-4 shadow-lg bg-black/20">
              <h3 className="font-bold text-xl mb-3 text-green-400 tracking-wider text-center">PROCESSED</h3>
              <div className="bg-gray-900 rounded-lg h-48" />
            </div>
          </div>
        </section>

        {showInfo && (
          <aside className="col-span-3 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md transition-all duration-300">Feature Info</aside>
        )}
      </main>

      <Footer />
    </div>
  );
}


