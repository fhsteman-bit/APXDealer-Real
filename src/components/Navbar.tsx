import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLocationContext } from '../context/LocationContext';
import Logo from './Logo';

interface NavbarProps {
  onHoverChange: (isHovered: boolean) => void;
}

const BRANDS = [
  'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Ferrari', 'Jaguar',
  'Koenigsegg', 'Lamborghini', 'Land Rover', 'Lexus', 'Maserati', 'Maybach',
  'McLaren', 'Mercedes', 'Pagani', 'Porsche', 'Rolls Royce'
];

const NAV_ITEMS = [
  { name: 'HOME', path: '/' },
  { name: 'SHOWROOM', path: '/showroom' },
  { name: 'RECENTLY SOLD', path: '/recently-sold' },
  { name: 'SOURCING', path: '/sourcing' },
  { name: 'HOW WE WORK', path: '/how-we-work' },
  { name: 'MEDIA', path: '/media' },
  { name: 'CONTACT', path: '/contact' },
];

export default function Navbar({ onHoverChange }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { userCountry, setShowLocationModal } = useLocationContext();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (menu: string) => {
    setActiveDropdown(menu);
    onHoverChange(true);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
    onHoverChange(false);
  };

  const isTransparentHome = location.pathname === '/' && !scrolled && !isMobileMenuOpen && activeDropdown === null;
  const logoColorClass = isTransparentHome ? 'text-black hover:text-white' : 'text-white';
  const activeLinkColorClass = isTransparentHome ? 'text-black hover:text-white' : 'text-white';
  const inactiveLinkColorClass = isTransparentHome ? 'text-black/70 hover:text-white' : 'text-gray-300 hover:text-white';
  const iconColorClass = isTransparentHome ? 'text-black hover:text-white' : 'text-gray-300 hover:text-white';

  return (
    <>
      {/* Main Navbar */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled || isMobileMenuOpen ? 'bg-black/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex flex-col items-start">
                <Logo className={`h-8 md:h-10 transition-colors duration-300 ${logoColorClass}`} />
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.name}
                  className="relative group h-20 flex items-center"
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to={item.path}
                    className={`text-[11px] font-medium tracking-[0.15em] transition-colors duration-300 flex items-center gap-1 uppercase ${location.pathname === item.path ? activeLinkColorClass : inactiveLinkColorClass}`}
                  >
                    {item.name}
                    {item.name === 'SHOWROOM' && <ChevronDown size={12} className="transition-transform group-hover:rotate-180 ml-1" />}
                  </Link>

                  {/* Mega Menu for Showroom */}
                  {item.name === 'SHOWROOM' && activeDropdown === 'SHOWROOM' && (
                    <div className="fixed top-20 left-0 w-full bg-black border-b border-white/10 shadow-2xl cursor-default">
                      <div className="w-full px-8 lg:px-16 py-12 grid grid-cols-6 gap-10">
                        <div className="col-span-1 border-r border-white/10 pr-10">
                          <h3 className="text-[10px] font-medium tracking-[0.2em] text-gray-500 mb-6 uppercase">Inventory</h3>
                          <ul className="space-y-4">
                            <li>
                              <Link to="/showroom" className="text-xs tracking-wider text-gray-300 hover:text-white transition-colors uppercase">View All Stock</Link>
                            </li>
                            <li>
                              <Link to="/recently-sold" className="text-xs tracking-wider text-gray-300 hover:text-white transition-colors uppercase">Recently Added</Link>
                            </li>
                          </ul>
                        </div>
                        <div className="col-span-5">
                          <h3 className="text-[10px] font-medium tracking-[0.2em] text-gray-500 mb-6 uppercase">Browse Marques</h3>
                          <div className="grid grid-cols-5 md:grid-cols-7 gap-y-6 gap-x-8">
                            {BRANDS.map(brand => (
                              <Link 
                                key={brand} 
                                to={`/showroom?make=${encodeURIComponent(brand)}`} 
                                onClick={() => {
                                  setActiveDropdown(null);
                                  onHoverChange(false);
                                  setIsMobileMenuOpen(false);
                                }}
                                className="text-xs tracking-wider text-gray-400 hover:text-white transition-colors uppercase"
                              >
                                {brand}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button 
                onClick={() => setShowLocationModal(true)}
                className={`flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] transition-all duration-300 uppercase border px-3 py-1.5 rounded-full ${
                  scrolled || activeDropdown !== null || isMobileMenuOpen || location.pathname !== '/'
                    ? 'border-white/20 hover:border-white/50 hover:bg-white/10 text-white'
                    : 'border-black/10 hover:border-black/30 hover:bg-black/5 text-black'
                }`}
              >
                <MapPin size={12} />
                {userCountry || 'Location'}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={() => setShowLocationModal(true)}
                className={`flex items-center gap-2 text-[10px] font-medium tracking-[0.15em] transition-all duration-300 uppercase border px-3 py-1.5 rounded-full ${
                  scrolled || activeDropdown !== null || isMobileMenuOpen || location.pathname !== '/'
                    ? 'border-white/20 hover:border-white/50 hover:bg-white/10 text-white'
                    : 'border-black/10 hover:border-black/30 hover:bg-black/5 text-black'
                }`}
              >
                <MapPin size={12} />
                <span className="hidden sm:inline">{userCountry || 'Location'}</span>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 transition-colors duration-300 ${iconColorClass}`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-white/10">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-4 text-xs font-medium tracking-[0.15em] hover:text-white hover:bg-white/5 border-b border-white/5 uppercase ${location.pathname === item.path ? 'text-white bg-white/5' : 'text-gray-300'}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
