import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-black text-gray-400 py-12 mt-24">
      {/* Neon divider */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-green-400 to-blue-500 animate-pulse"></div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Logo / Branding */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            AI<span className="text-blue-500">Vision</span>
          </h2>
          <p className="text-sm text-gray-500">
            See the unseen with real-time AI Computer Vision demos.
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <a href="#features" className="hover:text-blue-400 transition">
                Features
              </a>
            </li>
            <li>
              <a href="#demo" className="hover:text-blue-400 transition">
                Live Demo
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-blue-400 transition">
                Contact
              </a>
            </li>
          </ul>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-white font-semibold mb-4">Connect</h3>
          <div className="flex justify-center md:justify-start space-x-6 text-xl">
            <a href="https://github.com" className="hover:text-blue-400">
              <FaGithub />
            </a>
            <a href="https://linkedin.com" className="hover:text-blue-400">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com" className="hover:text-blue-400">
              <FaTwitter />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Copyright */}
      <div className="mt-12 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} AI Vision. All rights reserved.
      </div>
    </footer>
  );
}
