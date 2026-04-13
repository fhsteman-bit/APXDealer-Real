import { useState, useEffect } from 'react';
import { Instagram, Maximize2, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376713222-ce462208170c?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611821064430-0d4022cb4fac?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=2070&auto=format&fit=crop',
];

export default function MediaPage() {
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com/APXDealer');
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.instagramUrl) {
          setInstagramUrl(data.instagramUrl);
        }
        if (data.socialGridImages && data.socialGridImages.length > 0) {
          setImages(data.socialGridImages);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getUsername = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? `@${pathParts[0]}` : '@APXDealer';
    } catch {
      return '@APXDealer';
    }
  };

  // Define a bento grid layout pattern
  const getGridClass = (index: number) => {
    const pattern = index % 10;
    switch (pattern) {
      case 0: return 'col-span-2 row-span-2'; // Large square
      case 1: return 'col-span-1 row-span-1'; // Small square
      case 2: return 'col-span-1 row-span-1'; // Small square
      case 3: return 'col-span-2 row-span-1'; // Wide rectangle
      case 4: return 'col-span-1 row-span-2'; // Tall rectangle
      case 5: return 'col-span-1 row-span-1'; // Small square
      case 6: return 'col-span-1 row-span-1'; // Small square
      case 7: return 'col-span-2 row-span-2'; // Large square
      case 8: return 'col-span-1 row-span-1'; // Small square
      case 9: return 'col-span-1 row-span-1'; // Small square
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className="bg-black min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-[0.1em] text-white uppercase mb-4">
              Media <span className="text-gray-600">Gallery</span>
            </h1>
            <div className="w-16 h-[1px] bg-white/30 mb-6"></div>
            <p className="text-gray-400 font-light max-w-xl">
              Explore our curated collection of automotive excellence. Follow our journey and discover the world's most exclusive vehicles.
            </p>
          </div>
          
          <a 
            href={instagramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 border border-white/20 text-white text-xs font-medium tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            <Instagram size={16} />
            <span>{getUsername(instagramUrl)}</span>
          </a>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[300px] gap-4">
          {images.map((src, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index % 10) * 0.1 }}
              key={index} 
              className={`relative group overflow-hidden bg-[#111] cursor-pointer ${getGridClass(index)}`}
              onClick={() => setSelectedImage(src)}
            >
              <img 
                src={src} 
                alt={`Gallery Image ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs tracking-[0.2em] uppercase font-medium">View Image</span>
                    <Maximize2 className="text-white w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
