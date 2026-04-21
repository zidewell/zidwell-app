"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface VerificationModalContextType {
  isOpen: boolean;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
}

const VerificationModalContext = createContext<VerificationModalContextType | undefined>(undefined);

export const useVerificationModal = () => {
  const context = useContext(VerificationModalContext);
  if (!context) {
    throw new Error("useVerificationModal must be used within a VerificationModalProvider");
  }
  return context;
};

interface VerificationModalProviderProps {
  children: ReactNode;
}

export const VerificationModalProvider = ({ children }: VerificationModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Reset modal state on component mount (handles page refresh)
  useEffect(() => {
    // Check if there's any stuck modal state from previous session
    const modalState = sessionStorage.getItem('modalOpen');
    if (modalState === 'true') {
      sessionStorage.removeItem('modalOpen');
      setIsOpen(false);
    }
    
    // Cleanup function to ensure modal is closed on unmount
    return () => {
      setIsOpen(false);
      sessionStorage.removeItem('modalOpen');
    };
  }, []);

  const openVerificationModal = () => {
    setIsOpen(true);
    // Store in sessionStorage to handle refresh if needed
    sessionStorage.setItem('modalOpen', 'true');
  };
  
  const closeVerificationModal = () => {
    setIsOpen(false);
    sessionStorage.removeItem('modalOpen');
  };

  return (
    <VerificationModalContext.Provider
      value={{
        isOpen,
        openVerificationModal,
        closeVerificationModal,
      }}
    >
      {children}
    </VerificationModalContext.Provider>
  );
};