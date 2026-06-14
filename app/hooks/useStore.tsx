"use client";
import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUserContextData } from "../context/userData";
import { usePathname } from "next/navigation";

export type PageType = "school" | "donation" | "physical" | "digital" | "services" | "real_estate" | "stock" | "savings" | "crypto" | "link";

export interface Student {
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
  paidAmount?: number;
  paidAt?: string;
  parentName?: string;
}

export interface FeeItem {
  label: string;
  amount: number;
}

export interface Variant {
  name: string;
  options: string[];
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown" | "checkbox" | "paragraph";
  required: boolean;
  options?: string[];
}

export interface LinkConfig {
  currency: "NGN" | "USD" | "GBP" | "EUR";
  amountMode: "fixed" | "variable";
  active: boolean;
  brandColor: string;
  buttonColor: string;
  buttonText: string;
  successMessage: string;
  thankYouMessage: string;
  redirectUrl?: string;
  altRedirectUrl?: string;
  referenceCode?: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  nameRequired: boolean;
  emailRequired: boolean;
  phoneRequired: boolean;
  customFields: CustomField[];
  qrColor: string;
  qrBackground: string;
  qrFrame: "round" | "rounded" | "square";
}

export const isInvestmentType = (t: PageType) => {
  return ["real_estate", "stock", "savings", "crypto"].includes(t);
};

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
  pageBalance: number;
  totalRevenue: number;
  totalPayments: number;
  pageViews: number;
  createdAt: string;
  pageType: PageType;
  isPublished: boolean;
  metadata: any;
  virtualAccount?: string;
  bankName?: string;
  students?: Student[];
  className?: string;
  requiredFields?: string[];
  feeBreakdown?: FeeItem[];
  suggestedAmounts?: number[];
  showDonorList?: boolean;
  allowDonorMessage?: boolean;
  variants?: Variant[];
  requiresShipping?: boolean;
  downloadUrl?: string;
  accessLink?: string;
  emailDelivery?: boolean;
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
  minimumAmount?: number;
  expectedReturn?: string;
  tenure?: string;
  charges?: string;
  paymentFrequency?: "one-time" | "recurring";
  termsAndConditions?: string;
  riskExplanation?: string;
  cacCertificate?: string;
  taxClearance?: string;
  explainerVideo?: string;
  socialLinks?: { platform: string; url: string }[];
  website?: string;
  contactInfo?: string;
  totalInvestments?: number;
  totalParticipants?: number;
  linkConfig?: LinkConfig;
  submissions?: any[];
}

interface StoreContextType {
  pages: PaymentPage[];
  loading: boolean;
  fetchPages: () => Promise<void>;
  createPage: (pageData: any) => Promise<any>;
  getPageDetails: (id: string) => Promise<any>;
  getPageStats: (id: string) => Promise<{ payments: any[], totalAmount: number, totalCount: number }>;
  withdrawFromPage: (pageId: string, amount: number) => Promise<any>;
  addPage: (page: PaymentPage) => void;
  refreshPages: () => Promise<void>;
  updatePage: (id: string, pageData: any) => Promise<any>;
}

const StoreContext = createContext<StoreContextType>({
  pages: [],
  loading: true,
  fetchPages: async () => {},
  createPage: async () => {},
  getPageDetails: async () => {},
  getPageStats: async () => ({ payments: [], totalAmount: 0, totalCount: 0 }),
  withdrawFromPage: async () => {},
  addPage: () => {},
  refreshPages: async () => {},
  updatePage: async () => {},
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { userData } = useUserContextData();
  const pathname = usePathname();

  const shouldFetchPages = useCallback(() => {
    return pathname?.includes('/dashboard/services/payment') || 
           pathname?.includes('/dashboard/services/payment/');
  }, [pathname]);

  const fetchPages = useCallback(async () => {
    if (!shouldFetchPages()) {
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    try {
      const response = await fetch("/api/payment-page/list", {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      
      const data = await response.json();
      setPages(data.pages || []);
      return data;
    } catch (error) {
      console.error("Error fetching pages:", error);
      setPages([]);
      throw error;
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, [shouldFetchPages, pathname]);

  const refreshPages = useCallback(async () => {
    if (!shouldFetchPages()) return;
    setLoading(true);
    await fetchPages();
  }, [fetchPages, shouldFetchPages]);

  const createPage = async (pageData: any) => {
    try {
      const response = await fetch("/api/payment-page/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      });
      
      const rawResponse = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid response from server");
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to create page: ${response.status}`);
      }
      
      await refreshPages();
      return data;
    } catch (error) {
      console.error("Error in createPage:", error);
      throw error;
    }
  };
  
  const updatePage = async (id: string, pageData: any) => {
    try {
      const response = await fetch(`/api/payment-page/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
      });

      const rawResponse = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to update page: ${response.status}`);
      }
      
      await refreshPages();
      return data;
    } catch (error) {
      console.error("Error in updatePage:", error);
      throw error;
    }
  };
  
  const getPageDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-page/details/${id}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error("Failed to fetch page details");
      const data = await response.json();
      return data.page;
    } catch (error) {
      console.error("Error fetching page details:", error);
      throw error;
    }
  };

  const getPageStats = async (id: string) => {
    try {
      const pageDetails = await getPageDetails(id);
      return {
        payments: pageDetails?.recentPayments || [],
        totalAmount: pageDetails?.paymentStats?.totalAmount || 0,
        totalCount: pageDetails?.paymentStats?.totalCount || 0,
      };
    } catch (error) {
      console.error("Error fetching page stats:", error);
      return { payments: [], totalAmount: 0, totalCount: 0 };
    }
  };

  const withdrawFromPage = async (pageId: string, amount: number) => {
    try {
      const response = await fetch("/api/payment-page/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Withdrawal failed");
      }

      const data = await response.json();
      await refreshPages(); 
      return data.withdrawal;
    } catch (error) {
      console.error("Error withdrawing:", error);
      throw error;
    }
  };

  const addPage = (page: PaymentPage) => {
    setPages((prev) => [page, ...prev]);
  };

  useEffect(() => {
    fetchPages();
    
    const handleFocus = () => {
      if (shouldFetchPages()) fetchPages();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchPages, shouldFetchPages]);

  useEffect(() => {
    if (shouldFetchPages() && initialFetchDone) {
      fetchPages();
    } else if (!shouldFetchPages() && !initialFetchDone) {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, [pathname, shouldFetchPages, fetchPages, initialFetchDone]);

  return (
    <StoreContext.Provider
      value={{
        pages,
        loading,
        fetchPages,
        createPage,
        getPageDetails,
        getPageStats,
        withdrawFromPage,
        addPage,
        refreshPages,
        updatePage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};