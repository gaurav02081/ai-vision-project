import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cpu, Eye, Camera, Scan, BarChart3, GraduationCap, BrainCircuit } from "lucide-react";

const sections = [
  {
    title: "Computer Vision",
    color: "blue",
    borderColor: "border-blue-500",
    shadowColor: "hover:shadow-blue-500/30",
    labelColor: "text-blue-400",
    features: [
      {
        icon: Cpu,
        title: "Object Detection",
        desc: "Real-time object detection powered by YOLOv8 with 80+ class recognition.",
        link: "/features/object-detection",
      },
      {
        icon: Eye,
        title: "Facial Recognition",
        desc: "Face detection & identification using InsightFace with live webcam support.",
        link: "/features/facial-recognition",
      },
      {
        icon: Camera,
        title: "Gesture Control",
        desc: "Hand tracking & gesture recognition with MediaPipe for touchless interaction.",
        link: "/features/gesture-control",
      },
      {
        icon: Scan,
        title: "Image Segmentation",
        desc: "Pixel-level semantic segmentation using DeepLabV3+ with colored mask visualization.",
        link: "/features/image-segmentation",
      },
    ],
  },
  {
    title: "Simulation & Analytics",
    color: "emerald",
    borderColor: "border-emerald-500",
    shadowColor: "hover:shadow-emerald-500/30",
    labelColor: "text-emerald-400",
    features: [
      {
        icon: BarChart3,
        title: "Quant Simulations",
        desc: "Probabilistic price modeling with Geometric Brownian Motion, 3D visualization, sensitivity analysis, and risk metrics.",
        link: "/features/monte-carlo",
      },
    ],
  },
  {
    title: "AI Learning",
    color: "purple",
    borderColor: "border-purple-500",
    shadowColor: "hover:shadow-purple-500/30",
    labelColor: "text-purple-400",
    features: [
      {
        icon: GraduationCap,
        title: "Student Performance Predictor",
        desc: "ML-powered academic outcome prediction using Logistic Regression trained on student behavior data.",
        link: "/features/student-performance-predictor",
      },
      {
        icon: BrainCircuit,
        title: "Neural Network Lab",
        desc: "Interactive 3D neural network training visualizer with live backpropagation on XOR problem.",
        link: "/features/neural-network-training-lab",
      },
    ],
  },
];

const colorMap = {
  blue: {
    icon: "text-blue-400",
    border: "hover:border-blue-500",
    shadow: "hover:shadow-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  emerald: {
    icon: "text-emerald-400",
    border: "hover:border-emerald-500",
    shadow: "hover:shadow-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  purple: {
    icon: "text-purple-400",
    border: "hover:border-purple-500",
    shadow: "hover:shadow-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
};

export default function Features() {
  return (
    <section id="features" className="py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
          Features
        </h2>
        <p className="text-gray-400 text-center text-lg mb-16 max-w-2xl mx-auto">
          Explore AI-powered tools across computer vision, financial simulation, and machine learning.
        </p>

        <div className="space-y-16">
          {sections.map((section, sIdx) => {
            const colors = colorMap[section.color];
            return (
              <div key={section.title}>
                {/* Section Label */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${colors.badge}`}>
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gray-800" />
                </motion.div>

                {/* Feature Cards */}
                <div className={`grid gap-6 ${section.features.length === 1 ? 'md:grid-cols-1 max-w-xl' : section.features.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                  {section.features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Link
                        to={f.link}
                        className={`block p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 ${colors.border} ${colors.shadow} hover:shadow-lg transition-all h-full`}
                      >
                        <f.icon className={`w-10 h-10 ${colors.icon} mb-4`} />
                        <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
