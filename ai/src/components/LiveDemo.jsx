import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import demoVideo from "../assets/images/video.mp4";

export default function LiveDemo() {
  return (
    <section className="py-24 bg-black text-white relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-8"
        >
          Live Demo Preview
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-gray-400 max-w-2xl mx-auto mb-12 text-base md:text-lg"
        >
          Watch AI in action – see how real-time computer vision can transform
          industries from security to healthcare.
        </motion.p>

        {/* Video / Image Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-xl shadow-blue-500/30 border border-gray-800"
        >
          <video
            src={demoVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover"
            style={{ maxHeight: '1000px' }}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <Link
            to="/features/object-detection"
            className="inline-block px-8 py-4 rounded-2xl text-lg font-semibold bg-blue-500 hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/40 hover:shadow-blue-400/50"
          >
            Test It Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
