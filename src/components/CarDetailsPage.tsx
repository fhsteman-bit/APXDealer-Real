import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Phone, MessageCircle, Grid, X, AlertTriangle, CheckCircle2, Volume2, Square } from 'lucide-react';
import { useLocationPricing, useLocationContext } from '../context/LocationContext';
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { checkCarCompliance } from '../utils/compliance';
import { motion, AnimatePresence } from 'motion/react';

export default function CarDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'options'>('description');
  const { formatPrice } = useLocationPricing();
  const { userCountry, hasTurkeyPermit } = useLocationContext();
  const [car, setCar] = useState<any>(null);
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState<'exterior' | 'interior' | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleAudio = (type: 'exterior' | 'interior', url: string) => {
    if (playingAudio === type && audioElement) {
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      if (audioElement) audioElement.pause();
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.onended = () => setPlayingAudio(null);
      setAudioElement(newAudio);
      setPlayingAudio(type);
    }
  };

  useEffect(() => {
    return () => {
      if (audioElement) audioElement.pause();
    };
  }, [audioElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null || !car?.images) return;
      if (e.key === 'Escape') setSelectedImageIndex(null);
      if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => (prev! + 1) % car.images.length);
      if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev! - 1 + car.images.length) % car.images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, car]);

  useEffect(() => {
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchCar = async () => {
      if (!id) return;
      try {
        const [docSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'cars', id)),
          getDoc(doc(db, 'settings', 'general'))
        ]);
        if (docSnap.exists()) {
          const carData: any = { id: docSnap.id, ...docSnap.data() };
          setCar(carData);

          // Fetch similar cars
          try {
            const q = query(
              collection(db, 'cars'),
              where('status', '==', 'Available'),
              where('make', '==', carData.make),
              limit(4)
            );
            const similarSnap = await getDocs(q);
            const similar = similarSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(c => c.id !== id)
              .slice(0, 3);
            setSimilarCars(similar);
          } catch (err) {
            console.error("Error fetching similar cars:", err);
          }
        } else {
          setCar(null);
        }
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    };
    fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-32 px-4 text-center">
        <h1 className="text-2xl text-white mb-4">Loading...</h1>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-32 px-4 text-center">
        <h1 className="text-2xl text-white mb-4">Car not found</h1>
        <button onClick={() => navigate('/showroom')} className="text-gray-400 hover:text-white">
          Return to Showroom
        </button>
      </div>
    );
  }

  const nextImage = () => {
    if (!car.images || car.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
  };

  const prevImage = () => {
    if (!car.images || car.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      await addDoc(collection(db, 'inquiries'), {
        name: formData.name.trim(),
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        carId: car.id,
        carMakeModel: `${car.year} ${car.make} ${car.model}`,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => {
        setSubmitStatus('idle');
        setShowInquiryModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setSubmitStatus('error');
    }
  };

  const compliance = car ? checkCarCompliance(car, userCountry, hasTurkeyPermit) : { isCompliant: true };

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-24 pb-20 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.2em] text-white uppercase">
            {car.year} {car.make} {car.model}
          </h1>
        </div>

        {!compliance.isCompliant && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 p-6 flex gap-4 items-start">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-medium text-red-500 uppercase tracking-wider mb-2">Unavailable for your region ({userCountry})</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {compliance.reason}
              </p>
            </div>
          </div>
        )}

        {/* Top Section: Image Carousel & Specs */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          
          {/* Main Image Carousel */}
          <div className="w-full lg:w-2/3 relative group bg-[#1a1a1a]">
            <div 
              className="aspect-[16/9] overflow-hidden relative cursor-pointer"
              onClick={() => setSelectedImageIndex(currentImageIndex)}
            >
              <img 
                src={car.images?.[currentImageIndex] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2071&auto=format&fit=crop'} 
                alt={`${car.make} ${car.model}`} 
                className="w-full h-full object-cover transition-opacity duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Navigation Arrows */}
            {car.images && car.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={prevImage}
                  className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-black hover:bg-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-black hover:bg-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Specs & Actions */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <div className="bg-[#1a1a1a] p-8 mb-6 flex-grow">
              <div className="space-y-6">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Year</span>
                  <span className="text-sm text-gray-300 font-light">{car.year}</span>
                </div>
                {car.condition && (
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Condition</span>
                    <span className="text-sm text-gray-300 font-light">{car.condition}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Mileage</span>
                  <span className="text-sm text-gray-300 font-light">{car.mileage || 'N/A'}</span>
                </div>
                {car.engineType && (
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Engine</span>
                    <span className="text-sm text-gray-300 font-light">{car.engineType}</span>
                  </div>
                )}
                {car.horsepower && (
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Power</span>
                    <span className="text-sm text-gray-300 font-light">{car.horsepower}</span>
                  </div>
                )}
                {car.performance && (
                  <div className="flex justify-between border-b border-white/10 pb-4">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">0-100 km/h</span>
                    <span className="text-sm text-gray-300 font-light">{car.performance}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Exterior Colour</span>
                  <span className="text-sm text-gray-300 font-light">{car.exteriorColor || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Interior Colour</span>
                  <span className="text-sm text-gray-300 font-light">{car.interiorColor || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Driver's Seat</span>
                  <span className="text-sm text-gray-300 font-light">{car.driversSeat || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Transmission</span>
                  <span className="text-sm text-gray-300 font-light">{car.transmission || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase">Price</span>
                  <span className="text-sm text-white font-medium">{formatPrice(car.countryPrices)}</span>
                </div>
              </div>

              {/* Audio Controls */}
              {(car.exteriorSound || car.interiorSound) && (
                <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                  <span className="text-[11px] font-bold tracking-[0.15em] text-white uppercase block mb-4">Vehicle Audio</span>
                  {car.exteriorSound && (
                    <button 
                      onClick={() => toggleAudio('exterior', car.exteriorSound)}
                      className={`w-full flex items-center justify-between p-3 border transition-colors ${playingAudio === 'exterior' ? 'border-white bg-white/10 text-white' : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'}`}
                    >
                      <span className="text-xs tracking-[0.1em] uppercase">Exterior Exhaust</span>
                      {playingAudio === 'exterior' ? <Square size={14} className="fill-current" /> : <Volume2 size={16} />}
                    </button>
                  )}
                  {car.interiorSound && (
                    <button 
                      onClick={() => toggleAudio('interior', car.interiorSound)}
                      className={`w-full flex items-center justify-between p-3 border transition-colors ${playingAudio === 'interior' ? 'border-white bg-white/10 text-white' : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'}`}
                    >
                      <span className="text-xs tracking-[0.1em] uppercase">Interior Engine</span>
                      {playingAudio === 'interior' ? <Square size={14} className="fill-current" /> : <Volume2 size={16} />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button 
                onClick={() => setShowInquiryModal(true)}
                disabled={!compliance.isCompliant}
                className={`w-full transition-colors py-4 text-[11px] font-bold tracking-[0.2em] uppercase ${
                  compliance.isCompliant 
                    ? 'bg-[#222] hover:bg-white hover:text-black text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {compliance.isCompliant ? 'Make an Enquiry / Purchase' : 'Unavailable'}
              </button>
              <a 
                href={settings?.contactPhone ? `https://wa.me/${settings.contactPhone.replace(/[^0-9]/g, '')}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-white/20 hover:border-white text-white transition-colors py-4 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-3"
              >
                <MessageCircle size={14} />
                WhatsApp 24/7
              </a>
              <button 
                onClick={() => navigate('/showroom')}
                className="w-full border border-white/20 hover:border-white text-white transition-colors py-4 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-3"
              >
                <Grid size={14} />
                Back to Stock
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-12">
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                activeTab === 'description' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('options')}
              className={`flex-1 py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${
                activeTab === 'options' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Options
            </button>
          </div>
          
          <div className="py-8 text-gray-300 font-light leading-relaxed max-w-4xl">
            {activeTab === 'description' && (
              <p>{car.description || 'No description available.'}</p>
            )}
            {activeTab === 'options' && (
              <ul className="list-disc pl-5 space-y-2">
                {car.options && car.options.length > 0 ? (
                  car.options.map((option: string, index: number) => (
                    <li key={index}>{option}</li>
                  ))
                ) : (
                  <li>No options listed.</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        {car.images && car.images.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {car.images.slice(1).map((img: string, index: number) => (
              <div 
                key={index} 
                className="aspect-[4/3] overflow-hidden bg-[#1a1a1a] cursor-pointer"
                onClick={() => setSelectedImageIndex(index + 1)}
              >
                <img 
                  src={img} 
                  alt={`${car.make} ${car.model} detail ${index + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        )}

        {/* Similar Vehicles */}
        {similarCars.length > 0 && (
          <div className="mt-20 border-t border-white/10 pt-16">
            <h3 className="text-2xl font-light tracking-[0.2em] text-white uppercase mb-8">You May Also Like</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarCars.map(similarCar => (
                <div 
                  key={similarCar.id} 
                  className="bg-[#1a1a1a] group cursor-pointer"
                  onClick={() => navigate(`/car/${similarCar.id}`)}
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img 
                      src={similarCar.images?.[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2071&auto=format&fit=crop'} 
                      alt={`${similarCar.make} ${similarCar.model}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-light tracking-[0.1em] text-white uppercase mb-2">
                      {similarCar.year} {similarCar.make} {similarCar.model}
                    </h4>
                    <p className="text-gray-400 text-sm">{formatPrice(similarCar.countryPrices)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && car?.images && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button 
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 p-2"
            >
              <X size={32} />
            </button>
            
            <div 
              className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={car.images[selectedImageIndex]} 
                alt={`${car.make} ${car.model} gallery view`} 
                className="max-w-full max-h-[90vh] object-contain"
                referrerPolicy="no-referrer"
              />
              
              {car.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev! - 1 + car.images.length) % car.images.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev! + 1) % car.images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm tracking-widest">
              {selectedImageIndex + 1} / {car.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111] border border-white/20 w-full max-w-xl p-6 sm:p-8 relative my-8 sm:my-12 overflow-hidden min-h-[500px]">
            <button 
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
            >
              <X size={24} />
            </button>
            
            <AnimatePresence mode="wait">
              {submitStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-[#111] z-10"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-light tracking-[0.1em] text-white mb-4 uppercase">Enquiry Sent</h3>
                  <p className="text-gray-400 font-light leading-relaxed max-w-md">
                    Thank you for your interest in the {car.year} {car.make} {car.model}. One of our specialists will review your inquiry and contact you shortly.
                  </p>
                  <button
                    onClick={() => setShowInquiryModal(false)}
                    className="mt-10 px-8 py-3 border border-white/20 text-[10px] font-medium tracking-[0.2em] text-white uppercase hover:bg-white hover:text-black transition-colors"
                  >
                    Close Window
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-light tracking-[0.1em] text-white uppercase mb-2">
                    Enquire About This Vehicle
                  </h2>
                  <p className="text-gray-400 text-sm mb-8 pb-6 border-b border-white/10">
                    {car.year} {car.make} {car.model} - {formatPrice(car.countryPrices)}
                  </p>

                  <form onSubmit={handleInquirySubmit} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-2">Full Name *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-2">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-2">Phone Number *</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-2">Message / Questions</label>
                      <textarea 
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm resize-none"
                        placeholder="I am interested in this vehicle..."
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitStatus === 'submitting'}
                      className="w-full py-4 bg-white text-black text-[11px] font-medium tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
                    >
                      {submitStatus === 'submitting' ? 'SENDING...' : 'SUBMIT ENQUIRY'}
                    </button>

                    {submitStatus === 'error' && (
                      <p className="text-red-400 text-sm text-center mt-4">Failed to send enquiry. Please try again.</p>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
