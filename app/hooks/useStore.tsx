"use client";

import { ReactNode, createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useUserContextData } from "../context/userData"; 
import { usePathname, useRouter } from "next/navigation";

export type PageType = "school" | "donation" | "physical" | "digital" | "services" | "real_estate" | "stock" | "savings" | "crypto" | "link";

export interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  cacNumber?: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  locationEnabled: boolean;
  isActive: boolean;
  is_active?: boolean; // For compatibility
  activation_paid?: boolean;
  createdAt: string;
  ownerId: string;
  walletBalance: number;
  totalRevenue: number;
  totalOrders: number;
  totalViews: number;
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
  pageBalance: number;
  totalRevenue: number;
  totalPayments: number;
  pageViews: number;
  createdAt: string;
  pageType: PageType;
  isPublished: boolean;
  metadata: any;
}

interface StoreContextType {
  store: StoreData | null;
  pages: PaymentPage[];
  loading: boolean;
  creatingStore: boolean;
  hasStore: boolean;
  hasPendingActivation: boolean;
  fetchStore: (force?: boolean) => Promise<void>;
  fetchPages: (force?: boolean) => Promise<void>;
  checkStoreExists: () => Promise<boolean>;
  createStore: (storeData: any) => Promise<StoreData>;
  createPage: (pageData: any) => Promise<any>;
  getPageDetails: (id: string) => Promise<any>;
  getPageStats: (id: string) => Promise<{ payments: any[], totalAmount: number, totalCount: number }>;
  withdrawFromPage: (pageId: string, amount: number) => Promise<any>;
  addPage: (page: PaymentPage) => void;
  refreshPages: () => Promise<void>;
  updatePage: (id: string, pageData: any) => Promise<any>;
  clearCache: () => void;
  updateStore: (data: Partial<StoreData>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  pages: [],
  loading: true,
  creatingStore: false,
  hasStore: false,
  hasPendingActivation: false,
  fetchStore: async () => {},
  fetchPages: async () => {},
  checkStoreExists: async () => false,
  createStore: async () => ({}) as StoreData,
  createPage: async () => {},
  getPageDetails: async () => {},
  getPageStats: async () => ({ payments: [], totalAmount: 0, totalCount: 0 }),
  withdrawFromPage: async () => {},
  addPage: () => {},
  refreshPages: async () => {},
  updatePage: async () => {},
  clearCache: () => {},
  updateStore: async () => {},
});

export const useStore = () => useContext(StoreContext);

// Cache for page details
const pageDetailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to map database store to StoreData
const mapDbStoreToStoreData = (dbStore: any): StoreData | null => {
  if (!dbStore) return null;
  
  return {
    id: dbStore.id,
    name: dbStore.name,
    slug: dbStore.slug,
    description: dbStore.description,
    keywords: dbStore.keywords || [],
    cacNumber: dbStore.cac_number,
    country: dbStore.country,
    state: dbStore.state,
    city: dbStore.city,
    streetAddress: dbStore.street_address,
    locationEnabled: dbStore.location_enabled !== false,
    isActive: dbStore.is_active === true,
    is_active: dbStore.is_active,
    activation_paid: dbStore.activation_paid,
    createdAt: dbStore.created_at,
    ownerId: dbStore.owner_id,
    walletBalance: dbStore.wallet_balance || 0,
    totalRevenue: dbStore.total_revenue || 0,
    totalOrders: dbStore.total_orders || 0,
    totalViews: dbStore.total_views || 0,
  };
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [store, setStore] = useState<StoreData | null>(null);
  const [pages, setPages] = useState<PaymentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingStore, setCreatingStore] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { userData } = useUserContextData();
  const pathname = usePathname();

  // === REFS TO BREAK CIRCULAR DEPENDENCIES ===
  const storeRef = useRef<StoreData | null>(null);
  const pagesRef = useRef<PaymentPage[]>([]);
  const creatingStoreRef = useRef(false);
  const pathnameRef = useRef(pathname);
  const hasCheckedStoreRef = useRef(false);
  const storeCheckPromiseRef = useRef<Promise<boolean> | null>(null);
  const storeCreationRef = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const fetchStoreInProgress = useRef(false);
  const fetchPagesInProgress = useRef(false);
  const FETCH_COOLDOWN = 10000;

  // Sync refs with state
  useEffect(() => { storeRef.current = store; }, [store]);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { creatingStoreRef.current = creatingStore; }, [creatingStore]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const shouldFetchStore = useCallback(() => {
    const path = pathnameRef.current;
    return path?.includes('/dashboard/services/payment/dashboard') || 
           path?.includes('/store/');
  }, []);

  // Check if user has a store
  const checkStoreExists = useCallback(async (): Promise<boolean> => {
    if (storeRef.current) return true;
    if (hasCheckedStoreRef.current && !storeRef.current) return false;
    if (creatingStoreRef.current || storeCreationRef.current) return false;

    if (storeCheckPromiseRef.current) {
      return await storeCheckPromiseRef.current;
    }

    storeCheckPromiseRef.current = (async (): Promise<boolean> => {
      try {
        const response = await fetch("/api/store", {
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.status === 404) {
          hasCheckedStoreRef.current = true;
          return false;
        }

        if (response.ok) {
          const data = await response.json();
          const hasStoreData = data.store !== null && data.store !== undefined;

          if (hasStoreData) {
            const mappedStore = mapDbStoreToStoreData(data.store);
            setStore(mappedStore);
            lastFetchTime.current = Date.now();
          } else {
            setStore(null);
          }

          hasCheckedStoreRef.current = true;
          return hasStoreData;
        }

        hasCheckedStoreRef.current = true;
        return false;
      } catch (error) {
        console.error("Error checking store:", error);
        hasCheckedStoreRef.current = true;
        return false;
      } finally {
        storeCheckPromiseRef.current = null;
        setLoading(false);
        setInitialFetchDone(true);
      }
    })();

    return await storeCheckPromiseRef.current;
  }, []);

  const fetchStore = useCallback(async (force = false): Promise<void> => {
    if (storeRef.current && !force) {
      return;
    }

    if (creatingStoreRef.current || storeCreationRef.current) {
      return;
    }

    if (fetchStoreInProgress.current) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTime.current < FETCH_COOLDOWN && storeRef.current) {
      return;
    }

    if (!shouldFetchStore()) {
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    fetchStoreInProgress.current = true;

    try {
      const response = await fetch("/api/store", {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.status === 404) {
        setStore(null);
        hasCheckedStoreRef.current = true;
        setLoading(false);
        setInitialFetchDone(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch store: ${response.status}`);
      }

      const data = await response.json();

      if (!data.store) {
        setStore(null);
        hasCheckedStoreRef.current = true;
        setLoading(false);
        setInitialFetchDone(true);
        return;
      }

      const mappedStore = mapDbStoreToStoreData(data.store);
      setStore(mappedStore);
      hasCheckedStoreRef.current = true;
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error("Error fetching store:", error);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
      fetchStoreInProgress.current = false;
    }
  }, [shouldFetchStore]);

  const fetchPages = useCallback(async (force = false): Promise<void> => {
    const hasStore = await checkStoreExists();

    if (!hasStore) {
      setPages([]);
      return;
    }

    if (creatingStoreRef.current || storeCreationRef.current) {
      return;
    }

    if (fetchPagesInProgress.current) return;

    const now = Date.now();
    if (!force && now - lastFetchTime.current < FETCH_COOLDOWN && pagesRef.current.length > 0) {
      return;
    }

    if (!shouldFetchStore()) {
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    fetchPagesInProgress.current = true;

    try {
      const response = await fetch("/api/payment-page/list", {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }

      const data = await response.json();
      setPages(data.pages || []);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error("Error fetching pages:", error);
      setPages([]);
      throw error;
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
      fetchPagesInProgress.current = false;
    }
  }, [shouldFetchStore, checkStoreExists]);

  const createStore = async (storeData: any): Promise<StoreData> => {
    storeCreationRef.current = true;
    setCreatingStore(true);

    try {
      const response = await fetch("/api/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
      });

      const rawResponse = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to create store: ${response.status}`);
      }

      const mappedStore = mapDbStoreToStoreData(data.store);
      setStore(mappedStore);
      hasCheckedStoreRef.current = true;
      lastFetchTime.current = Date.now();

      fetchStoreInProgress.current = false;

      setTimeout(() => {
        storeCreationRef.current = false;
        setCreatingStore(false);
        fetchStore(true);
      }, 1000);

      const shouldRedirect = mappedStore?.isActive === true;
      if (shouldRedirect) {
        router.push("/dashboard/services/payment/dashboard");
      }

      return mappedStore!;
    } catch (error) {
      console.error("Error creating store:", error);
      storeCreationRef.current = false;
      setCreatingStore(false);
      throw error;
    }
  };

  const updateStore = async (data: Partial<StoreData>): Promise<void> => {
    try {
      const response = await fetch("/api/store/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update store: ${response.status}`);
      }

      const updatedStore = await response.json();
      const mappedStore = mapDbStoreToStoreData(updatedStore.store);
      setStore(mappedStore);
    } catch (error) {
      console.error("Error updating store:", error);
      throw error;
    }
  };

  const refreshPages = useCallback(async (): Promise<void> => {
    if (!shouldFetchStore()) return;

    const hasStore = await checkStoreExists();
    if (!hasStore) {
      return;
    }

    setLoading(true);
    await fetchPages(true);
  }, [shouldFetchStore, checkStoreExists, fetchPages]);

  const createPage = async (pageData: any): Promise<any> => {
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

      if (data.page?.id) {
        pageDetailsCache.delete(data.page.id);
      }

      await refreshPages();
      return data;
    } catch (error) {
      console.error("Error in createPage:", error);
      throw error;
    }
  };

  const updatePage = async (id: string, pageData: any): Promise<any> => {
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

      pageDetailsCache.delete(id);
      await refreshPages();
      return data;
    } catch (error) {
      console.error("Error in updatePage:", error);
      throw error;
    }
  };

  const getPageDetails = async (id: string): Promise<any> => {
    const cached = pageDetailsCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`/api/payment-page/details/${id}`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error("Failed to fetch page details");
      const data = await response.json();

      const page = data.page;

      if (page?.pageType === 'link' && page?.metadata?.linkConfig) {
        page.linkConfig = page.metadata.linkConfig;
      }

      pageDetailsCache.set(id, { data: page, timestamp: Date.now() });

      return page;
    } catch (error) {
      console.error("Error fetching page details:", error);
      throw error;
    }
  };

  const getPageStats = async (id: string): Promise<{ payments: any[], totalAmount: number, totalCount: number }> => {
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

  const withdrawFromPage = async (pageId: string, amount: number): Promise<any> => {
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
      pageDetailsCache.delete(pageId);
      await refreshPages();
      return data.withdrawal;
    } catch (error) {
      console.error("Error withdrawing:", error);
      throw error;
    }
  };

  const addPage = (page: PaymentPage): void => {
    setPages((prev) => [page, ...prev]);
  };

  const clearCache = (): void => {
    pageDetailsCache.clear();
    lastFetchTime.current = 0;
    hasCheckedStoreRef.current = false;
  };

  // === Initial fetch with stable deps ===
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (creatingStoreRef.current || storeCreationRef.current) return;
      if (shouldFetchStore()) {
        const hasStore = await checkStoreExists();
        if (hasStore && isMounted) {
          await fetchPages();
        }
      } else {
        setLoading(false);
        setInitialFetchDone(true);
      }
    };

    loadData();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Re-fetch on pathname change only ===
  useEffect(() => {
    if (creatingStoreRef.current || storeCreationRef.current) return;

    if (shouldFetchStore() && initialFetchDone) {
      if (!hasCheckedStoreRef.current || storeRef.current) {
        fetchStore();
        if (storeRef.current) fetchPages();
      }
    } else if (!shouldFetchStore() && !initialFetchDone) {
      setLoading(false);
      setInitialFetchDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, initialFetchDone]);

  // ✅ CORRECTED: Calculate hasStore and hasPendingActivation
  // A store is active if isActive is true AND activation_paid is true
  const hasStore = store !== null && store.isActive === true && store.activation_paid === true;
  // A store is pending activation if it exists but is not active OR not paid
  const hasPendingActivation = store !== null && (store.isActive === false || store.activation_paid === false);

  console.log("📊 Store state:", { 
    store: store?.id, 
    isActive: store?.isActive,
    activation_paid: store?.activation_paid,
    hasStore,
    hasPendingActivation
  });

  return (
    <StoreContext.Provider
      value={{
        store,
        pages,
        loading,
        creatingStore,
        hasStore,
        hasPendingActivation,
        fetchStore,
        fetchPages,
        checkStoreExists,
        createStore,
        createPage,
        getPageDetails,
        getPageStats,
        withdrawFromPage,
        addPage,
        refreshPages,
        updatePage,
        clearCache,
        updateStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};