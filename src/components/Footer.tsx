import { MapPin, Phone, Mail, Instagram, Youtube, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function Footer() {
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
    <footer className="bg-black py-32 border-t border-white/10" id="contact">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          
          {/* Brand */}
          <div className="flex flex-col">
            <Link to="/" className="flex flex-col items-start mb-10">
              <Logo className="h-10 md:h-12 text-white" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-10 font-light whitespace-pre-wrap">
              {settings.footerDescription || "The ultimate destination for high-end automotive excellence. We specialize in sourcing, selling, and servicing the world's most exclusive luxury and performance vehicles."}
            </p>
            <div className="flex gap-4">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-gray-400">
                  <Instagram size={16} />
                </a>
              )}
              {settings.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-gray-400">
                  <TikTokIcon size={16} />
                </a>
              )}
              {settings.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-gray-400">
                  <Youtube size={16} />
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-gray-400">
                  <Facebook size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-10 uppercase">Quick Links</h3>
            <ul className="space-y-6 text-[11px] tracking-wider uppercase">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><a href="/#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><Link to="/showroom" className="text-gray-400 hover:text-white transition-colors">Showroom</Link></li>
              <li><Link to="/recently-sold" className="text-gray-400 hover:text-white transition-colors">Recently Sold</Link></li>
              <li><Link to="/sourcing" className="text-gray-400 hover:text-white transition-colors">Sourcing</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-10 uppercase">Services</h3>
            <ul className="space-y-6 text-[11px] tracking-wider uppercase">
              <li><Link to="/sourcing" className="text-gray-400 hover:text-white transition-colors">Vehicle Sourcing</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Insurance</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Servicing & Workshops</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Consignment</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-10 uppercase">Contact Us</h3>
            <ul className="space-y-8 text-sm font-light">
              <li className="flex items-center gap-6">
                <Mail size={16} className="text-white opacity-70 shrink-0" />
                <a href={`mailto:${settings.contactEmail || 'sales@apxdealer.co.uk'}`} className="text-gray-400 hover:text-white transition-colors">
                  {settings.contactEmail || 'sales@apxdealer.co.uk'}
                </a>
              </li>
              <li className="flex items-center gap-6">
                <MapPin size={16} className="text-white opacity-70 shrink-0" />
                <span className="text-gray-400">
                  {settings.address || 'Netherlands & Cyprus'}
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-32 pt-10 border-t border-white/10 flex flex-col gap-8 text-[10px] tracking-widest text-gray-500 uppercase">
          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 items-center text-center">
            <span className="text-gray-400">Authorized Global Export Partner</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="text-gray-400">JAAI/JEVIC Inspection Included</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="text-gray-400">Anti-Money Laundering (AML) Policy</span>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-white/5">
            <p>&copy; {new Date().getFullYear()} APX Dealer. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <Link to="/calculator" className="hover:text-white transition-colors">Import Calculator</Link>
              <Link to="/import-guide" className="hover:text-white transition-colors">Import Guide</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
          
          <div className="pt-10 flex justify-center">
            <img 
              src={settings.footerImage || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80"} 
              alt="Footer emblem" 
              className="h-12 w-auto opacity-50 grayscale"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
