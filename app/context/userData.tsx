"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type SubscriptionTier =
  | "free"
  | "solopreneur"
  | "sme"
  | "enterprise"
  | "corporation";

export interface SupabaseUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentLoginSession: string | null;
  zidcoinBalance: number;
  bvnVerification: string;
  role: string;
  referralCode: string;
  state: string | null;
  city: string | null;
  address: string | null;
  dateOfBirth: string;
  profilePicture: string | null;
  subscription_tier?: SubscriptionTier | null;
  subscription_expires_at?: string | null;
  identityVerified?: boolean;
  verificationCompleted?: boolean;
  bank78Verified?: boolean;
  is_business_registered?: boolean;
  purpose?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  hasStore?: boolean;
  storeIsActive?: boolean;
  storePendingActivation?: boolean;
  store?: any;
  pinSet?: boolean;
  activationPaid?: boolean;
  activatedAt?: string | null;
  activationReference?: string | null;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: "active" | "expired" | "cancelled" | "pending";
  expiresAt: Date | null;
  features: Record<string, any>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  channels: string[];
  read_at: string | null;
  created_at: string;
}

interface UserContextType {
  user: SupabaseUser | null;
  userData: any | null;
  balance: number | null;
  lifetimeBalance: number;
  totalOutflow: number;
  totalTransactions: number;
  setUserData: Dispatch<SetStateAction<any | null>>;
  refreshUserProfile: () => Promise<void>;
  loading: boolean;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  fetchNotifications: (filter?: string, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  clearNotificationCache: () => void;
  subscription: SubscriptionInfo | null;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (
    featureKey: string,
    currentCount?: number,
  ) => Promise<{
    hasAccess: boolean;
    limit?: number;
    message?: string;
    requiredTier?: SubscriptionTier;
  }>;
  subscribe: (
    tier: SubscriptionTier,
    paymentMethod: string,
    amount: number,
    paymentReference: string,
    isYearly?: boolean,
  ) => Promise<any>;
  cancelSubscription: () => Promise<any>;
  getUpgradeBenefits: (targetTier: SubscriptionTier) => string[];
  canAccessFeature: (featureKey: string, currentCount?: number) => boolean;
  handleSessionExpired: (redirectTo?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STATIC_PUBLIC_PAGES = [
  "/",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/auth",
  "/auth/callback",
  "/auth/login",
  "/auth/register",
  "/pricing",
  "/pay",
];

const PUBLIC_PAGE_PATTERNS = [
  /^\/sign-contract\/[^\/]+$/,
  /^\/sign-receipt\/[^\/]+$/,
  /^\/pay-invoice\/[^\/]+$/,
  /^\/pay\/[^\/]+$/,
  /^\/verify-email\/[^\/]+$/,
  /^\/reset-password\/[^\/]+$/,
  /^\/invite\/[^\/]+$/,
  /^\/share\/[^\/]+$/,
  /^\/preview\/[^\/]+$/,
  /^\/public\/[^\/]+$/,
  /^\/store\/[^\/]+$/,
  /^\/store\/[^\/]+\/[^\/]+$/,
  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/article(\/.*)?$/,
  /^\/docs(\/.*)?$/,
  /^\/help(\/.*)?$/,
  /^\/faq(\/.*)?$/,
];

class NotificationCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 3 * 60 * 1000;

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const notificationCache = new NotificationCache();

class SubscriptionCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const subscriptionCache = new SubscriptionCache();

const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  manual_bookkeeping: "free",
  auto_bookkeeping: "free",
  payment_links: "free",
  business_bank_account: "free",
  basic_financial_overview: "free",
  invoices_5: "free",
  receipts_5: "free",
  invoices_10: "solopreneur",
  unlimited_receipts: "solopreneur",
  branded_invoices: "solopreneur",
  expense_tracking: "solopreneur",
  financial_insights: "solopreneur",
  bank_statement_upload: "sme",
  connect_3_bank_accounts: "sme",
  unlimited_invoices: "sme",
  unlimited_receipts_sme: "sme",
  vault: "sme",
  tax_calculator: "sme",
  financial_statements: "sme",
  team_member_1: "sme",
  multi_user_access: "enterprise",
  role_permissions: "enterprise",
  approval_system: "enterprise",
  connect_5_bank_accounts: "enterprise",
  downloadable_reports: "enterprise",
  contracts_10: "enterprise",
  dedicated_onboarding: "enterprise",
  unlimited_contracts: "corporation",
  department_access: "corporation",
  unlimited_bank_accounts: "corporation",
  payroll_system: "corporation",
  advanced_reporting: "corporation",
  custom_financial_structure: "corporation",
  priority_onboarding: "corporation",
  dedicated_account_manager: "corporation",
};

const TIER_HIERARCHY: SubscriptionTier[] = [
  "free",
  "solopreneur",
  "sme",
  "enterprise",
  "corporation",
];

const PLAN_LIMITS: Record<SubscriptionTier, Record<string, any>> = {
  free: {
    invoices: 5,
    receipts: 5,
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    transferFee: 50,
    manualBookkeeping: true,
    autoBookkeeping: true,
    paymentLinks: true,
    businessBankAccount: true,
    basicFinancialOverview: true,
  },
  solopreneur: {
    invoices: 10,
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    transferFee: 50,
    manualBookkeeping: true,
    autoBookkeeping: true,
    brandedInvoices: true,
    expenseTracking: true,
    financialInsights: true,
  },
  sme: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 1,
    bankAccounts: 3,
    transferFee: 50,
    manualBookkeeping: true,
    autoBookkeeping: true,
    bankStatementUpload: true,
    vault: true,
    taxCalculator: true,
    financialStatements: true,
  },
  enterprise: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 10,
    teamMembers: "unlimited",
    bankAccounts: 5,
    transferFee: 50,
    manualBookkeeping: true,
    autoBookkeeping: true,
    multiUserAccess: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    dedicatedOnboarding: true,
  },
  corporation: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: "unlimited",
    bankAccounts: "unlimited",
    transferFee: 50,
    manualBookkeeping: true,
    autoBookkeeping: true,
    departmentAccess: true,
    payrollSystem: true,
    advancedReporting: true,
    customFinancialStructure: true,
    priorityOnboarding: true,
    dedicatedAccountManager: true,
  },
};

const UPGRADE_BENEFITS: Record<string, string[]> = {
  free_to_solopreneur: [
    "Up to 10 invoices (up from 5)",
    "Unlimited receipts (up from 5)",
    "Branded invoices",
    "Better expense tracking",
    "Basic financial insights",
  ],
  free_to_sme: [
    "Upload bank statements (PDF/Excel/CSV)",
    "Connect up to 3 bank accounts",
    "Unlimited invoices",
    "Unlimited receipts",
    "Vault for financial documents",
    "Tax calculator",
    "Financial statements (P&L, Cash Flow, Balance Sheet)",
    "1 extra team member access",
  ],
  free_to_enterprise: [
    "Multi-user access (full team)",
    "Role-based permissions",
    "Request & approval system",
    "Connect 5 bank accounts",
    "Downloadable financial reports",
    "10 contracts",
    "Dedicated onboarding support",
  ],
  free_to_corporation: [
    "Unlimited contracts",
    "Department-based access",
    "Connect unlimited bank accounts",
    "Simple payroll system",
    "Advanced financial reporting",
    "Custom financial structure setup",
    "Priority onboarding support",
    "Dedicated account manager",
  ],
  solopreneur_to_sme: [
    "Upload bank statements (PDF/Excel/CSV)",
    "Connect up to 3 bank accounts",
    "Unlimited invoices (up from 10)",
    "Unlimited receipts",
    "Vault for financial documents",
    "Tax calculator",
    "Financial statements (P&L, Cash Flow, Balance Sheet)",
    "1 extra team member access",
  ],
  solopreneur_to_enterprise: [
    "Multi-user access (full team)",
    "Role-based permissions",
    "Request & approval system",
    "Connect 5 bank accounts",
    "Downloadable financial reports",
    "10 contracts",
    "Dedicated onboarding support",
  ],
  solopreneur_to_corporation: [
    "Unlimited contracts",
    "Department-based access",
    "Connect unlimited bank accounts",
    "Simple payroll system",
    "Advanced financial reporting",
    "Custom financial structure setup",
    "Priority onboarding support",
    "Dedicated account manager",
  ],
  sme_to_enterprise: [
    "Multi-user access (full team) - unlimited team members",
    "Role-based permissions (owner, staff, finance, viewer)",
    "Request & approval system",
    "Connect 5 bank accounts (up from 3)",
    "Downloadable financial reports",
    "10 contracts",
    "Dedicated onboarding support",
  ],
  sme_to_corporation: [
    "Unlimited contracts",
    "Department-based access - HR, Finance, Operations, etc",
    "Connect unlimited bank accounts (up from 3)",
    "Simple payroll system",
    "Advanced financial reporting",
    "Custom financial structure setup",
    "Priority onboarding support",
    "Dedicated account manager",
  ],
  enterprise_to_corporation: [
    "Unlimited contracts (up from 10)",
    "Department-based access - HR, Finance, Operations, etc",
    "Connect unlimited bank accounts (up from 5)",
    "Simple payroll system",
    "Advanced financial reporting",
    "Custom financial structure setup",
    "Priority onboarding support (up from dedicated)",
    "Dedicated account manager",
  ],
};

const CLIENT_CLEARABLE_COOKIES = [
  "sb-client-session",
  "sb-login-time",
  "verified",
  "sb-user-data",
  "payment_processed",
];

function clearClientCookies() {
  if (typeof document === "undefined") return;

  CLIENT_CLEARABLE_COOKIES.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

function clearClientStorage() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("userData");
    localStorage.removeItem("zidwell_store_data");
    localStorage.removeItem("zidwell_store_timestamp");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("pendingStoreCheckout");
    localStorage.removeItem("pendingStoreCheckout");
  } catch (e) {
    console.error("Failed to clear storage:", e);
  }
}

/**
 * Persist the current userData snapshot to localStorage.
 * Silent on failure — quota errors shouldn't crash the provider.
 */
function persistUserData(value: any | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem("userData", JSON.stringify(value));
    } else {
      localStorage.removeItem("userData");
    }
  } catch (e) {
    console.warn("Failed to persist userData:", e);
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userDataState, setUserDataState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [lifetimeBalance, setLifetimeBalance] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const sessionExpiredRef = useRef(false);

  // ─── WRAPPER: every setUserData call persists to localStorage ───
  const setUserData = useCallback(
    (value: SetStateAction<any | null>) => {
      setUserDataState((prev) => {
        const next =
          typeof value === "function"
            ? (value as (p: any) => any)(prev)
            : value;

        persistUserData(next);

        return next;
      });
    },
    [],
  );

  const isPublicPage = useCallback(() => {
    if (!pathname) return false;
    if (STATIC_PUBLIC_PAGES.some((page) => pathname === page)) return true;
    if (STATIC_PUBLIC_PAGES.some((page) => pathname.startsWith(page + "/")))
      return true;
    if (PUBLIC_PAGE_PATTERNS.some((pattern) => pattern.test(pathname)))
      return true;
    return false;
  }, [pathname]);

  const handleSessionExpired = useCallback(
    async (redirectTo: string = "/auth/login") => {
      if (sessionExpiredRef.current) return;
      sessionExpiredRef.current = true;

      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
      } catch {}

      clearClientCookies();
      clearClientStorage();
      sessionStorage.removeItem("lastActivity");

      setUser(null);
      setUserData(null);
      setShouldFetchData(false);
      setBalance(null);
      setNotifications([]);
      setUnreadCount(0);
      setLifetimeBalance(0);
      setTotalOutflow(0);
      setTotalTransactions(0);
      setSubscription(null);
      subscriptionCache.clear();
      notificationCache.clear();

      router.replace(redirectTo);

      setTimeout(() => {
        sessionExpiredRef.current = false;
      }, 2000);
    },
    [router, setUserData],
  );

  const restoreSessionFromCookies = useCallback(async () => {
    try {
      const response = await fetch("/api/user/me", {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const userProfile = await response.json();
        if (userProfile && userProfile.id) return userProfile;
      }

      if (response.status === 401) {
        console.warn(
          "⚠️ /api/me returned 401 — keeping cached data, will retry",
        );
        return null;
      }

      console.warn(
        "⚠️ /api/me returned",
        response.status,
        "— keeping cached data",
      );
      return null;
    } catch (error) {
      console.error("Network error during /api/me — keeping cached data:", error);
      return null;
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!userDataState?.id) return;

    try {
      const response = await fetch("/api/user/me", {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const fresh = await response.json();

        if (fresh && fresh.id) {
          setUser(fresh);
          setUserData(fresh); // wrapper persists automatically

          subscriptionCache.delete(`subscription_${fresh.id}`);
        }
        return;
      }

      if (response.status === 401) {
        console.warn("⚠️ refreshUserProfile got 401 — keeping cached data");
        return;
      }

      console.warn(
        "⚠️ refreshUserProfile got status",
        response.status,
        "— keeping cached data",
      );
    } catch (error) {
      console.error("refreshUserProfile network error:", error);
    }
  }, [userDataState?.id, setUserData]);

  const initializeUser = useCallback(async () => {
    try {
      const storedUser =
        typeof window !== "undefined"
          ? localStorage.getItem("userData")
          : null;

      let cached: any = null;
      if (storedUser) {
        try {
          cached = JSON.parse(storedUser);
        } catch (e) {
          console.error("Corrupt userData in localStorage — removing");
          localStorage.removeItem("userData");
        }
      }

      if (cached && cached.id) {
        setUser(cached);
        setUserDataState(cached); // seed state without re-persisting
        setShouldFetchData(!isPublicPage());
      }

      const verified = await restoreSessionFromCookies();

      if (verified) {
        setUser(verified);
        setUserData(verified); // wrapper persists
        setShouldFetchData(!isPublicPage());
      } else if (!cached || !cached.id) {
        setUser(null);
        setUserDataState(null);
        setShouldFetchData(false);
      }
    } catch (error) {
      console.error("initializeUser threw:", error);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initializeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
      if (!storedTheme) localStorage.setItem("theme", "light");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasPaymentCookie = document.cookie.includes(
        "payment_processed=true",
      );
      if (hasPaymentCookie) {
        document.cookie =
          "payment_processed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, []);

  useEffect(() => {
    if (!initialCheckDone) return;

    const isPublic = isPublicPage();
    const hasUser = !!userDataState?.id;

    setShouldFetchData(!isPublic && hasUser);

    if (isPublic || !hasUser) {
      setBalance(null);
      setNotifications([]);
      setUnreadCount(0);
      setLifetimeBalance(0);
      setTotalOutflow(0);
      setTotalTransactions(0);
      setSubscription(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, initialCheckDone, userDataState?.id]);

  const clearNotificationCache = useCallback(() => {
    notificationCache.clear();
  }, []);

  const fetchNotifications = useCallback(
    async (filter: string = "all", limit: number = 50) => {
      console.log(
        "📢 Notifications API disabled - fetchNotifications called but skipped",
      );
      return;
    },
    [],
  );

  const fetchUnreadCount = useCallback(async () => {
    console.log(
      "📢 Notifications API disabled - fetchUnreadCount called but skipped",
    );
    return;
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    console.log(
      "📢 Notifications API disabled - markAsRead called but skipped",
    );
    return;
  }, []);

  const markAllAsRead = useCallback(async () => {
    console.log(
      "📢 Notifications API disabled - markAllAsRead called but skipped",
    );
    return;
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!shouldFetchData || !userDataState?.id) {
      setSubscription(null);
      return;
    }

    const cacheKey = `subscription_${userDataState.id}`;
    const cached = subscriptionCache.get(cacheKey);

    if (cached) {
      setSubscription(cached);
      return;
    }

    setSubscriptionLoading(true);
    try {
      const response = await fetch(`/api/subscription`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 401) return;

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscription) {
          const subscriptionData = {
            ...data.subscription,
            expiresAt: data.subscription.expiresAt
              ? new Date(data.subscription.expiresAt)
              : null,
          };
          setSubscription(subscriptionData);
          subscriptionCache.set(cacheKey, subscriptionData);

          setUserData((prev: any) => ({
            ...prev,
            subscription_tier: subscriptionData.tier,
            subscription_expires_at: subscriptionData.expiresAt?.toISOString(),
          }));
        }
      } else {
        const defaultSubscription: SubscriptionInfo = {
          tier: "free",
          status: "active",
          expiresAt: null,
          features: {},
        };
        setSubscription(defaultSubscription);
      }
    } catch (error) {
      console.error("❌ Error fetching subscription:", error);
      setSubscription({
        tier: "free",
        status: "active",
        expiresAt: null,
        features: {},
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [shouldFetchData, userDataState?.id, setUserData]);

  const refreshSubscription = useCallback(async () => {
    if (userDataState?.id) {
      subscriptionCache.delete(`subscription_${userDataState.id}`);
      await fetchSubscription();
    }
  }, [userDataState?.id, fetchSubscription]);

  const checkFeatureAccess = useCallback(
    async (
      featureKey: string,
      currentCount?: number,
    ): Promise<{
      hasAccess: boolean;
      limit?: number;
      message?: string;
      requiredTier?: SubscriptionTier;
    }> => {
      if (!subscription) {
        return {
          hasAccess: false,
          message: "Unable to verify subscription",
          requiredTier: FEATURE_TIER_MAP[featureKey] || "free",
        };
      }

      const feature = subscription.features[featureKey];
      const requiredTier = FEATURE_TIER_MAP[featureKey] || "free";
      const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
      const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

      if (userTierIndex < requiredTierIndex) {
        return {
          hasAccess: false,
          message: `This feature requires the ${requiredTier} plan or higher`,
          requiredTier,
        };
      }

      if (!feature) {
        return {
          hasAccess: false,
          message: `This feature is not available in your ${subscription.tier} plan`,
          requiredTier,
        };
      }

      if (feature.value === "true") return { hasAccess: true };
      if (feature.value === "unlimited") return { hasAccess: true };

      if (feature.limit && currentCount !== undefined) {
        const limit = feature.limit;
        if (currentCount >= limit) {
          return {
            hasAccess: false,
            limit,
            message: `You've reached your ${featureKey.replace(
              /_/g,
              " ",
            )} limit of ${limit} for the ${subscription.tier} plan`,
            requiredTier,
          };
        }
        return { hasAccess: true, limit };
      }

      return { hasAccess: true };
    },
    [subscription],
  );

  const canAccessFeature = useCallback(
    (featureKey: string, currentCount?: number): boolean => {
      if (!subscription) return false;

      const feature = subscription.features[featureKey];
      const requiredTier = FEATURE_TIER_MAP[featureKey] || "free";
      const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
      const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

      if (userTierIndex < requiredTierIndex) return false;
      if (!feature) return false;

      if (feature.value === "true" || feature.value === "unlimited") return true;

      if (feature.limit && currentCount !== undefined) {
        return currentCount < feature.limit;
      }

      return true;
    },
    [subscription],
  );

  const subscribe = useCallback(
    async (
      tier: SubscriptionTier,
      paymentMethod: string,
      amount: number,
      paymentReference: string,
      isYearly: boolean = false,
    ) => {
      if (!userDataState?.id) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        const response = await fetch("/api/subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "subscribe",
            tier,
            paymentMethod,
            amount,
            paymentReference,
            isYearly,
          }),
        });

        if (response.status === 401) {
          return { success: false, error: "Session expired" };
        }

        const data = await response.json();

        if (data.success) {
          subscriptionCache.delete(`subscription_${userDataState.id}`);
          await fetchSubscription();

          setUserData((prev: any) => ({
            ...prev,
            subscription_tier: tier,
            subscription_expires_at: data.subscription?.expires_at,
          }));
        }

        return data;
      } catch (error: any) {
        console.error("❌ Error subscribing:", error);
        return { success: false, error: error.message };
      }
    },
    [userDataState?.id, fetchSubscription, setUserData],
  );

  const cancelSubscription = useCallback(async () => {
    if (!userDataState?.id) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (response.status === 401) {
        return { success: false, error: "Session expired" };
      }

      const data = await response.json();

      if (data.success) {
        subscriptionCache.delete(`subscription_${userDataState.id}`);
        await fetchSubscription();
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error cancelling subscription:", error);
      return { success: false, error: error.message };
    }
  }, [userDataState?.id, fetchSubscription]);

  const getUpgradeBenefits = useCallback(
    (targetTier: SubscriptionTier): string[] => {
      const currentTier = subscription?.tier || "free";
      const key = `${currentTier}_to_${targetTier}`;
      return UPGRADE_BENEFITS[key] || [];
    },
    [subscription?.tier],
  );

  useEffect(() => {
    const fetchBalance = async () => {
      if (!shouldFetchData || !userDataState?.id) return;

      try {
        const res = await fetch("/api/wallet-balance", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userDataState.id }),
        });

        if (res.status === 401) return;
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch balance");
        setBalance(data.wallet_balance ?? 0);
      } catch (error) {
        console.error("❌ Error fetching balance:", error);
        setBalance(userDataState?.zidcoinBalance ?? 0);
      }
    };

    if (shouldFetchData && userDataState?.id) fetchBalance();
  }, [userDataState?.id, userDataState?.zidcoinBalance, shouldFetchData]);

  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!shouldFetchData || !userDataState?.id) return;

      const cacheKey = `transaction_stats_${userDataState.id}`;
      const cached = notificationCache.get(cacheKey);

      if (cached) {
        setLifetimeBalance(cached.lifetimeBalance);
        setTotalOutflow(cached.totalOutflow);
        setTotalTransactions(cached.totalTransactions);
        return;
      }

      try {
        const res = await fetch("/api/total-inflow", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userDataState.id }),
        });

        if (res.status === 401) return;

        const data = await res.json();
        if (data.success) {
          const stats = {
            lifetimeBalance: data.lifetimeBalance || data.totalInflow || 0,
            totalOutflow: data.totalOutflow || 0,
            totalTransactions: data.totalTransactions || 0,
            totalInflow: data.totalInflow || 0,
            netBalance: data.netBalance || 0,
          };
          setLifetimeBalance(stats.lifetimeBalance);
          setTotalOutflow(stats.totalOutflow);
          setTotalTransactions(stats.totalTransactions);
          notificationCache.set(cacheKey, stats, 5 * 60 * 1000);
        }
      } catch (error) {
        console.error("❌ Error fetching transaction stats:", error);
      }
    };

    if (shouldFetchData && userDataState?.id) fetchTransactionStats();
  }, [userDataState?.id, shouldFetchData]);

  useEffect(() => {
    if (shouldFetchData && userDataState?.id) fetchSubscription();
  }, [userDataState?.id, shouldFetchData, fetchSubscription]);

  useEffect(() => {
    if (!shouldFetchData || !userDataState?.id) return;

    const cleanupInterval = setInterval(
      () => notificationCache.cleanup(),
      5 * 60 * 1000,
    );
    const refreshInterval = setInterval(
      () => fetchSubscription(),
      5 * 60 * 1000,
    );

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userDataState?.id, shouldFetchData, fetchSubscription]);

  const handleDarkModeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userData: userDataState,
        balance: shouldFetchData ? balance : null,
        lifetimeBalance: shouldFetchData ? lifetimeBalance : 0,
        totalOutflow: shouldFetchData ? totalOutflow : 0,
        totalTransactions: shouldFetchData ? totalTransactions : 0,
        setUserData,
        refreshUserProfile,
        loading,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        searchTerm,
        setSearchTerm,
        notifications: shouldFetchData ? notifications : [],
        unreadCount: shouldFetchData ? unreadCount : 0,
        notificationsLoading: shouldFetchData ? notificationsLoading : false,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        fetchUnreadCount,
        clearNotificationCache,
        subscription: shouldFetchData ? subscription : null,
        subscriptionLoading: shouldFetchData ? subscriptionLoading : false,
        refreshSubscription,
        checkFeatureAccess,
        subscribe,
        cancelSubscription,
        getUpgradeBenefits,
        canAccessFeature,
        handleSessionExpired,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContextData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContextData must be used inside UserProvider");
  }
  return context;
};