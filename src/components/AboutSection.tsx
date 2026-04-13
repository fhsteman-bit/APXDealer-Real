import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AboutSection() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-black py-16 md:py-20 border-t border-white/10" id="about">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          
          {/* Left Side: Image */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-[16/10] overflow-hidden border border-white/10">
              <img 
                src={settings.aboutImage || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop"} 
                alt="Luxury Car Showroom" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2 lg:pl-12">
            <p className="text-gray-400 text-[10px] font-medium tracking-[0.3em] uppercase mb-6">
              {settings.aboutSubtitle || 'Specialists In'}
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-white mb-10 leading-tight tracking-[0.05em] uppercase whitespace-pre-wrap">
              {settings.aboutTitle || 'PERFORMANCE, LUXURY\nSUPERCARS & HYPERCARS'}
            </h2>
            
            <div className="space-y-6 text-gray-400 text-sm leading-relaxed mb-12 max-w-xl font-light whitespace-pre-wrap">
              {settings.aboutText ? (
                <p>{settings.aboutText}</p>
              ) : (
                <>
                  <p>
                    APX Dealer has successfully traded in the highest quality performance and luxury cars from both local and international locations.
                  </p>
                  <p>
                    From our state-of-the-art showroom, we typically hold a range of performance and luxury cars from manufacturers including Bugatti, Koenigsegg, Pagani, Ferrari, Lamborghini, Porsche, McLaren, Mercedes-Benz (AMG) and Aston Martin.
                  </p>
                  <p>
                    If you have a particular model in mind that is not currently in our inventory, our team will go the extra mile to source it for you, ensuring your specific needs are met.
                  </p>
                </>
              )}
            </div>

            <Link 
              to="/how-we-work" 
              className="inline-flex items-center justify-center px-10 py-4 text-[11px] font-medium tracking-[0.2em] text-white uppercase border border-white/30 hover:bg-white hover:text-black transition-all"
            >
              HOW WE WORK
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
