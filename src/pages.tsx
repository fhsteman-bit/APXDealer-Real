import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import Hero from './components/Hero';
import FeaturedCars from './components/FeaturedCars';
import AboutSection from './components/AboutSection';
import ServicesSection from './components/ServicesSection';
import RecentlySold from './components/RecentlySold';
import SocialGrid from './components/SocialGrid';
import ContactSection from './components/ContactSection';
import ShowroomPage from './components/ShowroomPage';
import CarDetailsPage from './components/CarDetailsPage';
import RecentlySoldPageComponent from './components/RecentlySoldPage';
import SoldCarDetailsPageComponent from './components/SoldCarDetailsPage';

import MediaPage from './components/MediaPage';
import LogoDraftsPage from './pages/LogoDrafts';

export function Home() {
  return (
    <>
      <Hero />
      <FeaturedCars />
      <AboutSection />
      <SocialGrid />
      <ServicesSection />
    </>
  );
}

export function Showroom() {
  return (
    <div className="pt-24 min-h-screen bg-black">
      <ShowroomPage />
    </div>
  );
}

export function CarDetails() {
  return (
    <div className="pt-24 min-h-screen bg-black">
      <CarDetailsPage />
    </div>
  );
}

export function RecentlySoldPage() {
  return (
    <div className="bg-black">
      <RecentlySoldPageComponent />
    </div>
  );
}

export function SoldCarDetails() {
  return (
    <div className="pt-24 min-h-screen bg-black">
      <SoldCarDetailsPageComponent />
    </div>
  );
}

export function Sourcing() {
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
    <div className="pt-24 min-h-screen bg-black">
      <section className="py-32 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-6 uppercase">Vehicle Sourcing</h2>
          <div className="w-12 h-[1px] bg-white/30 mx-auto mb-12"></div>
          <p className="max-w-3xl mx-auto text-gray-400 font-light leading-relaxed whitespace-pre-wrap">
            {settings.sourcingText || "With our extensive global network and deep industry knowledge, we specialize in sourcing the most exclusive and hard-to-find vehicles. Whether you are looking for a limited-production hypercar or a classic collector's piece, our dedicated team will handle the entire acquisition process with absolute discretion and professionalism."}
          </p>
        </div>
      </section>
    </div>
  );
}

export function Media() {
  return (
    <div className="bg-black">
      <MediaPage />
    </div>
  );
}

export function HowWeWork() {
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
    <div className="pt-24 min-h-screen bg-black">
      <section className="py-32 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.1em] text-white mb-6 uppercase">How We Work</h2>
            <div className="w-12 h-[1px] bg-white/30 mx-auto mb-12"></div>
            <p className="max-w-3xl mx-auto text-gray-400 font-light leading-relaxed whitespace-pre-wrap">
              {settings.howWeWorkText || "Our process is designed to provide a seamless, transparent, and premium experience from the moment you inquire to the day you take delivery of your new vehicle."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="bg-black border border-white/10 p-10 text-center hover:border-white/40 transition-colors">
              <div className="text-4xl font-light text-white/20 mb-6">01</div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-4 uppercase">Consultation</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                We begin by understanding your exact requirements, preferences, and timeline to ensure we find the perfect vehicle for you.
              </p>
            </div>
            <div className="bg-black border border-white/10 p-10 text-center hover:border-white/40 transition-colors">
              <div className="text-4xl font-light text-white/20 mb-6">02</div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-4 uppercase">Sourcing & Inspection</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Our team leverages our global network to locate the vehicle. Every car undergoes a rigorous inspection to meet our exacting standards.
              </p>
            </div>
            <div className="bg-black border border-white/10 p-10 text-center hover:border-white/40 transition-colors">
              <div className="text-4xl font-light text-white/20 mb-6">03</div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] text-white mb-4 uppercase">Delivery</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                We handle all paperwork, financing, and logistics, delivering the vehicle directly to you in pristine condition.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Contact() {
  return (
    <div className="pt-24 min-h-screen bg-black">
      <ContactSection />
    </div>
  );
}

export function LogoDrafts() {
  return <LogoDraftsPage />;
}
