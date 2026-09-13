// app/hooks/useStore.ts
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useUserContextData } from "../context/userData";
import { usePathname, useRouter } from "next/navigation";

export type PageType =
  | "school"
  | "donation"
  | "physical"
  | "digital"
  | "services"
  | "real_estate"
  | "stock"
  | "savings"
  | "crypto"
  | "link";

export interface Student {
  id?: string;
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
  isPartiallyPaid?: boolean;
  paidAmount?: number;
  parentName?: string;
  remainingBalance?: number;
  totalAmount?: number;
  payments?: any[];
  lastPaidAt?: string | null;
}

export interface FeeItem {
  label: string;
  amount: number;
  description?: string;
}

export interface Variant {
  name: string;
  price: number;
  sku?: string;
  stock?: number;
  paidAmount?: number;
  payments?: any[];
  lastPaidAt?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  isActive: boolean;
  is_active?: boolean;
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
  isStoreCheckComplete: boolean;
  fetchStore: (force?: boolean) => Promise<void>;
  fetchPages: (force?: boolean) => Promise<void>;
  checkStoreExists: () => Promise<boolean>;
  createStore: (storeData: any) => Promise<StoreData>;
  createPage: (pageData: any) => Promise<any>;
  getPageDetails: (id: string) => Promise<any>;
  getPageStats: (
    id: string
  ) => Promise<{ payments: any[]; totalAmount: number; totalCount: number }>;
  withdrawFromPage: (pageId: string, amount: number) => Promise<any>;
  addPage: (page: PaymentPage) => void;
  refreshPages: () => Promise<void>;
  updatePage: (id: string, pageData: any) => Promise<any>;
  clearCache: () => void;
  updateStore: (data: Partial<StoreData>) => Promise<void>;
  validateSlug: (
    slug: string,
    pageId?: string
  ) => Promise<{
    valid: boolean;
    slug: string;
    isTaken: boolean;
    isOwnStore: boolean;
    message: string;
  }>;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  pages: [],
  loading: true,
  creatingStore: false,
  hasStore: false,
  hasPendingActivation: false,
  isStoreCheckComplete: false,
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
  validateSlug: async () => ({
    valid: true,
    slug: "",
    isTaken: false,
    isOwnStore: false,
    message: "",
  }),
});

export const useStore = () => useContext(StoreContext);

const pageDetailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

// ─── Reserved slugs under /store/* that belong to the owner dashboard,
// not to public storefronts. Keep in sync with middleware.ts.
const RESERVED_STORE_SLUGS = new Set([
  "products",
  "wallet",
  "transactions",
  "customers",
  "analytics",
  "settings",
  "link",
]);

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
    latitude: dbStore.latitude ?? null,
    longitude: dbStore.longitude ?? null,
    locationAccuracy: dbStore.location_accuracy ?? null,
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isStoreCheckComplete, setIsStoreCheckComplete] = useState(false);
  const { userData } = useUserContextData();
  const pathname = usePathname();

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
  const FETCH_COOLDOWN = 5000;

  useEffect(() => {
    storeRef.current = store;
  }, [store]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  useEffect(() => {
    creatingStoreRef.current = creatingStore;
  }, [creatingStore]);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // ─── shouldFetchStore ───
  // Only true for the owner dashboard. Public storefronts under
  // /store/[arbitrary-slug] return false.
  const shouldFetchStore = useCallback(() => {
    const path = pathnameRef.current;
    if (!path) return false;

    // Owner routes under /dashboard/services/payment/*
    if (path === "/dashboard/services/payment") return true;
    if (path.startsWith("/dashboard/services/payment/")) return true;

    // Owner routes under /store/*
    if (path === "/store") return false;

    const match = path.match(/^\/store\/([^\/]+)/);
    if (match) {
      const firstSegment = match[1].toLowerCase();
      return RESERVED_STORE_SLUGS.has(firstSegment);
    }

    return false;
  }, []);

  const checkStoreExists = useCallback(async (): Promise<boolean> => {
    if (storeRef.current) {
      setIsStoreCheckComplete(true);
      return true;
    }

    if (creatingStoreRef.current || storeCreationRef.current) {
      setIsStoreCheckComplete(true);
      return false;
    }

    if (storeCheckPromiseRef.current) {
      const result = await storeCheckPromiseRef.current;
      setIsStoreCheckComplete(true);
      return result;
    }

    storeCheckPromiseRef.current = (async (): Promise<boolean> => {
      try {
        const response = await fetch("/api/store", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (response.status === 404) {
          hasCheckedStoreRef.current = true;
          setStore(null);
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
          return false;
        }

        if (!response.ok) {
          hasCheckedStoreRef.current = true;
          setStore(null);
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
          return false;
        }

        const data = await response.json();
        const hasStoreData = data.store !== null && data.store !== undefined;

        if (hasStoreData) {
          const mappedStore = mapDbStoreToStoreData(data.store);
          setStore(mappedStore);
          lastFetchTime.current = Date.now();
          hasCheckedStoreRef.current = true;
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
          return true;
        } else {
          setStore(null);
          hasCheckedStoreRef.current = true;
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
          return false;
        }
      } catch (error) {
        hasCheckedStoreRef.current = true;
        setStore(null);
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        return false;
      } finally {
        storeCheckPromiseRef.current = null;
      }
    })();

    const result = await storeCheckPromiseRef.current;
    setIsStoreCheckComplete(true);
    return result;
  }, []);

  const fetchStore = useCallback(
    async (force = false): Promise<void> => {
      if (storeRef.current && !force) {
        setIsStoreCheckComplete(true);
        return;
      }

      if (creatingStoreRef.current || storeCreationRef.current) return;
      if (fetchStoreInProgress.current) return;

      const now = Date.now();
      if (
        !force &&
        now - lastFetchTime.current < FETCH_COOLDOWN &&
        storeRef.current
      ) {
        setIsStoreCheckComplete(true);
        return;
      }

      if (!shouldFetchStore()) {
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        return;
      }

      fetchStoreInProgress.current = true;

      try {
        const response = await fetch("/api/store", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (response.status === 404) {
          setStore(null);
          hasCheckedStoreRef.current = true;
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
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
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
          return;
        }

        const mappedStore = mapDbStoreToStoreData(data.store);

        setStore(mappedStore);
        hasCheckedStoreRef.current = true;
        lastFetchTime.current = Date.now();
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
      } catch (error) {
        setStore(null);
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
      } finally {
        fetchStoreInProgress.current = false;
      }
    },
    [shouldFetchStore]
  );

  const fetchPages = useCallback(
    async (force = false): Promise<void> => {
      const hasStore = await checkStoreExists();

      if (!hasStore) {
        setPages([]);
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        return;
      }

      if (creatingStoreRef.current || storeCreationRef.current) return;
      if (fetchPagesInProgress.current) return;

      const now = Date.now();
      if (
        !force &&
        now - lastFetchTime.current < FETCH_COOLDOWN &&
        pagesRef.current.length > 0
      ) {
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        return;
      }

      if (!shouldFetchStore()) {
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        return;
      }

      fetchPagesInProgress.current = true;

      try {
        const response = await fetch("/api/payment-page/list", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status}`);
        }

        const data = await response.json();
        setPages(data.pages || []);
        lastFetchTime.current = Date.now();
      } catch (error) {
        setPages([]);
      } finally {
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
        fetchPagesInProgress.current = false;
      }
    },
    [shouldFetchStore, checkStoreExists]
  );

  const refreshPages = useCallback(async (): Promise<void> => {
    if (!shouldFetchStore()) return;
    const hasStore = await checkStoreExists();
    if (!hasStore) return;
    setLoading(true);
    await fetchPages(true);
  }, [shouldFetchStore, checkStoreExists, fetchPages]);

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
        throw new Error(
          data.error || `Failed to create store: ${response.status}`
        );
      }

      const mappedStore = mapDbStoreToStoreData(data.store);
      setStore(mappedStore);
      hasCheckedStoreRef.current = true;
      lastFetchTime.current = Date.now();
      fetchStoreInProgress.current = false;
      setIsStoreCheckComplete(true);

      setTimeout(() => {
        storeCreationRef.current = false;
        setCreatingStore(false);
        fetchStore(true);
      }, 1000);

      if (mappedStore?.isActive === true) {
        router.push("/dashboard/services/payment/dashboard");
      }

      return mappedStore!;
    } catch (error) {
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
      throw error;
    }
  };

  const createPage = async (pageData: any): Promise<any> => {
    try {
      const finalPageData = {
        ...pageData,
        coverImage:
          pageData.coverImage ||
          (pageData.productImages && pageData.productImages.length > 0
            ? pageData.productImages[0]
            : null),
        logo: null,
      };

      const response = await fetch("/api/payment-page/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPageData),
      });

      const rawResponse = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to create page: ${response.status}`
        );
      }

      if (data.page?.id) {
        pageDetailsCache.delete(data.page.id);
      }

      await refreshPages();
      return data;
    } catch (error) {
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
        throw new Error(
          data.error || `Failed to update page: ${response.status}`
        );
      }

      pageDetailsCache.delete(id);
      await refreshPages();
      return data;
    } catch (error) {
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
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch page details");
      const data = await response.json();

      const page = data.page;

      if (page?.pageType === "link" && page?.metadata?.linkConfig) {
        page.linkConfig = page.metadata.linkConfig;
      }

      pageDetailsCache.set(id, { data: page, timestamp: Date.now() });
      return page;
    } catch (error) {
      throw error;
    }
  };

  const getPageStats = async (
    id: string
  ): Promise<{ payments: any[]; totalAmount: number; totalCount: number }> => {
    try {
      const pageDetails = await getPageDetails(id);
      return {
        payments: pageDetails?.recentPayments || [],
        totalAmount: pageDetails?.paymentStats?.totalAmount || 0,
        totalCount: pageDetails?.paymentStats?.totalCount || 0,
      };
    } catch (error) {
      return { payments: [], totalAmount: 0, totalCount: 0 };
    }
  };

  const withdrawFromPage = async (
    pageId: string,
    amount: number
  ): Promise<any> => {
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
    setInitialLoadComplete(false);
    setIsStoreCheckComplete(false);
  };

  const validateSlug = useCallback(
    async (
      slug: string,
      pageId?: string
    ): Promise<{
      valid: boolean;
      slug: string;
      isTaken: boolean;
      isOwnStore: boolean;
      message: string;
    }> => {
      try {
        const response = await fetch("/api/payment-page/validate-slug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, pageId }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            valid: false,
            slug,
            isTaken: false,
            isOwnStore: false,
            message: data.error || "Failed to validate slug",
          };
        }

        return data;
      } catch (error) {
        return {
          valid: false,
          slug,
          isTaken: false,
          isOwnStore: false,
          message: "Failed to validate slug",
        };
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (creatingStoreRef.current || storeCreationRef.current) return;

      if (shouldFetchStore()) {
        try {
          const hasStore = await checkStoreExists();

          if (hasStore && isMounted) {
            await fetchPages();
          } else {
            if (isMounted) setPages([]);
          }
        } catch (error) {
          if (isMounted) {
            setLoading(false);
            setInitialFetchDone(true);
            setInitialLoadComplete(true);
            setIsStoreCheckComplete(true);
          }
        }
      } else {
        if (isMounted) {
          setLoading(false);
          setInitialFetchDone(true);
          setInitialLoadComplete(true);
          setIsStoreCheckComplete(true);
        }
      }
    };

    loadData();

    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialLoadComplete) {
        setLoading(false);
        setInitialFetchDone(true);
        setInitialLoadComplete(true);
        setIsStoreCheckComplete(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    if (creatingStoreRef.current || storeCreationRef.current) return;

    if (shouldFetchStore() && initialFetchDone) {
      if (!storeRef.current && !hasCheckedStoreRef.current) {
        fetchStore();
      }

      if (storeRef.current || hasCheckedStoreRef.current) {
        const shouldFetchPages =
          !pagesRef.current.length ||
          pagesRef.current.length === 0 ||
          initialLoadComplete;

        if (shouldFetchPages) {
          fetchPages();
        }
      }
    } else if (!shouldFetchStore() && !initialFetchDone) {
      setLoading(false);
      setInitialFetchDone(true);
      setInitialLoadComplete(true);
      setIsStoreCheckComplete(true);
    }
  }, [pathname, initialFetchDone]);

  const hasStore =
    store !== null && store.isActive === true && store.activation_paid === true;
  const hasPendingActivation =
    store !== null &&
    (store.isActive === false || store.activation_paid === false);

  return (
    <StoreContext.Provider
      value={{
        store,
        pages,
        loading: loading || !isStoreCheckComplete,
        creatingStore,
        hasStore,
        hasPendingActivation,
        isStoreCheckComplete,
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
        validateSlug,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const isInvestmentType = (pageType: PageType): boolean => {
  return ["real_estate", "stock", "savings", "crypto"].includes(pageType);
};