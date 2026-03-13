import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-2xl font-bold text-white"
        >
          AI VISION LAB
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: -96 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:flex items-center space-x-8"
        >
          <Link to="/" className="text-white hover:text-[#00C2FF] transition-colors duration-300 text-lg font-semibold">
            HOME
          </Link>
          <Link to="/docs" className="text-white hover:text-[#00C2FF] transition-colors duration-300 text-lg font-semibold">
            DOCS
          </Link>
          {/* Dropdown for Features */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/20 text-white font-semibold hover:bg-white/10 hover:text-[#00C2FF] transition-colors duration-300 text-lg"
            >
              FEATURES
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute mt-2 py-2 w-64 text-white bg-black/80 backdrop-blur-sm rounded-lg border border-white/10"
                >
                  {/* Computer Vision */}
                  <div className="px-4 py-1 text-xs font-bold text-[#00C2FF]/70 uppercase tracking-wider">Computer Vision</div>
                  <Link to="/features/object-detection" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF] hover:bg-white/5">Object Detection</Link>
                  <Link to="/features/facial-recognition" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF] hover:bg-white/5">Facial Recognition</Link>
                  <Link to="/features/gesture-control" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF] hover:bg-white/5">Gesture Control</Link>
                  <Link to="/features/image-segmentation" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF] hover:bg-white/5">Image Segmentation</Link>

                  <div className="my-1 border-t border-white/10" />

                  {/* Simulation & Analytics */}
                  <div className="px-4 py-1 text-xs font-bold text-emerald-400/70 uppercase tracking-wider">Simulation</div>
                  <Link to="/features/monte-carlo" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-emerald-400 hover:bg-white/5">Quant Simulations</Link>

                  <div className="my-1 border-t border-white/10" />

                  {/* AI Learning */}
                  <div className="px-4 py-1 text-xs font-bold text-purple-400/70 uppercase tracking-wider">AI Learning</div>
                  <Link to="/features/student-performance-predictor" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-purple-400 hover:bg-white/5">Student Predictor</Link>
                  <Link to="/features/neural-network-training-lab" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-purple-400 hover:bg-white/5">Neural Network Lab</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="md:hidden text-white text-2xl"
        >
          ☰
        </motion.button>
      </div>
    </nav>
  );
}
