import { useState, useEffect } from "react";

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    "introduction",
    "getting-started",
    "features",
    "object-detection",
    "facial-recognition",
    "gesture-control",
    "api-reference",
    "faq",
  ];

  // Scroll-spy logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.unobserve(el);
    });
  }, []);

  return (
    <div
      className={`${darkMode ? "dark-mode" : ""} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 min-h-screen bg-[#121212] text-gray-200`}
    >
      {/* Header */}
     

      {/* Main */}
      <main className="grid grid-cols-12 gap-8 mt-8">
        {/* Sidebar */}
        <aside className="col-span-3 sticky top-24 self-start">
          <nav className="space-y-2">
            {sections.map((sec) => (
              <a
                key={sec}
                href={`#${sec}`}
                className={`block px-4 py-2 rounded-md ${
                  activeSection === sec
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {sec.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="col-span-9 p-6 bg-[#1E1E1E] rounded-lg shadow-md prose prose-invert max-w-none">
          {/* Introduction */}
          <div id="introduction">
            <h2>Introduction</h2>
            <p>
              AI Vision Lab offers high-performance real-time computer vision
              tools for developers and enthusiasts—covering tasks like object detection,
              facial recognition, and gesture control.
            </p>
            <p>
              Backed by the latest advancements in deep learning, this platform is optimized
              for ease of integration and speed.
            </p>
          </div>

          {/* Getting Started */}
          <div id="getting-started" className="mt-12">
            <h2>Getting Started</h2>
            <ol>
              <li><strong>Sign Up:</strong> Create your developer account.</li>
              <li><strong>API Key:</strong> Generate and securely store your key.</li>
              <li><strong>Experiment:</strong> Upload media and explore live model outputs.</li>
              <li>
                <strong>Integrate:</strong> Use our REST API. For example:
                <pre><code className="language-bash">{`curl -X POST https://api.aivisionlab.com/v1/detect \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{ "image_url": "https://example.com/img.jpg" }'`}</code></pre>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div id="features" className="mt-12">
            <h2>Features</h2>

            <div id="object-detection" className="mt-8">
              <h3>Object Detection</h3>
              <p>
                Leverage real-time, bounding-box-based detection powered by networks such as
                YOLO (<a href="https://arxiv.org/abs/1506.02640" className="text-blue-400">Redmon et al., 2015</a>) and
                EfficientDet (<a href="https://arxiv.org/abs/1911.09070" className="text-blue-400">Tan et al., 2019</a>).
              </p>
            </div>

            <div id="facial-recognition" className="mt-8">
              <h3>Facial Recognition</h3>
              <p>
                Powerful facial landmarking and identity matching under varied lighting and
                poses—commonly used in security and authentication systems.
              </p>
            </div>

            <div id="gesture-control" className="mt-8">
              <h3>Gesture Control</h3>
              <p>
                Human-friendly gesture interpretation—like “thumbs up”—for contactless UI control.
              </p>
            </div>
          </div>

          {/* API Reference */}
          <div id="api-reference" className="mt-12">
            <h2>API Reference</h2>
            <p>
              Our REST API uses JSON over HTTP with endpoints like:
            </p>
            <ul>
              <li><code>POST /v1/detect</code> — Object detection</li>
              <li><code>POST /v1/recognize/face</code> — Facial recognition</li>
              <li><code>POST /v1/recognize/gesture</code> — Gesture interpretation</li>
            </ul>
          </div>

          {/* FAQ */}
          <div id="faq" className="mt-12">
            <h2>FAQ</h2>
            <h4>Supported Formats?</h4>
            <p>JPEG, PNG, BMP. High-resolution images recommended.</p>
            <h4>Rate Limits?</h4>
            <p>Default: 100 requests/minute. Higher quotas available on request.</p>
            <h4>Data Privacy?</h4>
            <p>
              Media is processed in-memory and not stored unless explicitly allowed for research.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
