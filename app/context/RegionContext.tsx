// app/contexts/RegionContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Region = 'global' | 'nigeria';

interface RegionContextType {
  region: Region | null;
  setRegion: (r: Region) => void;
  clearRegion: () => void;
  isNigeria: boolean;
  isGlobal: boolean;
  currency: 'NGN' | 'USD';
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | null>(null);
const STORAGE_KEY = 'zidwell_region';

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Check localStorage first
        const saved = localStorage.getItem(STORAGE_KEY) as Region | null;
        if (saved === 'global' || saved === 'nigeria') {
          setRegionState(saved);
          setIsLoading(false);
          return;
        }

        // Try to detect from timezone
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          if (tz === 'Africa/Lagos') {
            setRegionState('nigeria');
            localStorage.setItem(STORAGE_KEY, 'nigeria');
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to IP detection
        }

        // Fallback to IP detection
        try {
          const response = await fetch('https://ipapi.co/country/');
          const code = await response.text();
          const country = (code || '').trim().toUpperCase();
          if (country === 'NG') {
            setRegionState('nigeria');
            localStorage.setItem(STORAGE_KEY, 'nigeria');
          } else if (country && country.length === 2) {
            setRegionState('global');
            localStorage.setItem(STORAGE_KEY, 'global');
          }
        } catch {
          // If all detection fails, default to global
          setRegionState('global');
          localStorage.setItem(STORAGE_KEY, 'global');
        }
      } catch {
        setRegionState('global');
        localStorage.setItem(STORAGE_KEY, 'global');
      } finally {
        setIsLoading(false);
      }
    };

    detectCountry();
  }, []);

  const setRegion = (r: Region) => {
    setRegionState(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  const clearRegion = () => {
    setRegionState(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('zidwell_plan_selected');
  };

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion,
        clearRegion,
        isNigeria: region === 'nigeria',
        isGlobal: region === 'global',
        currency: region === 'nigeria' ? 'NGN' : 'USD',
        isLoading,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return ctx;
}