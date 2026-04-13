import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useVisitorTracking() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      // Don't track admin routes
      if (location.pathname.startsWith('/admin')) return;

      try {
        await addDoc(collection(db, 'analytics'), {
          page: location.pathname,
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp(),
          // Basic device detection
          device: /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          // Basic language/country detection
          language: navigator.language,
        });
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    // Small delay to avoid tracking rapid navigation bounces
    const timeoutId = setTimeout(trackVisit, 2000);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
}
