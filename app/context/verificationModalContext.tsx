// app/context/verificationModalContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface VerificationModalContextType {
  isOpen: boolean;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
}

const VerificationModalContext = createContext<
  VerificationModalContextType | undefined
>(undefined);

export const VerificationModalProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openVerificationModal = () => setIsOpen(true);
  const closeVerificationModal = () => setIsOpen(false);

  return (
    <VerificationModalContext.Provider
      value={{ isOpen, openVerificationModal, closeVerificationModal }}
    >
      {children}
    </VerificationModalContext.Provider>
  );
};

export const useVerificationModal = () => {
  const context = useContext(VerificationModalContext);
  if (context === undefined) {
    throw new Error(
      "useVerificationModal must be used within a VerificationModalProvider",
    );
  }
  return context;
};