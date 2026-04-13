import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function ContactSection() {
  const [settings, setSettings] = useState<any>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await addDoc(collection(db, 'inquiries'), {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        status: 'new',
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setStatus('error');
    }
  };

  return (
    <section className="bg-black py-16 md:py-20 border-t border-white/10" id="contact">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-20">
          
          {/* Left Side: Contact Info */}
          <div className="w-full lg:w-1/3">
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-6 uppercase">
              GET IN TOUCH
            </h2>
            <p className="text-gray-400 text-sm mb-16 font-light leading-relaxed">
              Our team of specialists is ready to assist you with your luxury vehicle needs.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <Mail className="text-white w-5 h-5 mt-1 opacity-70" />
                <div>
                  <h3 className="text-white font-medium tracking-[0.2em] text-[11px] uppercase mb-3">Email</h3>
                  <p className="text-gray-400 text-sm font-light">
                    {settings.contactEmail || 'sales@apxdealer.co.uk'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <Clock className="text-white w-5 h-5 mt-1 opacity-70" />
                <div>
                  <h3 className="text-white font-medium tracking-[0.2em] text-[11px] uppercase mb-3">Hours</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {settings.workingHours || 'Available 24/7'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <MapPin className="text-white w-5 h-5 mt-1 opacity-70" />
                <div>
                  <h3 className="text-white font-medium tracking-[0.2em] text-[11px] uppercase mb-3">Locations</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {settings.address || 'Netherlands & Cyprus'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="w-full lg:w-2/3">
            <div className="bg-black border border-white/10 p-10 md:p-16 relative overflow-hidden min-h-[500px]">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-black z-10"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-light tracking-[0.1em] text-white mb-4 uppercase">Message Sent</h3>
                    <p className="text-gray-400 font-light leading-relaxed max-w-md">
                      Thank you for reaching out. One of our specialists will review your inquiry and contact you shortly.
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-10 px-8 py-3 border border-white/20 text-[10px] font-medium tracking-[0.2em] text-white uppercase hover:bg-white hover:text-black transition-colors"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    onSubmit={handleSubmit}
                    className="h-full flex flex-col"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label htmlFor="firstName" className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-3">First Name</label>
                        <input 
                          type="text" 
                          id="firstName" 
                          required
                          value={formData.firstName}
                          onChange={e => setFormData({...formData, firstName: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-white transition-colors font-light text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-3">Last Name</label>
                        <input 
                          type="text" 
                          id="lastName" 
                          required
                          value={formData.lastName}
                          onChange={e => setFormData({...formData, lastName: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-white transition-colors font-light text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label htmlFor="email" className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-3">Email Address</label>
                        <input 
                          type="email" 
                          id="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-white transition-colors font-light text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-3">Phone Number</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-white transition-colors font-light text-sm"
                        />
                      </div>
                    </div>

                    <div className="mb-12">
                      <label htmlFor="message" className="block text-[10px] font-medium tracking-[0.2em] text-gray-400 uppercase mb-3">Message</label>
                      <textarea 
                        id="message" 
                        rows={4}
                        required
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-transparent border-b border-white/20 py-3 text-white focus:outline-none focus:border-white transition-colors resize-none font-light text-sm"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full md:w-auto px-12 py-4 text-[11px] font-medium tracking-[0.2em] text-black uppercase bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 mt-auto"
                    >
                      {status === 'submitting' ? 'SENDING...' : 'SEND MESSAGE'}
                    </button>

                    {status === 'error' && (
                      <p className="mt-4 text-red-400 text-sm">There was an error sending your message. Please try again.</p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
