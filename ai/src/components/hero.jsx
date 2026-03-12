import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";

export default function Hero() {
  const navigate = useNavigate();

  const handleExploreFeatures = () => {
    // Scroll to features section on home page
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on home page, navigate to home and then scroll
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById('features');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleTryLiveDemo = () => {
    navigate('/features/object-detection');
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter brightness-125 contrast-110 saturate-125"
      >
        <source src="/assets/riyadh-city.858bc0e5 (1).mp4" type="video/mp4" />
      </video>

      {/* Navbar */}
      <Navbar />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-bold text-white"
        >
          See the Unseen with AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mt-4 text-xl md:text-2xl text-gray-300 max-w-2xl"
        >
          Real-time Computer Vision Demos, powered by OpenCV, YOLO, and DeepFace.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="mt-8 flex gap-4"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleExploreFeatures}
            className="px-6 py-3 rounded-md border border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Explore Features
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleTryLiveDemo}
            className="px-6 py-3 rounded-md bg-[#00C2FF] text-black font-medium hover:bg-[#00A9DB] transition-colors"
          >
            Try Live Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
