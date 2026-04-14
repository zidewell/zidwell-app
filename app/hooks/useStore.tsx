// app/hooks/useStore.ts (updated with user profile data)
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";

export type PageType = "school" | "donation" | "physical" | "digital" | "services" | "real_estate" | "stock" | "savings" | "crypto";

// Export these types for use in components
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

// Export this function to check if a page type is investment-related
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
  // Legacy fields for backward compatibility with create page
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

// Extended user type with profile data
export interface AppUser extends User {
  profile_picture?: string;
  full_name?: string;
}

interface StoreContextType {
  pages: PaymentPage[];
  user: AppUser | null;
  loading: boolean;
  fetchPages: () => Promise<void>;
  createPage: (pageData: any) => Promise<any>;
  getPageDetails: (id: string) => Promise<any>;
  withdrawFromPage: (pageId: string, amount: number) => Promise<any>;
  addPage: (page: PaymentPage) => void;
}

const StoreContext = createContext<StoreContextType>({
  pages: [],
  user: null,
  loading: true,
  fetchPages: async () => {},
  createPage: async () => {},
  getPageDetails: async () => {},
  withdrawFromPage: async () => {},
  addPage: () => {},
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchPages = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch("/api/payment-page/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch pages");
      
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const createPage = async (pageData: any) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/payment-page/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create page");
      }

      const data = await response.json();
      await fetchPages();
      return data.page;
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  };

  const getPageDetails = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/payment-page/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch page details");

      const data = await response.json();
      return data.page;
    } catch (error) {
      console.error("Error fetching page details:", error);
      throw error;
    }
  };

  const withdrawFromPage = async (pageId: string, amount: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/payment-page/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch user profile data from users table
        const { data: userData } = await supabase
          .from("users")
          .select("profile_picture, full_name")
          .eq("id", authUser.id)
          .single();

        // Merge auth user with profile data
        const appUser: AppUser = {
          ...authUser,
          profile_picture: userData?.profile_picture || authUser.user_metadata?.avatar_url,
          full_name: userData?.full_name || authUser.user_metadata?.full_name || authUser.email,
        };
        
        setUser(appUser);
        await fetchPages();
      }
      
      setLoading(false);
    };
    init();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        pages,
        user,
        loading,
        fetchPages,
        createPage,
        getPageDetails,
        withdrawFromPage,
        addPage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};