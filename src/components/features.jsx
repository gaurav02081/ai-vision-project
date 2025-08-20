import { motion } from "framer-motion";
import { Cpu, Eye, Camera } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Real-Time AI",
    desc: "Experience blazing fast inference powered by YOLO & OpenCV.",
  },
  {
    icon: Eye,
    title: "Facial Recognition",
    desc: "Seamless identification with DeepFace integration.",
  },
  {
    icon: Camera,
    title: "Gesture Control",
    desc: "Interact naturally through AI-powered gesture recognition.",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
          Features
        </h2>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <f.icon className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
