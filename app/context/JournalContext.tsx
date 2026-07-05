// app/contexts/JournalContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { useJournalStore } from '../hooks/useJournalStore';

type JournalContextType = ReturnType<typeof useJournalStore>;

const JournalContext = createContext<JournalContextType | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const store = useJournalStore();
  
  return (
    <JournalContext.Provider value={store}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}