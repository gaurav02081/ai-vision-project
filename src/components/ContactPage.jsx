import { useRef, useState } from "react";
import apiService from "../services/apiService";

export default function ContactPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef();

  const sendEmail = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    setIsSubmitting(true);

    const formData = new FormData(formRef.current);
    const feedbackData = {
      name: formData.get('first_name') + ' ' + formData.get('last_name'),
      email: formData.get('user_email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      await apiService.submitFeedback(feedbackData);
      setStatus("✅ Message sent successfully!");
      formRef.current.reset();
    } catch (error) {
      console.error(error);
      setStatus("❌ Failed to send message. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${
        darkMode ? "dark-mode" : ""
      } max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 min-h-screen bg-[#121212] text-gray-200`}
    >
      {/* Header */}
      <header className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Get in touch</h1>
        <p className="mt-3 text-gray-400">Questions, partnerships, or feedback? We would love to hear from you.</p>
      </header>

      <main className="mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white">Contact Information</h2>
              <p className="mt-2 text-sm text-gray-400">We typically respond within 1-2 business days.</p>
              <dl className="mt-6 space-y-4">
                <div className="flex items-start">
                  <span className="material-icons text-blue-400 mr-3">email</span>
                  <div>
                    <dt className="text-sm text-gray-400">Email</dt>
                    <dd className="text-sm text-gray-200">aivision.project@ftu.edu</dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-icons text-blue-400 mr-3">location_on</span>
                  <div>
                    <dt className="text-sm text-gray-400">Address</dt>
                    <dd className="text-sm text-gray-200">123 Innovation Way, Tech City</dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-icons text-blue-400 mr-3">schedule</span>
                  <div>
                    <dt className="text-sm text-gray-400">Hours</dt>
                    <dd className="text-sm text-gray-200">Mon - Fri, 9:00 AM - 6:00 PM</dd>
                  </div>
                </div>
              </dl>
              <div className="mt-6 flex items-center space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
          </aside>

          {/* Form */}
          <section className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-white">Send us a message</h2>
              <p className="mt-2 text-sm text-gray-400">Fill out the form and our team will get back to you.</p>

              <form ref={formRef} onSubmit={sendEmail} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-300">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      placeholder="Jane"
                      className="mt-2 block w-full rounded-lg bg-[#0F1522] border border-gray-700/80 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-300">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Doe"
                      className="mt-2 block w-full rounded-lg bg-[#0F1522] border border-gray-700/80 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input
                      type="email"
                      name="user_email"
                      placeholder="you@example.com"
                      className="mt-2 block w-full rounded-lg bg-[#0F1522] border border-gray-700/80 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="How can we help?"
                      className="mt-2 block w-full rounded-lg bg-[#0F1522] border border-gray-700/80 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                    <textarea
                      name="message"
                      rows="5"
                      placeholder="Write your message..."
                      className="mt-2 block w-full rounded-lg bg-[#0F1522] border border-gray-700/80 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">By submitting, you agree to our terms and privacy policy.</p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isSubmitting ? "bg-blue-600/60 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>

              {status && (
                <p className="mt-4 text-sm text-center text-gray-300" aria-live="polite">{status}</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
