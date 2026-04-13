import React, { useState } from 'react';
import { useLocationContext } from '../context/LocationContext';
import { MapPin, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COUNTRIES = [
  'Global',
  'Saudi Arabia',
  'Morocco',
  'Cyprus',
  'Luxembourg',
  'United States',
  'Greece',
  'Spain',
  'France',
  'United Kingdom',
  'Netherlands',
  'Belgium',
  'Monaco',
  'Switzerland'
];

export default function LocationModal() {
  const { showLocationModal, setShowLocationModal, setUserCountry, userCountry, setHasTurkeyPermit } = useLocationContext();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(userCountry);
  const [showTurkeyPrompt, setShowTurkeyPrompt] = useState(false);

  if (!showLocationModal) return null;

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setUserCountry(country);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#111] border border-white/10 p-8 max-w-md w-full relative shadow-2xl"
        >
          {userCountry && (
            <button 
              onClick={() => setShowLocationModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
          
          <div className="text-center mb-8">
            <MapPin size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2">Select Your Location</h2>
            <p className="text-sm text-gray-400">
              Please select your country to see accurate pricing, availability, and import regulations for your region.
            </p>
          </div>

          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {COUNTRIES.map(country => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`p-3 text-sm tracking-wider uppercase border transition-all duration-300 text-left flex justify-between items-center ${
                    selectedCountry === country 
                      ? 'border-white bg-white text-black font-medium' 
                      : 'border-white/10 text-gray-300 hover:border-white/50 hover:bg-white/5'
                  }`}
                >
                  {country}
                  {selectedCountry === country && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedCountry && handleCountrySelect(selectedCountry)}
              disabled={!selectedCountry}
              className="w-full py-4 bg-white text-black text-xs font-medium tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
