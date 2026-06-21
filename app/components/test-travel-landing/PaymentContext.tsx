// contexts/PaymentContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PaymentContextType {
  embedCode: string;
  setEmbedCode: (code: string) => void;
  isCustomCode: boolean;
  setIsCustomCode: (value: boolean) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [embedCode, setEmbedCode] = useState<string>(
    `<a href="https://www.zidwell.com/pay/web-dev-9188" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>`
  );
  const [isCustomCode, setIsCustomCode] = useState(false);

  return (
    <PaymentContext.Provider
      value={{ embedCode, setEmbedCode, isCustomCode, setIsCustomCode }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
}