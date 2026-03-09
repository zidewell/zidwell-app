"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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

  const openVerificationModal = () => setIsOpen(true);
  const closeVerificationModal = () => setIsOpen(false);

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