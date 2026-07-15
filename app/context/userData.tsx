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

export type SubscriptionTier = 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';

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
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
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
  checkFeatureAccess: (featureKey: string, currentCount?: number) => Promise<{
    hasAccess: boolean;
    limit?: number;
    message?: string;
    requiredTier?: SubscriptionTier;
  }>;
  subscribe: (tier: SubscriptionTier, paymentMethod: string, amount: number, paymentReference: string, isYearly?: boolean) => Promise<any>;
  cancelSubscription: () => Promise<any>;
  getUpgradeBenefits: (targetTier: SubscriptionTier) => string[];
  canAccessFeature: (featureKey: string, currentCount?: number) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Static public pages
const STATIC_PUBLIC_PAGES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/auth',
  '/auth/callback',
  '/auth/login',
  '/auth/register',
  '/pricing',
  '/pay'
];

// Regex patterns for dynamic public routes
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
  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/article(\/.*)?$/,
  /^\/docs(\/.*)?$/,
  /^\/help(\/.*)?$/,
  /^\/faq(\/.*)?$/,
];

// Notification cache class
class NotificationCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 3 * 60 * 1000;
  private readonly UNREAD_COUNT_TTL = 60 * 1000;

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
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

// Subscription cache
class SubscriptionCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
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

// Feature to tier mapping
const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  // Free features
  'manual_bookkeeping': 'free',
  'auto_bookkeeping': 'free',
  'payment_links': 'free',
  'business_bank_account': 'free',
  'basic_financial_overview': 'free',
  'invoices_5': 'free',
  'receipts_5': 'free',
  
  // Solopreneur features
  'invoices_10': 'solopreneur',
  'unlimited_receipts': 'solopreneur',
  'branded_invoices': 'solopreneur',
  'expense_tracking': 'solopreneur',
  'financial_insights': 'solopreneur',
  
  // SME features
  'bank_statement_upload': 'sme',
  'connect_3_bank_accounts': 'sme',
  'unlimited_invoices': 'sme',
  'unlimited_receipts_sme': 'sme',
  'vault': 'sme',
  'tax_calculator': 'sme',
  'financial_statements': 'sme',
  'team_member_1': 'sme',
  
  // Enterprise features
  'multi_user_access': 'enterprise',
  'role_permissions': 'enterprise',
  'approval_system': 'enterprise',
  'connect_5_bank_accounts': 'enterprise',
  'downloadable_reports': 'enterprise',
  'contracts_10': 'enterprise',
  'dedicated_onboarding': 'enterprise',
  
  // Corporation features
  'unlimited_contracts': 'corporation',
  'department_access': 'corporation',
  'unlimited_bank_accounts': 'corporation',
  'payroll_system': 'corporation',
  'advanced_reporting': 'corporation',
  'custom_financial_structure': 'corporation',
  'priority_onboarding': 'corporation',
  'dedicated_account_manager': 'corporation',
};

// Tier hierarchy (lowest to highest)
const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'solopreneur', 'sme', 'enterprise', 'corporation'];

// Plan limits configuration
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
    receipts: 'unlimited',
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
    invoices: 'unlimited',
    receipts: 'unlimited',
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
    invoices: 'unlimited',
    receipts: 'unlimited',
    contracts: 10,
    teamMembers: 'unlimited',
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
    invoices: 'unlimited',
    receipts: 'unlimited',
    contracts: 'unlimited',
    teamMembers: 'unlimited',
    bankAccounts: 'unlimited',
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

// Upgrade benefits mapping
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

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default: light mode
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [lifetimeBalance, setLifetimeBalance] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const sessionRestoreInProgress = useRef(false);

  // Check if current page is public
  const isPublicPage = useCallback(() => {
    if (!pathname) return false;
    
    if (STATIC_PUBLIC_PAGES.some(page => pathname === page)) {
      return true;
    }

    if (STATIC_PUBLIC_PAGES.some(page => pathname.startsWith(page + '/'))) {
      return true;
    }

    if (PUBLIC_PAGE_PATTERNS.some(pattern => pattern.test(pathname))) {
      return true;
    }

    return false;
  }, [pathname]);

  // Clear session cookies
  const clearSessionCookies = useCallback(() => {
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-login-time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, []);

  // Restore session from cookies
  const restoreSessionFromCookies = useCallback(async () => {
    if (sessionRestoreInProgress.current) return null;
    
    sessionRestoreInProgress.current = true;
    
    try {
      const hasSessionCookie = document.cookie.includes('sb-client-session=true');
      
      if (!hasSessionCookie) {
        return null;
      }

      const response = await fetch('/api/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const userProfile = await response.json();
        if (userProfile && userProfile.id) {
          return userProfile;
        }
      } else if (response.status === 401) {
        // Session expired, clear cookies
        clearSessionCookies();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    } finally {
      sessionRestoreInProgress.current = false;
    }
  }, [clearSessionCookies]);

  // Initialize user from localStorage or session
  const initializeUser = useCallback(async () => {
    try {
      // First check localStorage
      const storedUser = localStorage.getItem("userData");
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserData(parsedUser);
        setShouldFetchData(!isPublicPage());
        setLoading(false);
        setInitialCheckDone(true);
        return;
      }

      // No stored user, try to restore from session
      const restoredUser = await restoreSessionFromCookies();
      
      if (restoredUser) {
        setUser(restoredUser);
        setUserData(restoredUser);
        localStorage.setItem("userData", JSON.stringify(restoredUser));
        setShouldFetchData(!isPublicPage());
        setSessionRestored(true);
      } else {
        setShouldFetchData(false);
      }
      
    } catch (error) {
      console.error("Failed to initialize user:", error);
      localStorage.removeItem("userData");
      clearSessionCookies();
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  }, [isPublicPage, restoreSessionFromCookies, clearSessionCookies]);

  // Run initialization on mount
  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Theme initialization - LIGHT MODE DEFAULT
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    
    if (storedTheme === "dark") {
      // User previously chose dark mode
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      // Default to light mode
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
      // Only set localStorage if not set to keep light as default
      if (!storedTheme) {
        localStorage.setItem("theme", "light");
      }
    }
  }, []);

  // Watch for payment processed cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasPaymentCookie = document.cookie.includes('payment_processed=true');
      if (hasPaymentCookie) {
        setPaymentProcessed(true);
        document.cookie = 'payment_processed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    }
  }, []);

  // Watch for pathname changes
  useEffect(() => {
    if (!initialCheckDone) return;

    const isPublic = isPublicPage();
    setShouldFetchData(!isPublic);
    
    if (isPublic) {
      setBalance(null);
      setNotifications([]);
      setUnreadCount(0);
      setLifetimeBalance(0);
      setTotalOutflow(0);
      setTotalTransactions(0);
      setSubscription(null);
    }
  }, [pathname, initialCheckDone, isPublicPage]);

  // Clear notification cache
  const clearNotificationCache = useCallback(() => {
    notificationCache.clear();
  }, []);

  // ⚠️ NOTIFICATIONS API CALLS COMMENTED OUT ⚠️
  const fetchNotifications = useCallback(async (filter: string = 'all', limit: number = 50) => {
    console.log('📢 Notifications API disabled - fetchNotifications called but skipped');
    return;
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    console.log('📢 Notifications API disabled - fetchUnreadCount called but skipped');
    return;
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('📢 Notifications API disabled - markAsRead called but skipped');
    return;
  }, []);

  const markAllAsRead = useCallback(async () => {
    console.log('📢 Notifications API disabled - markAllAsRead called but skipped');
    return;
  }, []);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    if (!shouldFetchData || !userData?.id) {
      setSubscription(null);
      return;
    }

    const cacheKey = `subscription_${userData.id}`;
    const cached = subscriptionCache.get(cacheKey);
    
    if (cached) {
      setSubscription(cached);
      return;
    }

    setSubscriptionLoading(true);
    try {
      const response = await fetch(`/api/subscription`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscription) {
          const subscriptionData = {
            ...data.subscription,
            expiresAt: data.subscription.expiresAt ? new Date(data.subscription.expiresAt) : null
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
          tier: 'free',
          status: 'active',
          expiresAt: null,
          features: {},
        };
        setSubscription(defaultSubscription);
      }
    } catch (error) {
      console.error('❌ Error fetching subscription:', error);
      setSubscription({
        tier: 'free',
        status: 'active',
        expiresAt: null,
        features: {},
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [shouldFetchData, userData?.id]);

  // Refresh subscription
  const refreshSubscription = useCallback(async () => {
    if (userData?.id) {
      subscriptionCache.delete(`subscription_${userData.id}`);
      await fetchSubscription();
    }
  }, [userData?.id, fetchSubscription]);

  // Check feature access
  const checkFeatureAccess = useCallback(async (
    featureKey: string, 
    currentCount?: number
  ): Promise<{ hasAccess: boolean; limit?: number; message?: string; requiredTier?: SubscriptionTier }> => {
    if (!subscription) {
      return { 
        hasAccess: false, 
        message: "Unable to verify subscription",
        requiredTier: FEATURE_TIER_MAP[featureKey] || 'free'
      };
    }

    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'free';
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

    if (feature.value === 'true') {
      return { hasAccess: true };
    }

    if (feature.value === 'unlimited') {
      return { hasAccess: true };
    }

    if (feature.limit && currentCount !== undefined) {
      const limit = feature.limit;
      if (currentCount >= limit) {
        return {
          hasAccess: false,
          limit,
          message: `You've reached your ${featureKey.replace(/_/g, ' ')} limit of ${limit} for the ${subscription.tier} plan`,
          requiredTier,
        };
      }
      return { hasAccess: true, limit };
    }

    return { hasAccess: true };
  }, [subscription]);

  // Check feature access synchronously
  const canAccessFeature = useCallback((featureKey: string, currentCount?: number): boolean => {
    if (!subscription) return false;

    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'free';
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return false;
    }

    if (!feature) {
      return false;
    }

    if (feature.value === 'true' || feature.value === 'unlimited') {
      return true;
    }

    if (feature.limit && currentCount !== undefined) {
      return currentCount < feature.limit;
    }

    return true;
  }, [subscription]);

  // Subscribe to a paid tier
  const subscribe = useCallback(async (
    tier: SubscriptionTier,
    paymentMethod: string,
    amount: number,
    paymentReference: string,
    isYearly: boolean = false
  ) => {
    if (!userData?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          tier,
          paymentMethod,
          amount,
          paymentReference,
          isYearly,
        }),
      });

      const data = await response.json();

      if (data.success) {
        subscriptionCache.delete(`subscription_${userData.id}`);
        await fetchSubscription();
        
        setUserData((prev: any) => ({
          ...prev,
          subscription_tier: tier,
          subscription_expires_at: data.subscription?.expires_at,
        }));
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error subscribing:', error);
      return { success: false, error: error.message };
    }
  }, [userData?.id, fetchSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!userData?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      });

      const data = await response.json();

      if (data.success) {
        subscriptionCache.delete(`subscription_${userData.id}`);
        await fetchSubscription();
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }, [userData?.id, fetchSubscription]);

  // Get upgrade benefits
  const getUpgradeBenefits = useCallback((targetTier: SubscriptionTier): string[] => {
    const currentTier = subscription?.tier || 'free';
    const key = `${currentTier}_to_${targetTier}`;
    return UPGRADE_BENEFITS[key] || [];
  }, [subscription?.tier]);

  // Get plan limits
  const getPlanLimits = useCallback(() => {
    const tier = subscription?.tier || 'free';
    return PLAN_LIMITS[tier];
  }, [subscription?.tier]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!shouldFetchData || !userData?.id) return;

      try {
        const res = await fetch("/api/wallet-balance", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userData.id }),
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch balance');
        }

        setBalance(data.wallet_balance ?? 0);
      } catch (error) {
        console.error('❌ Error fetching balance:', error);
        setBalance(userData?.zidcoinBalance ?? 0);
      }
    };

    if (shouldFetchData && userData?.id) {
      fetchBalance();
    }
  }, [userData?.id, userData?.zidcoinBalance, shouldFetchData]);

  // Fetch transaction stats
  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!shouldFetchData || !userData?.id) return;

      const cacheKey = `transaction_stats_${userData.id}`;
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });

        const data = await res.json();
        const stats = {
          lifetimeBalance: data.totalInflow || 0,
          totalOutflow: data.totalOutflow || 0,
          totalTransactions: data.totalTransactions || 0
        };
        
        setLifetimeBalance(stats.lifetimeBalance);
        setTotalOutflow(stats.totalOutflow);
        setTotalTransactions(stats.totalTransactions);
        notificationCache.set(cacheKey, stats, 5 * 60 * 1000);
      } catch (error) {
        console.error('❌ Error fetching transaction stats:', error);
      }
    };

    if (shouldFetchData && userData?.id) {
      fetchTransactionStats();
    }
  }, [userData?.id, shouldFetchData]);

  // Fetch subscription on change
  useEffect(() => {
    if (shouldFetchData && userData?.id) {
      fetchSubscription();
    }
  }, [userData?.id, shouldFetchData, fetchSubscription]);

  // Cache cleanup and refresh intervals
  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const cleanupInterval = setInterval(() => {
      notificationCache.cleanup();
    }, 5 * 60 * 1000);

    const refreshInterval = setInterval(() => {
      fetchSubscription();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userData?.id, shouldFetchData, fetchSubscription]);

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
        userData,
        balance: shouldFetchData ? balance : null,
        lifetimeBalance: shouldFetchData ? lifetimeBalance : 0,
        totalOutflow: shouldFetchData ? totalOutflow : 0,
        totalTransactions: shouldFetchData ? totalTransactions : 0,
        setUserData,
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