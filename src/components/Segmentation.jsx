import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "./Footer";

export default function ImageSegmentationPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${darkMode ? "dark-mode" : ""} w-full min-h-screen bg-[#0b0f14] text-gray-100 relative px-2 sm:px-3`}>
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>
        <div className="text-xl font-semibold text-white tracking-wide">IMAGE SEGMENTATION</div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10">Home</Link>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400 mr-3">Theme</span>
            <label className="inline-flex relative items-center cursor-pointer select-none">
              <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <div className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors peer-checked:bg-blue-600" />
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
            <div className="border-2 border-blue-500 rounded-xl p-4 shadow-lg bg-black/20 h-48" />
            <div className="border-2 border-green-500 rounded-xl p-4 shadow-lg bg-black/20 h-48" />
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


