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
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:flex items-center space-x-8"
        >
          {/* Dropdown for Features */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/20 text-white font-medium hover:bg-white/10 hover:text-[#00C2FF] transition-colors duration-300"
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
                  className="absolute mt-2 py-2 w-56 text-white bg-transparent"
                >
                  <Link to="/features/object-detection" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF]">OBJECT DETECTION</Link>
                  <Link to="/features/facial-recognition" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF]">FACIAL RECOGNITION</Link>
                  <Link to="/features/gesture-control" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF]">GESTURE CONTROL</Link>
                  <Link to="/features/image-segmentation" onClick={() => setOpen(false)} className="block px-4 py-2 transition-colors hover:text-[#00C2FF]">IMAGE SEGMENTATION</Link>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/" className="text-white hover:text-[#00C2FF] transition-colors duration-300">
            HOME
          </Link>
          <Link to="/docs" className="text-white hover:text-[#00C2FF] transition-colors duration-300">
            DOCS
          </Link>
          <Link to="/contact" className="text-white hover:text-[#00C2FF] transition-colors duration-300">
            CONTACT US
          </Link>
          <button className="px-6 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/80 transition-all duration-300 hover:scale-105">
            TRY IT NOW
          </button>
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
