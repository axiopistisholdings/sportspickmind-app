import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navbar from './components/Navbar';
import RealDataHomePage from './components/RealDataHomePage';
import WorkingPredictionsPage from './components/WorkingPredictionsPage';
import WorkingNewsPage from './components/WorkingNewsPage';
import WorkingGamesPage from './components/WorkingGamesPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import FAQPage from './components/FAQPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import DisclaimerPage from './components/DisclaimerPage';
import Footer from './components/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Context
import { ThemeProvider } from './contexts/ThemeContext';

// Analytics
import { initializeAnalytics } from './utils/analytics';

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              🧠
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            SportsPickMind
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-blue-100 text-lg"
          >
            AI-Powered Sports Predictions
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-blue-200 text-sm mt-2"
          >
            by Axiopistis Holdings
          </motion.p>
        </div>
        <LoadingSpinner size="lg" />
      </motion.div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  // Initialize analytics and app
  useEffect(() => {
    initializeAnalytics();
    
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Navbar />
          <main className="pt-16">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RealDataHomePage />
                  </motion.div>
                } />
                
                <Route path="/predictions" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <WorkingPredictionsPage />
                  </motion.div>
                } />
                
                <Route path="/news" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <WorkingNewsPage />
                  </motion.div>
                } />
                
                <Route path="/games" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <WorkingGamesPage />
                  </motion.div>
                } />
                
                <Route path="/about" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AboutPage />
                  </motion.div>
                } />
                
                <Route path="/contact" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ContactPage />
                  </motion.div>
                } />
                
                <Route path="/faq" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FAQPage />
                  </motion.div>
                } />
                
                <Route path="/privacy" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PrivacyPage />
                  </motion.div>
                } />
                
                <Route path="/terms" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TermsPage />
                  </motion.div>
                } />
                
                <Route path="/disclaimer" element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DisclaimerPage />
                  </motion.div>
                } />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
