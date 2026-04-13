import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RecentlySoldPage() {
  const [soldCars, setSoldCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [makes, setMakes] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const q = query(
      collection(db, 'cars'), 
      where('status', '==', 'Sold')
    );
    
    const unsubscribeCars = onSnapshot(q, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSoldCars(carsData);
      
      // Extract unique makes
      const uniqueMakes = Array.from(new Set(carsData.map((car: any) => car.make))).filter(Boolean).sort();
      setMakes(uniqueMakes as string[]);
      
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    
    return () => {
      unsubscribeCars();
      unsubscribeSettings();
    };
  }, []);

  const filteredCars = soldCars.filter(car => {
    if (selectedMake && car.make !== selectedMake) return false;
    if (selectedModel && car.model !== selectedModel) return false;
    return true;
  });

  const availableModels = selectedMake 
    ? Array.from(new Set(soldCars.filter(c => c.make === selectedMake).map(c => c.model))).filter(Boolean).sort()
    : [];

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Hero Section */}
      <div className="relative h-[30vh] md:h-[35vh] w-full overflow-hidden">
        <img 
          src={settings.soldCarsImage || "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop"} 
          alt="Sold Cars" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.3em] text-white uppercase mb-4 mt-12">
            Recently Sold
          </h1>
          <div className="w-12 h-[1px] bg-white/50"></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111] border-b border-white/10 py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 w-full">
            {/* Make Filter */}
            <div className="flex flex-col gap-2 w-full sm:w-64">
              <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Make</label>
              <div className="relative w-full">
                <select 
                  value={selectedMake}
                  onChange={(e) => {
                    setSelectedMake(e.target.value);
                    setSelectedModel('');
                  }}
                  className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="">All Makes</option>
                  {makes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            
            {/* Model Filter */}
            <div className="flex flex-col gap-2 w-full sm:w-64">
              <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Model</label>
              <div className="relative w-full">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedMake}
                  className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Models</option>
                  {availableModels.map(model => (
                    <option key={model as string} value={model as string}>{model as string}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex-grow"></div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => {
                  document.getElementById('sold-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full md:w-auto border border-white/20 px-8 py-3 text-[10px] font-medium tracking-[0.2em] text-white uppercase hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none mb-1">☷</span> Filter Sold Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div id="sold-grid" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center py-20 text-white">Loading sold inventory...</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No sold cars match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <Link key={car.id} to={`/sold-car/${car.id}`} className="bg-[#1a1a1a] group block">
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img 
                    src={car.images?.[0] || 'https://images.unsplash.com/photo-1503376713222-ce462208170c?q=80&w=2070&auto=format&fit=crop'} 
                    alt={`${car.make} ${car.model}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-medium tracking-[0.1em] text-white mb-4 uppercase">{car.make} {car.model}</h3>
                  <div className="w-8 h-[1px] bg-white/20 mb-6"></div>
                  <div className="flex items-center gap-2 text-[11px] tracking-wider text-gray-400 uppercase mb-8">
                    <span>{car.year}</span>
                    <span>-</span>
                    <span>{car.mileage || 'N/A'}</span>
                    <span>-</span>
                    <span>{car.exteriorColor || 'N/A'}</span>
                  </div>
                  <p className="text-sm font-bold tracking-wider text-white uppercase">SOLD</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
