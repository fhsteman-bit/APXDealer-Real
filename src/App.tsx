import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Home, Showroom, CarDetails, RecentlySoldPage, SoldCarDetails, Sourcing, Media, Contact, HowWeWork, LogoDrafts } from './pages';
import { AdminDashboard } from './pages/Admin';
import TermsOfService from './pages/TermsOfService';
import ImportGuide from './pages/ImportGuide';
import ImportCalculator from './pages/ImportCalculator';
import { useVisitorTracking } from './hooks/useVisitorTracking';
import LocationModal from './components/LocationModal';

import { LocationProvider } from './context/LocationContext';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AppContent() {
  const [isNavHovered, setIsNavHovered] = useState(false);
  const location = useLocation();
  
  useVisitorTracking();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30 flex flex-col">
      <Navbar onHoverChange={setIsNavHovered} />
      
      <main className="relative flex-grow">
        <LocationModal />
        <div 
          className={`pointer-events-none absolute inset-0 z-40 bg-black/60 transition-opacity duration-500 ${
            isNavHovered ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />
        
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          {/* @ts-ignore - react-router-dom v6 Routes doesn't explicitly type key but it's required for AnimatePresence */}
          <Routes location={location} key={location.pathname + location.search}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/showroom" element={<PageTransition><Showroom /></PageTransition>} />
            <Route path="/car/:id" element={<PageTransition><CarDetails /></PageTransition>} />
            <Route path="/sold-car/:id" element={<PageTransition><SoldCarDetails /></PageTransition>} />
            <Route path="/recently-sold" element={<PageTransition><RecentlySoldPage /></PageTransition>} />
            <Route path="/sourcing" element={<PageTransition><Sourcing /></PageTransition>} />
            <Route path="/how-we-work" element={<PageTransition><HowWeWork /></PageTransition>} />
            <Route path="/media" element={<PageTransition><Media /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
            <Route path="/import-guide" element={<PageTransition><ImportGuide /></PageTransition>} />
            <Route path="/calculator" element={<PageTransition><ImportCalculator /></PageTransition>} />
            <Route path="/logo-drafts" element={<PageTransition><LogoDrafts /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </Router>
  );
}
