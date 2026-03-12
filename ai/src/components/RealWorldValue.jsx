import { motion } from "framer-motion";
import smartSurveillance from "../assets/images/smart_surveillance.jpeg";
import attendanceAutomation from "../assets/images/attendance_automation.jpeg";
import gestureControlledInterfaces from "../assets/images/gesture_controlled_interfaces.jpeg";

const values = [
  {
    title: "Smart Surveillance",
    desc: "Detect objects and people in real-time to enhance security monitoring with advanced AI-powered object detection and tracking capabilities.",
    img: smartSurveillance,
  },
  {
    title: "Attendance Automation",
    desc: "Use facial recognition to mark employee or student attendance instantly with high accuracy and automated reporting systems.",
    img: attendanceAutomation,
  },
  {
    title: "Gesture-Controlled Interfaces",
    desc: "Enable touchless control for kiosks, healthcare, and AR/VR apps through intuitive hand gesture recognition technology.",
    img: gestureControlledInterfaces,
  },
];

export default function RealWorldValue() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
          Real-World Value
        </h2>

        <div className="space-y-20">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row items-center gap-10 ${
                i % 2 !== 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image / Demo Preview */}
              <div className="flex-1">
                <img
                  src={v.img}
                  alt={v.title}
                  className="rounded-2xl shadow-lg shadow-blue-500/20 border border-gray-800"
                />
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-4">{v.title}</h3>
                <p className="text-gray-400 leading-relaxed text-base md:text-lg">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
