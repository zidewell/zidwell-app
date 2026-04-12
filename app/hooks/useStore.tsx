import { ReactNode, createContext, useContext, useState } from "react";

export type PageType = "school" | "donation" | "physical" | "digital" | "services" | "real_estate" | "stock" | "savings" | "crypto";

export const isInvestmentType = (t: PageType) => ["real_estate", "stock", "savings", "crypto"].includes(t);

export interface Student {
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
}

export interface FeeItem {
  label: string;
  amount: number;
}

export interface Variant {
  name: string;
  options: string[];
}

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open";
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer";
  virtualAccount: string;
  bankName: string;
  totalRevenue: number;
  totalPayments: number;
  pageViews: number;
  createdAt: string;
  pageType: PageType;
  // School
  students?: Student[];
  className?: string;
  requiredFields?: string[];
  feeBreakdown?: FeeItem[];
  // Donation
  suggestedAmounts?: number[];
  showDonorList?: boolean;
  allowDonorMessage?: boolean;
  // Physical
  variants?: Variant[];
  requiresShipping?: boolean;
  // Digital
  downloadUrl?: string;
  accessLink?: string;
  emailDelivery?: boolean;
  // Services
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
  // Investment (shared across real_estate, stock, savings, crypto)
  minimumAmount?: number;
  expectedReturn?: string;
  tenure?: string;
  paymentFrequency?: "one-time" | "recurring";
  charges?: string;
  termsAndConditions?: string;
  riskExplanation?: string;
  // Trust signals
  cacCertificate?: string;
  taxClearance?: string;
  explainerVideo?: string;
  socialLinks?: { platform: string; url: string }[];
  website?: string;
  contactInfo?: string;
  // Investment analytics
  totalInvestments?: number;
  totalParticipants?: number;
}

interface StoreContextType {
  pages: PaymentPage[];
  addPage: (page: PaymentPage) => void;
}

const StoreContext = createContext<StoreContextType>({
  pages: [],
  addPage: () => {},
});

export const useStore = () => useContext(StoreContext);

const generateAccount = () => ({
  virtualAccount: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  bankName: "Wema Bank",
});

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<PaymentPage[]>([]);

  const addPage = (page: PaymentPage) => {
    const { virtualAccount, bankName } = generateAccount();
    setPages((prev) => [
      ...prev,
      {
        ...page,
        virtualAccount,
        bankName,
        totalRevenue: 0,
        totalPayments: 0,
        pageViews: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <StoreContext.Provider value={{ pages, addPage }}>
      {children}
    </StoreContext.Provider>
  );
};
