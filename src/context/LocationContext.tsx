import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  userCountry: string | null;
  setUserCountry: (country: string) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  hasTurkeyPermit: boolean | null;
  setHasTurkeyPermit: (hasPermit: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userCountry, setUserCountryState] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasTurkeyPermit, setHasTurkeyPermitState] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedCountry = localStorage.getItem('userCountry');
    const storedTurkeyPermit = localStorage.getItem('hasTurkeyPermit');
    
    if (storedCountry) {
      setUserCountryState(storedCountry);
    } else {
      setShowLocationModal(true);
    }
    
    if (storedTurkeyPermit !== null) {
      setHasTurkeyPermitState(storedTurkeyPermit === 'true');
    }
    
    setIsInitialized(true);
  }, []);

  const setUserCountry = (country: string) => {
    setUserCountryState(country);
    localStorage.setItem('userCountry', country);
    
    if (country !== 'Turkey') {
      setHasTurkeyPermitState(null);
      localStorage.removeItem('hasTurkeyPermit');
      setShowLocationModal(false);
    }
    // If Turkey is selected, we keep the modal open to ask for the permit, or handle it in the modal itself.
  };

  const setHasTurkeyPermit = (hasPermit: boolean) => {
    setHasTurkeyPermitState(hasPermit);
    localStorage.setItem('hasTurkeyPermit', hasPermit.toString());
    setShowLocationModal(false);
  };

  if (!isInitialized) return null;

  return (
    <LocationContext.Provider value={{ userCountry, setUserCountry, showLocationModal, setShowLocationModal, hasTurkeyPermit, setHasTurkeyPermit }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}

export function useLocationPricing() {
  const { userCountry } = useLocationContext();

  const formatPrice = (countryPrices?: Record<string, number>) => {
    if (!countryPrices) return 'Price on Request';

    // Try to get price for user's country, fallback to Global
    let basePrice = null;
    if (userCountry && countryPrices[userCountry]) {
      basePrice = countryPrices[userCountry];
    } else if (countryPrices['Global']) {
      basePrice = countryPrices['Global'];
    }

    if (basePrice !== null) {
      // Add $1,000 buffer for unexpected port storage or inspection fees
      const finalPrice = basePrice + 1000;
      
      const formattedNumber = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(finalPrice);
      return `€${formattedNumber}`;
    }
    
    return 'Price on Request';
  };

  return { formatPrice };
}
