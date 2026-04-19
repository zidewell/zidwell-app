"use client"
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

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
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/payment-page/list");
      if (!response.ok) throw new Error("Failed to fetch pages");
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

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
    console.log("Response OK?", response.ok);
    
    // First get the raw text to see what's coming back
    const rawResponse = await response.text();
    console.log("Raw response:", rawResponse);
    
    // Try to parse as JSON
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
    
    // Return the data directly
    return data;
    
  } catch (error) {
    console.error("Error in createPage:", error);
    throw error;
  }
};
  
  const getPageDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-page/details/${id}`);
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
      await fetchPages();
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
  }, []);

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
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};