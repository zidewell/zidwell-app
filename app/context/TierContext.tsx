// app/contexts/TierContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserTier, TIERS } from '@/types/tier';

interface TierContextType {
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  hasSelectedPlan: boolean;
  selectPlan: (tier: UserTier) => void;
  clearSelection: () => void;
  isLite: boolean;
  isPremium: boolean;
  isBusiness: boolean;
  hasBankSync: boolean;
  hasStatementUpload: boolean;
  accountLimit: number;
  canAccess: (required: UserTier) => boolean;
  isLoading: boolean;
}

const TierContext = createContext<TierContextType | null>(null);
const STORAGE_KEY = 'zidwell_user_tier';
const SELECTED_KEY = 'zidwell_plan_selected';

const TIER_RANK: Record<UserTier, number> = { 
  free: 0, 
  lite: 1, 
  premium: 2, 
  business: 3 
};

const DEFAULT_TIER: UserTier = 'free';

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<UserTier>(DEFAULT_TIER);
  const [hasSelectedPlan, setHasSelectedPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserTier | null;
    
    // Handle legacy 'elite' tier
    if (saved === ('elite' as UserTier)) {
      setTierState('business');
      localStorage.setItem(STORAGE_KEY, 'business');
    } else if (saved && TIER_RANK[saved] !== undefined) {
      setTierState(saved);
    } else {
      setTierState(DEFAULT_TIER);
      localStorage.setItem(STORAGE_KEY, DEFAULT_TIER);
    }
    
    setHasSelectedPlan(localStorage.getItem(SELECTED_KEY) === '1');
    setIsLoading(false);
  }, []);

  const setTier = (t: UserTier) => {
    setTierState(t);
    localStorage.setItem(STORAGE_KEY, t);
  };

  const selectPlan = (t: UserTier) => {
    setTier(t);
    localStorage.setItem(SELECTED_KEY, '1');
    setHasSelectedPlan(true);
  };

  const clearSelection = () => {
    localStorage.removeItem(SELECTED_KEY);
    setHasSelectedPlan(false);
    setTierState(DEFAULT_TIER);
    localStorage.setItem(STORAGE_KEY, DEFAULT_TIER);
  };

  const canAccess = (required: UserTier) => {
    return TIER_RANK[tier] >= TIER_RANK[required];
  };

  return (
    <TierContext.Provider
      value={{
        tier,
        setTier,
        hasSelectedPlan,
        selectPlan,
        clearSelection,
        isLite: canAccess('lite'),
        isPremium: canAccess('premium'),
        isBusiness: tier === 'business',
        hasBankSync: canAccess('premium'),
        hasStatementUpload: canAccess('lite'),
        accountLimit: TIERS[tier]?.accountLimit || 0,
        canAccess,
        isLoading,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return ctx;
}