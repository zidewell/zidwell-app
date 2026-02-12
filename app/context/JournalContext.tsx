"use client"
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useJournalStore } from '../hooks/useJournalStore';

const JournalContext = createContext<ReturnType<typeof useJournalStore> | undefined>(undefined);

export function JournalProvider({ children }: { children: ReactNode }) {
  const journalStore = useJournalStore();
  

  const value = useMemo(() => journalStore, [
    journalStore.entries, 
    journalStore.categories, 
    journalStore.activeJournalType,
    journalStore.loading,
    journalStore.error,
    journalStore.updateTrigger
  ]);
  
  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}