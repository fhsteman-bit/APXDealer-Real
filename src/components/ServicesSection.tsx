import { Shield, CreditCard, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function ServicesSection() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const SERVICES = [
    {
      icon: <Search className="w-6 h-6 text-white" />,
      title: settings.service1Title || 'Vehicle Sourcing',
      description: settings.service1Desc || 'Looking for a specific rare model? Our global network allows us to source the exact specification you desire.',
      link: '/sourcing'
    },
    {
      icon: <CreditCard className="w-6 h-6 text-white" />,
      title: settings.service2Title || 'Bespoke Financing',
      description: settings.service2Desc || 'Tailored financial solutions designed specifically for high-value assets, ensuring a seamless acquisition process.',
      link: '/contact'
    },
    {
      icon: <Shield className="w-6 h-6 text-white" />,
      title: settings.service3Title || 'Premium Insurance',
      description: settings.service3Desc || 'Comprehensive coverage options from specialized providers who understand the true value of your exotic vehicle.',
      link: '/contact'
    }
  ];

  return (
    <section className="bg-black py-16 md:py-20 border-t border-white/10" id="services">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-gray-400 text-[10px] font-medium tracking-[0.3em] uppercase mb-6">
            One-Stop Certainty
          </p>
          <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-6 uppercase">
            {settings.servicesTitle || 'OUR SERVICES'}
          </h2>
          <div className="w-12 h-[1px] bg-white/30 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {SERVICES.map((service, index) => {
            const cardContent = (
              <>
                <div className="mb-8 transform group-hover:-translate-y-2 transition-transform duration-500 opacity-70 group-hover:opacity-100">
                  {service.icon}
                </div>
                <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-4 uppercase">
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  {service.description}
                </p>
              </>
            );

            const className = "bg-black border border-white/10 p-10 hover:border-white/40 transition-colors group block h-full";

            return service.link ? (
              <Link key={index} to={service.link} className={className}>
                {cardContent}
              </Link>
            ) : (
              <div key={index} className={className}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
