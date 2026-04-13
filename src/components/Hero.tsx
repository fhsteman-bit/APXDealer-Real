import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/showroom?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url("${settings.heroImage || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=2070&auto=format&fit=crop'}")`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-32">
        <div className="mb-16 max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white uppercase tracking-[0.1em] mb-6 leading-tight">
            {settings.heroTitle || 'DRIVE THE IMPOSSIBLE.'}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light tracking-wide max-w-2xl">
            {settings.heroSubtitle || 'We Master the Logistics.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-end justify-between gap-12">
          
          {/* Left Side: Title & CTA */}
          <div className="w-full md:w-2/3">
            <Link to="/showroom" className="group inline-flex items-center gap-6">
              <span className="text-[11px] font-medium tracking-[0.2em] text-white uppercase group-hover:text-gray-300 transition-colors">
                View Showroom
              </span>
              <div className="flex items-center">
                <div className="w-16 h-[1px] bg-white transition-all group-hover:w-24"></div>
                <ChevronRight size={14} className="text-white transition-transform group-hover:translate-x-2" />
              </div>
            </Link>
          </div>

          {/* Right Side: Search */}
          <div className="w-full md:w-1/3 pb-2">
            <form onSubmit={handleSearch} className="relative group border-b border-white/30 hover:border-white transition-colors">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH MARQUE OR MODEL" 
                className="w-full bg-transparent py-4 pl-0 pr-10 text-[11px] font-medium tracking-[0.2em] text-white placeholder:text-white/50 focus:outline-none uppercase"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                <Search size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
