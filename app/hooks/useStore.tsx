"use client"
import { ReactNode, createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUserContextData } from "../context/userData";
import { usePathname } from "next/navigation";

export type PageType = "school" | "donation" | "physical" | "digital" | "services" | "real_estate" | "stock" | "savings" | "crypto";

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
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { userData } = useUserContextData();
  const pathname = usePathname();

  // Helper function to check if current route is dashboard/services/payment
  const shouldFetchPages = useCallback(() => {
    // Check if the current path includes dashboard/services/payment
    return pathname?.includes('/dashboard/services/payment') || 
           pathname?.includes('/dashboard/services/payment/');
  }, [pathname]);

  const fetchPages = useCallback(async () => {
    // Only fetch if we're on a page that includes dashboard/services/payment
    if (!shouldFetchPages()) {
      console.log("Skipping API call - not on dashboard/services/payment page. Current path:", pathname);
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    try {
      const response = await fetch("/api/payment-page/list", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched pages:", data.pages?.length || 0);
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
    // Only refresh if we're on a page that includes dashboard/services/payment
    if (!shouldFetchPages()) {
      console.log("Skipping refresh - not on dashboard/services/payment page");
      return;
    }
    
    setLoading(true);
    await fetchPages();
  }, [fetchPages, shouldFetchPages]);

  const createPage = async (pageData: any) => {
    console.log("Creating page with data:", pageData);

    try {
      const response = await fetch("/api/payment-page/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      });

      console.log("Response status:", response.status);
      
      const rawResponse = await response.text();
      console.log("Raw response:", rawResponse);
      
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        throw new Error("Invalid response from server");
      }
      
      console.log("Parsed data:", data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to create page: ${response.status}`);
      }

      if (!data || (!data.page && !data.slug)) {
        console.error("Missing page/slug property in response:", data);
        throw new Error("Server returned invalid response - missing page data");
      }

      console.log("Page created successfully:", data);
      
      // Refresh the pages list after creation
      await refreshPages();
      
      return data;
      
    } catch (error) {
      console.error("Error in createPage:", error);
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
        headers: {
          "Content-Type": "application/json"
        },
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

  // Fetch pages on mount and when the window gets focus, but only on allowed routes
  useEffect(() => {
    fetchPages();
    
    // Optional: Refetch when window gets focus (tab becomes active)
    const handleFocus = () => {
      console.log("Window focused, checking if should refresh pages...");
      if (shouldFetchPages()) {
        console.log("Refreshing pages...");
        fetchPages();
      } else {
        console.log("Skipping refresh - not on dashboard/services/payment page");
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPages, shouldFetchPages]);

  // Also re-fetch when pathname changes
  useEffect(() => {
    if (shouldFetchPages() && initialFetchDone) {
      console.log("Path changed to dashboard/services/payment, fetching pages...");
      fetchPages();
    } else if (!shouldFetchPages() && !initialFetchDone) {
      // If not on the right page and initial fetch hasn't been done, just set loading to false
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
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};