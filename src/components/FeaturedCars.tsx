import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocationPricing } from '../context/LocationContext';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function FeaturedCars() {
  const { formatPrice } = useLocationPricing();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'cars'), 
      where('status', '==', 'Available'),
      where('isFeatured', '==', true),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedCars(carsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  return (
    <section className="bg-black py-16 md:py-20" id="showroom">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-4 uppercase">
              Featured Cars
            </h2>
            <div className="w-12 h-[1px] bg-white/30"></div>
          </div>
          <Link 
            to="/showroom" 
            className="group inline-flex items-center gap-4 text-[11px] font-medium tracking-[0.2em] text-white uppercase hover:text-gray-300 transition-colors"
          >
            <span>View All Stock</span>
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-white">Loading featured cars...</div>
        ) : featuredCars.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No featured cars available at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredCars.map((car) => (
              <Link key={car.id} to={`/car/${car.id}`} className="group block bg-black">
                <div className="aspect-[4/3] overflow-hidden mb-6">
                  <img 
                    src={car.images?.[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2071&auto=format&fit=crop'} 
                    alt={`${car.make} ${car.model}`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium tracking-[0.1em] text-white mb-2 uppercase">{car.make} {car.model}</h3>
                    <div className="flex items-center gap-2 text-[11px] tracking-wider text-gray-400 uppercase">
                      <span>{car.year}</span>
                      <span>|</span>
                      <span>{car.mileage || 'N/A'}</span>
                      <span>|</span>
                      <span>{car.exteriorColor || 'N/A'}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium tracking-wider text-white">{formatPrice(car.countryPrices)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
