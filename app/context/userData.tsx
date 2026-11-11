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
import posthog from "posthog-js";

export type SubscriptionTier =
  | "free"
  | "starter"
  | "sme"
  | "enterprise"
  | "console";

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
  business_bank_account: "free",
  business_plan_template: "free",
  automatic_bookkeeping: "free",
  online_storefront: "free",
  document_vault: "free",
  basic_financial_overview: "free",
  invoices_5: "free",
  receipts_5: "free",
<<<<<<< HEAD
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
=======

  invoices_10: "starter",
  unlimited_invoices: "starter",
  unlimited_receipts: "starter",
  branded_invoices: "starter",
  expense_tracking: "starter",

  international_payments: "sme",
  connect_bank_accounts: "sme",
  team_member_1: "sme",
  tax_calculator: "sme",
  bank_statement_upload: "sme",

  increased_transaction_limits: "enterprise",
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
  connect_5_bank_accounts: "enterprise",
  team_member_3: "enterprise",
  dedicated_support_team: "enterprise",
  downloadable_reports: "enterprise",
  contracts_10: "enterprise",
<<<<<<< HEAD
  dedicated_onboarding: "enterprise",
  unlimited_contracts: "corporation",
  department_access: "corporation",
  unlimited_bank_accounts: "corporation",
  payroll_system: "corporation",
  advanced_reporting: "corporation",
  custom_financial_structure: "corporation",
  priority_onboarding: "corporation",
  dedicated_account_manager: "corporation",
=======

  sub_accounts: "console",
  roles_permissions: "console",
  approval_system: "console",
  unlimited_team: "console",
  payroll_system: "console",
  advanced_reporting: "console",
  custom_financial_structure: "console",
  dedicated_account_manager: "console",
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
};

const TIER_HIERARCHY: SubscriptionTier[] = [
  "free",
  "starter",
  "sme",
  "enterprise",
  "console",
];

const PLAN_LIMITS: Record<SubscriptionTier, Record<string, any>> = {
  free: {
    invoices: 5,
    receipts: 5,
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    transferFee: 50,
    businessBankAccount: true,
    businessPlanTemplate: true,
    automaticBookkeeping: true,
    onlineStorefront: true,
    documentVault: true,
    basicFinancialOverview: true,
  },
  starter: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    transferFee: 50,
    businessBankAccount: true,
    businessPlanTemplate: true,
    automaticBookkeeping: true,
    onlineStorefront: true,
    documentVault: true,
  },
  sme: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 1,
    bankAccounts: 1,
    transferFee: 50,
    businessBankAccount: true,
    businessPlanTemplate: true,
    automaticBookkeeping: true,
    onlineStorefront: true,
    documentVault: true,
    internationalPayments: true,
  },
  enterprise: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 10,
    teamMembers: 3,
    bankAccounts: "multiple",
    transferFee: 50,
    businessBankAccount: true,
    businessPlanTemplate: true,
    automaticBookkeeping: true,
    onlineStorefront: true,
    documentVault: true,
    internationalPayments: true,
    connectBankAccounts: true,
    increasedTransactionLimits: true,
    dedicatedSupportTeam: true,
  },
  console: {
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: "unlimited",
    bankAccounts: "unlimited",
    transferFee: 0,
    businessBankAccount: true,
    businessPlanTemplate: true,
    automaticBookkeeping: true,
    onlineStorefront: true,
    documentVault: true,
    internationalPayments: true,
    connectBankAccounts: true,
    increasedTransactionLimits: true,
    dedicatedSupportTeam: true,
    subAccounts: true,
    rolesPermissions: true,
    approvalSystem: true,
    payrollSystem: true,
    advancedReporting: true,
    customFinancialStructure: true,
    dedicatedAccountManager: true,
  },
};

const UPGRADE_BENEFITS: Record<string, string[]> = {
  free_to_starter: [
    "Unlimited invoices & receipts",
    "Business bank account",
    "Business Plan Template",
    "Automatic Bookkeeping",
    "Invoice Tool",
    "Receipt Tool",
    "Online storefront",
    "Document Vault",
  ],
  free_to_sme: [
    "Everything in Starter, plus:",
    "International payments",
    "One Extra User",
    "Add-ons: Payroll, HMO, Tax Filing Support",
  ],
  free_to_enterprise: [
    "Everything in SME, plus:",
    "Increased transaction limits",
    "Connect Your Bank Accounts",
    "Three Extra Users",
    "Dedicated support team",
  ],
  free_to_console: [
    "Everything in Enterprise, plus:",
    "Sub Accounts",
    "Roles & Permissions",
    "Approvals",
    "Unlimited users",
    "Custom pricing",
  ],
  starter_to_sme: [
    "International payments",
    "One Extra User",
    "Add-ons: Payroll, HMO, Tax Filing Support",
  ],
  starter_to_enterprise: [
    "International payments",
    "Connect Your Bank Accounts",
    "Increased transaction limits",
    "Three Extra Users",
    "Dedicated support team",
  ],
  starter_to_console: [
    "Everything in Enterprise, plus:",
    "Sub Accounts",
    "Roles & Permissions",
    "Approvals",
    "Unlimited users",
  ],
  sme_to_enterprise: [
    "Increased transaction limits",
    "Connect Your Bank Accounts",
    "Three Extra Users (up from 1)",
    "Dedicated support team",
  ],
  sme_to_console: [
    "Everything in Enterprise, plus:",
    "Sub Accounts",
    "Roles & Permissions",
    "Approvals",
    "Unlimited users",
  ],
  enterprise_to_console: [
    "Sub Accounts",
    "Roles & Permissions",
    "Approvals",
    "Unlimited users",
    "Custom pricing",
  ],
};

<<<<<<< HEAD
=======
// ═══════════════════════════════════════════════════════════════════════════
// Cookie / storage helpers — LOGOUT SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════════════

>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
const CLIENT_CLEARABLE_COOKIES = [
  "sb-client-session",
  "sb-login-time",
  "verified",
  "sb-user-data",
  "payment_processed",
];

/**
 * Keys we want to PRESERVE across logout.
 * A deny-list is safer than an allow-list because it guarantees every
 * current *and future* app key is wiped on logout automatically.
 */
const PRESERVED_LOCAL_KEYS = new Set<string>([
  "theme", // user's light/dark preference — not auth data
]);

function clearClientCookies() {
  if (typeof document === "undefined") return;

  CLIENT_CLEARABLE_COOKIES.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

function clearClientStorage() {
  if (typeof window === "undefined") return;

  // ── localStorage: clear EVERYTHING except preserved UX prefs ──
  try {
    const preserved: Record<string, string> = {};
    PRESERVED_LOCAL_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) preserved[k] = v;
    });

    localStorage.clear();

    Object.entries(preserved).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
  }

  // ── sessionStorage: clear entirely ──
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error("Failed to clear sessionStorage:", e);
  }

  // ── IndexedDB: drop any app-owned DBs (best-effort) ──
  if (typeof indexedDB !== "undefined") {
    try {
      indexedDB
        .databases?.()
        .then((dbs) => {
          dbs.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        })
        .catch(() => {});
    } catch {
      /* non-fatal */
    }
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
  const identifiedUserIdRef = useRef<string | null>(null);

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

<<<<<<< HEAD
=======
  // ─── ⭐ THE ONE AND ONLY LOGOUT FUNCTION ⭐ ───
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
  const handleSessionExpired = useCallback(
    async (redirectTo: string = "/auth/login") => {
      if (sessionExpiredRef.current) return;
      sessionExpiredRef.current = true;

<<<<<<< HEAD
=======
      // 1. Ask the server to invalidate the session cookie.
      //    Fire-and-forget — even if the network fails, we still clear client state.
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
      } catch {}
<<<<<<< HEAD

      clearClientCookies();
      clearClientStorage();
      sessionStorage.removeItem("lastActivity");

=======
  
      posthog.reset();
      identifiedUserIdRef.current = null;
      clearClientCookies();
      clearClientStorage();

      // 3. Reset all in-memory state.
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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
      setSearchTerm("");

      // 4. Bust caches.
      subscriptionCache.clear();
      notificationCache.clear();

<<<<<<< HEAD
      router.replace(redirectTo);

=======
      // 5. Navigate away (replace so back-button can't return to a protected page).
      router.replace(redirectTo);

      // 6. Release the guard after the redirect settles.
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
      setTimeout(() => {
        sessionExpiredRef.current = false;
      }, 2000);
    },
    [router, setUserData],
  );

<<<<<<< HEAD
=======
  // ─── Restore session from cookies (via /api/user/me) ───
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
=======
  // ─── Refresh user profile ───
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
=======
          try {
            localStorage.setItem("userData", JSON.stringify(fresh));
          } catch {
            /* quota — non-fatal */
          }

>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
=======
  useEffect(() => {
    if (!sessionRestored || !userData?.id) return;
    if (identifiedUserIdRef.current === userData.id) return;

    if (identifiedUserIdRef.current) {
      posthog.reset();
    }

    const personProperties: Record<string, string> = {};
    if (typeof userData.email === "string") personProperties.email = userData.email;
    if (typeof userData.fullName === "string") personProperties.name = userData.fullName;
    if (typeof userData.role === "string") personProperties.role = userData.role;
    if (typeof userData.subscription_tier === "string") {
      personProperties.subscription_tier = userData.subscription_tier;
    }

    posthog.identify(userData.id, personProperties);
    identifiedUserIdRef.current = userData.id;
  }, [sessionRestored, userData]);

  // ─── Theme initialization - LIGHT MODE DEFAULT ───
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
=======
  // ─── React to pathname / auth state changes ───
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
=======
  // ⚠️ NOTIFICATIONS API CALLS DISABLED ⚠️
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
      if (response.status === 401) return;
=======
      if (response.status === 401) {
        return;
      }
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2

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

<<<<<<< HEAD
        if (res.status === 401) return;
=======
        if (res.status === 401) {
          return;
        }

>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2
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

<<<<<<< HEAD
        if (res.status === 401) return;
=======
        if (res.status === 401) {
          return;
        }
>>>>>>> 99ce893ff767696abfe1d4ced95064a061765be2

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