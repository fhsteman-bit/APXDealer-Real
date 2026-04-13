import { useState, useEffect } from 'react';
import { Instagram, Youtube, Facebook } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const TikTokIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

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

export default function SocialGrid() {
  const [settings, setSettings] = useState<any>({});
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings(data);
        if (data.socialGridImages && data.socialGridImages.length > 0) {
          setImages(data.socialGridImages);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getUsername = (url: string) => {
    try {
      if (!url) return '@APXDealer';
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts.length > 0 ? `@${pathParts[0]}` : '@APXDealer';
    } catch {
      return '@APXDealer';
    }
  };

  return (
    <section className="bg-black py-16 md:py-20 border-t border-white/10" id="media">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
        <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-6 uppercase">
          MEDIA
        </h2>
        
        <div className="flex justify-center gap-6 mb-8">
          {settings.instagramUrl && (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Instagram size={16} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase hidden md:inline">{getUsername(settings.instagramUrl)}</span>
            </a>
          )}
          {settings.tiktokUrl && (
            <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <TikTokIcon size={16} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase hidden md:inline">{getUsername(settings.tiktokUrl)}</span>
            </a>
          )}
          {settings.youtubeUrl && (
            <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Youtube size={16} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase hidden md:inline">{getUsername(settings.youtubeUrl)}</span>
            </a>
          )}
          {settings.facebookUrl && (
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Facebook size={16} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase hidden md:inline">{getUsername(settings.facebookUrl)}</span>
            </a>
          )}
        </div>

        <div className="w-12 h-[1px] bg-white/30 mx-auto"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-0">
        {images.map((src, index) => (
          <a 
            key={index} 
            href={settings.instagramUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative aspect-square group overflow-hidden block"
          >
            <img 
              src={src} 
              alt={`Social Media Post ${index + 1}`} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
              <Instagram className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
