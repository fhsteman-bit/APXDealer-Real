import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, LayoutGrid, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLocationPricing, useLocationContext } from '../context/LocationContext';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { checkCarCompliance } from '../utils/compliance';

export default function ShowroomPage() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('recently_added');
  const { formatPrice } = useLocationPricing();
  const { userCountry, hasTurkeyPermit } = useLocationContext();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [klmMin, setKlmMin] = useState<string>('');
  const [klmMax, setKlmMax] = useState<string>('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [bodyStyle, setBodyStyle] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [transmission, setTransmission] = useState<string>('');
  const [dateAdded, setDateAdded] = useState<string>('');

  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const q = query(collection(db, 'cars'), where('status', '==', 'Available'));
    const unsubscribeCars = onSnapshot(q, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(carsData);
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

  // Extract unique makes and models from inventory
  const uniqueMakes = useMemo(() => Array.from(new Set(inventory.map(car => car.make))), [inventory]);
  const availableModels = useMemo(() => {
    let models = inventory;
    if (selectedMake) {
      models = models.filter(car => car.make.toLowerCase() === selectedMake.toLowerCase());
    }
    return Array.from(new Set(models.map(car => car.model)));
  }, [selectedMake, inventory]);

  // Handle URL search params 'q' and 'make'
  useEffect(() => {
    const q = searchParams.get('q');
    const makeParam = searchParams.get('make');
    const modelParam = searchParams.get('model');

    if (makeParam !== null || modelParam !== null) {
      let actualMake = makeParam || '';
      let actualModel = modelParam || '';

      if (inventory.length > 0) {
        const matchedMake = uniqueMakes.find(m => m.toLowerCase() === actualMake.toLowerCase());
        if (matchedMake) actualMake = matchedMake;

        const matchedModel = inventory.find(c => c.model.toLowerCase() === actualModel.toLowerCase())?.model;
        if (matchedModel) actualModel = matchedModel;
      }

      setSelectedMake(actualMake);
      setSelectedModel(actualModel);
    } else if (q && inventory.length > 0) {
      const queryStr = q.toLowerCase();
      let foundMake = '';
      let foundModel = '';

      // Check if query contains any known make
      for (const make of uniqueMakes) {
        if (queryStr.includes(make.toLowerCase())) {
          foundMake = make;
          break;
        }
      }

      // Check if query contains any known model
      for (const car of inventory) {
        if (queryStr.includes(car.model.toLowerCase())) {
          foundModel = car.model;
          if (!foundMake) foundMake = car.make; // Auto-select make if model is found
          break;
        }
      }

      if (foundMake) setSelectedMake(foundMake);
      if (foundModel) setSelectedModel(foundModel);
    } else if (!makeParam && !q) {
      // If no search params are present, clear the filters
      setSelectedMake('');
      setSelectedModel('');
    }
  }, [searchParams, uniqueMakes, inventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(car => {
      const matchMake = selectedMake ? car.make.toLowerCase() === selectedMake.toLowerCase() : true;
      const matchModel = selectedModel ? car.model.toLowerCase() === selectedModel.toLowerCase() : true;
      
      const carPrice = car.countryPrices?.[userCountry] || car.countryPrices?.['Global'] || 0;
      const matchPriceMin = priceMin ? carPrice >= parseInt(priceMin) : true;
      const matchPriceMax = priceMax ? carPrice <= parseInt(priceMax) : true;

      const carKlm = parseInt(String(car.mileage || '0').replace(/\D/g, '')) || 0;
      const matchKlmMin = klmMin ? carKlm >= parseInt(klmMin) : true;
      const matchKlmMax = klmMax ? carKlm <= parseInt(klmMax) : true;

      const carYear = parseInt(String(car.year)) || 0;
      const matchYearMin = yearMin ? carYear >= parseInt(yearMin) : true;
      const matchYearMax = yearMax ? carYear <= parseInt(yearMax) : true;

      const matchBodyStyle = bodyStyle ? car.bodyStyle?.toLowerCase() === bodyStyle.toLowerCase() : true;
      const matchColor = color ? (car.exteriorColor?.toLowerCase().includes(color.toLowerCase()) || car.interiorColor?.toLowerCase().includes(color.toLowerCase())) : true;
      const matchTransmission = transmission ? car.transmission?.toLowerCase().includes(transmission.toLowerCase()) : true;

      let matchDate = true;
      if (dateAdded) {
        const now = new Date().getTime();
        const carDate = car.createdAt?.toMillis() || 0;
        const daysDiff = (now - carDate) / (1000 * 3600 * 24);
        if (dateAdded === '7') matchDate = daysDiff <= 7;
        else if (dateAdded === '30') matchDate = daysDiff <= 30;
        else if (dateAdded === '90') matchDate = daysDiff <= 90;
      }

      // Check compliance
      const compliance = checkCarCompliance(car, userCountry, hasTurkeyPermit);
      
      return matchMake && matchModel && matchPriceMin && matchPriceMax && matchKlmMin && matchKlmMax && matchYearMin && matchYearMax && matchBodyStyle && matchColor && matchTransmission && matchDate && compliance.isCompliant;
    });
  }, [selectedMake, selectedModel, priceMin, priceMax, klmMin, klmMax, yearMin, yearMax, bodyStyle, color, transmission, dateAdded, inventory, userCountry, hasTurkeyPermit]);

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const getKlm = (klmStr: string) => parseInt(String(klmStr).replace(/\D/g, '')) || 0;
    const getYear = (yearStr: string | number) => parseInt(String(yearStr)) || 0;

    switch (sortBy) {
      case 'date_newest':
        return getYear(b.year) - getYear(a.year);
      case 'date_oldest':
        return getYear(a.year) - getYear(b.year);
      case 'price_highest':
        return (b.priceEur || 0) - (a.priceEur || 0);
      case 'price_lowest':
        return (a.priceEur || 0) - (b.priceEur || 0);
      case 'klm_highest':
        return getKlm(b.mileage || '') - getKlm(a.mileage || '');
      case 'klm_lowest':
        return getKlm(a.mileage || '') - getKlm(b.mileage || '');
      case 'recently_added':
      default:
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    }
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Hero Section */}
      <div className="relative h-[30vh] md:h-[35vh] w-full overflow-hidden">
        <img 
          src={settings.showroomImage || "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2071&auto=format&fit=crop"} 
          alt="Cars in Stock" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.3em] text-white uppercase mb-4 mt-12">
            Cars In Stock
          </h1>
          <div className="w-12 h-[1px] bg-white/50"></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111] border-b border-white/10 py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 w-full lg:w-auto">
              {/* Make Filter */}
              <div className="flex flex-col gap-2 w-full sm:w-64">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Make</label>
                <div className="relative w-full">
                  <select 
                    value={selectedMake}
                    onChange={(e) => {
                      const newMake = e.target.value;
                      setSelectedMake(newMake);
                      setSelectedModel(''); // Reset model when make changes
                      
                      const newParams = new URLSearchParams(searchParams);
                      if (newMake) {
                        newParams.set('make', newMake);
                      } else {
                        newParams.delete('make');
                      }
                      newParams.delete('model'); // Always clear model when make changes
                      setSearchParams(newParams);
                    }}
                    className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="">All Makes</option>
                    {selectedMake && !uniqueMakes.some(m => m.toLowerCase() === selectedMake.toLowerCase()) && (
                      <option value={selectedMake}>{selectedMake}</option>
                    )}
                    {uniqueMakes.map(make => (
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
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setSelectedModel(newModel);
                      
                      const newParams = new URLSearchParams(searchParams);
                      if (newModel) {
                        newParams.set('model', newModel);
                      } else {
                        newParams.delete('model');
                      }
                      setSearchParams(newParams);
                    }}
                    className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="">All Models</option>
                    {selectedModel && !availableModels.some(m => m.toLowerCase() === selectedModel.toLowerCase()) && (
                      <option value={selectedModel}>{selectedModel}</option>
                    )}
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white text-black border border-transparent px-8 py-3 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors"
              >
                <SlidersHorizontal size={14} />
                {isFilterExpanded ? 'Hide Filters' : 'Advanced Filters'}
              </button>
            </div>

          </div>

          {/* Expanded Filters */}
          {isFilterExpanded && (
            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Price Range */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Price Range (€)</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-white/30" />
                  <span className="text-gray-500">-</span>
                  <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-white/30" />
                </div>
              </div>

              {/* Mileage Range */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Mileage (km)</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={klmMin} onChange={e => setKlmMin(e.target.value)} placeholder="Min" className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-white/30" />
                  <span className="text-gray-500">-</span>
                  <input type="number" value={klmMax} onChange={e => setKlmMax(e.target.value)} placeholder="Max" className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-white/30" />
                </div>
              </div>

              {/* Year Range */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Year</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-full">
                    <select value={yearMin} onChange={e => setYearMin(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                      <option value="">Min</option>
                      {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative w-full">
                    <select value={yearMax} onChange={e => setYearMax(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                      <option value="">Max</option>
                      {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Body Style */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Body Style</label>
                <div className="relative w-full">
                  <select value={bodyStyle} onChange={e => setBodyStyle(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                    <option value="">Any</option>
                    <option value="coupe">Coupe</option>
                    <option value="convertible">Convertible</option>
                    <option value="suv">SUV</option>
                    <option value="saloon">Saloon</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Color */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Color</label>
                <div className="relative w-full">
                  <select value={color} onChange={e => setColor(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                    <option value="">Any</option>
                    {Array.from(new Set(inventory.flatMap(car => [car.exteriorColor, car.interiorColor]).filter(Boolean))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Transmission */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Transmission</label>
                <div className="relative w-full">
                  <select value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                    <option value="">Any</option>
                    {Array.from(new Set(inventory.map(car => car.transmission).filter(Boolean))).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Date Added */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Date Added</label>
                <div className="relative w-full">
                  <select value={dateAdded} onChange={e => setDateAdded(e.target.value)} className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer">
                    <option value="">Any time</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-xl font-light tracking-[0.2em] text-white uppercase">Inventory</h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase whitespace-nowrap">Sort by</span>
            <div className="relative w-full sm:w-48">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-4 py-3 pr-10 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="recently_added">Recently added</option>
                <option value="date_newest">Date: New</option>
                <option value="date_oldest">Date: Old</option>
                <option value="price_highest">Price: High</option>
                <option value="price_lowest">Price: Low</option>
                <option value="klm_highest">Klm: High</option>
                <option value="klm_lowest">Klm: Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-20 text-white">Loading inventory...</div>
          ) : sortedInventory.length === 0 ? (
            <div className="col-span-full text-center py-20 border border-white/10 bg-[#111]">
              <h3 className="text-xl font-light tracking-wider text-white mb-4">No Vehicles Found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria.</p>
              <button 
                onClick={() => {
                  setSelectedMake('');
                  setSelectedModel('');
                  setSearchParams({});
                }}
                className="mt-6 px-6 py-3 border border-white/20 text-xs tracking-widest text-white uppercase hover:bg-white/5 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            sortedInventory.map((car) => (
              <Link key={car.id} to={`/car/${car.id}`} className="bg-[#1a1a1a] group cursor-pointer flex flex-col">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={car.images?.[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2071&auto=format&fit=crop'} 
                    alt={`${car.make} ${car.model}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-base font-medium tracking-wide text-white mb-4 uppercase">
                    {car.make} {car.model}
                  </h3>
                  <div className="w-8 h-[1px] bg-white/20 mb-4"></div>
                  <p className="text-[13px] text-gray-400 mb-4 flex-grow">
                    {car.year} - {car.mileage || 'N/A'} - {car.exteriorColor || 'N/A'}
                  </p>
                  <p className="text-base font-bold tracking-wide text-white">
                    {formatPrice(car.countryPrices)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
