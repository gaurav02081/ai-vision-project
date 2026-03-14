import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "./Footer";
import apiService from "../services/apiService";

export default function StudentPredictorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    study_hours: 5,
    attendance: 75,
    gpa: 3.0,
    assignments: 70,
    sleep_hours: 7,
  });

  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiService.predictStudentPerformance({
        study_hours: Number(form.study_hours),
        attendance: Number(form.attendance),
        gpa: Number(form.gpa),
        assignments: Number(form.assignments),
        sleep_hours: Number(form.sleep_hours),
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "study_hours", label: "Study Hours / Day", min: 0, max: 16, step: 0.5, unit: "hrs" },
    { key: "attendance", label: "Attendance %", min: 0, max: 100, step: 1, unit: "%" },
    { key: "gpa", label: "Previous GPA", min: 0, max: 4, step: 0.1, unit: "/4.0" },
    { key: "assignments", label: "Assignments Completed", min: 0, max: 100, step: 1, unit: "%" },
    { key: "sleep_hours", label: "Sleep Hours", min: 0, max: 14, step: 0.5, unit: "hrs" },
  ];

  const isPassing = result?.prediction === "PASS";

  return (
    <div className="w-full min-h-screen bg-[#0b0f14] text-gray-100 px-2 sm:px-3 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center py-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Vision Lab</h1>
          <p className="text-gray-400">Real-Time Computer Vision in Action</p>
        </div>
        <div className="text-xl font-semibold text-white tracking-wide">
          STUDENT PERFORMANCE PREDICTOR
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md border border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
            Home
          </Link>
        </div>
      </header>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <main className="grid grid-cols-12 gap-6 mt-8 flex-1">
        {/* Sidebar */}
        <aside className="col-span-2">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Features</h2>
          <nav className="space-y-1">
            {[
              { path: "/features/object-detection", label: "Object Detection" },
              { path: "/features/facial-recognition", label: "Facial Recognition" },
              { path: "/features/gesture-control", label: "Gesture Control" },
              { path: "/features/image-segmentation", label: "Image Segmentation" },
              { path: "/features/monte-carlo", label: "Monte Carlo Sim" },
              { path: "/features/student-performance-predictor", label: "Student Predictor" },
              { path: "/features/neural-network-training-lab", label: "Neural Network Lab" },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md ${
                  isActive(item.path)
                    ? "bg-gray-800 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Panel */}
        <section className="col-span-7 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Student Success Predictor</h2>
            <p className="text-gray-400 text-sm mb-6">
              This machine learning model uses Logistic Regression trained on student behavior data
              to predict academic outcomes. Enter study habits below and see if the model predicts
              PASS or FAIL.
            </p>

            <form onSubmit={handlePredict} className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-gray-400">{f.label}</label>
                    <span className="text-sm text-cyan-400 font-mono">
                      {form[f.key]} {f.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={form[f.key]}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                    <span>{f.min}</span>
                    <span>{f.max}</span>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition ${
                  loading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white"
                }`}
              >
                {loading ? "Predicting..." : "Predict Outcome"}
              </button>
            </form>

            {/* Result Card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className={`mt-8 rounded-xl p-6 border-2 ${
                    isPassing
                      ? "border-green-500/50 bg-green-900/15"
                      : "border-red-500/50 bg-red-900/15"
                  }`}
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                        isPassing ? "bg-green-500/20" : "bg-red-500/20"
                      }`}
                    >
                      <span className="text-4xl">{isPassing ? "✓" : "✗"}</span>
                    </motion.div>

                    <h3
                      className={`text-3xl font-bold mb-2 ${
                        isPassing ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {result.prediction}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Pass Probability</div>
                        <div className="text-2xl font-bold text-green-400">
                          {result.pass_probability}%
                        </div>
                      </div>
                      <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Fail Probability</div>
                        <div className="text-2xl font-bold text-red-400">
                          {result.fail_probability}%
                        </div>
                      </div>
                    </div>

                    {/* Probability Bar */}
                    <div className="mt-4">
                      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.pass_probability}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-green-500 to-cyan-400 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>FAIL</span>
                        <span>PASS</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Info Panel */}
        <aside className="col-span-3 p-6 rounded-lg border border-gray-800 bg-[#111827] shadow-md">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">How It Works</h3>

          <div className="space-y-4 text-sm text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Model</h4>
              <p>Logistic Regression (scikit-learn) trained on synthetic student behavior data with 500 samples.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Features Used</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Study hours per day</li>
                <li>Attendance percentage</li>
                <li>Previous semester GPA</li>
                <li>Assignment completion rate</li>
                <li>Average sleep hours</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">What is Logistic Regression?</h4>
              <p>A classification algorithm that estimates the probability of a binary outcome (PASS/FAIL) using a sigmoid function applied to a linear combination of input features.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Output</h4>
              <p>The model outputs a probability between 0% and 100%. Above 50% confidence maps to PASS, below to FAIL.</p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-800/30 rounded-lg p-3">
              <h4 className="font-semibold text-cyan-400 mb-1">Key Insight</h4>
              <p>GPA and study hours have the highest impact on prediction. Attendance and sleep quality contribute to overall model accuracy.</p>
            </div>
          </div>
        </aside>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
