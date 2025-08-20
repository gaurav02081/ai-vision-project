import Hero from "./components/hero";
import Navbar from "./components/navbar";
import Features from "./components/features";
import RealWorldValue from "./components/RealWorldValue";
import LiveDemo from "./components/LiveDemo";
import Footer from "./components/Footer";
import { Routes, Route } from "react-router-dom";
import ObjectPage from "./components/Object.jsx";
import FacialRecognitionPage from "./components/Facial.jsx";
import GestureControlPage from "./components/Gesture.jsx";
import ImageSegmentationPage from "./components/Segmentation.jsx";
import DocsPage from "./components/DocsPage.jsx";
import ContactPage from "./components/ContactPage.jsx";


function App() {
  return (
    <div className="bg-black text-white">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Hero />
              <Features />
              <RealWorldValue />
              <LiveDemo />
              <Footer />
            </>
          }
        />
        <Route
          path="/docs"
          element={
            <>
              <Navbar />
              <DocsPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <ContactPage />
              <Footer />
            </>
          }
        />
        <Route path="/features/object-detection" element={<ObjectPage />} />
        <Route path="/features/facial-recognition" element={<FacialRecognitionPage />} />
        <Route path="/features/gesture-control" element={<GestureControlPage />} />
        <Route path="/features/image-segmentation" element={<ImageSegmentationPage />} />
       
      </Routes>
      
    </div>
  );
}

export default App;
