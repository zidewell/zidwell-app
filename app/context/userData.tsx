// app/context/userData.tsx
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
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionTier = 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';

export interface SupabaseUser {
  id: string;
  full_name: string;
  fullName: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  wallet_balance?: number;
  zidcoin_balance?: number;
  referral_code?: string;
  referred_by?: string | null;
  bvn_verification?: string;
  identity_verified?: boolean;
  kyc_level?: string;
  verification_completed?: boolean;
  verification_step?: number;
  bank78_verified?: boolean;
  primary_provider?: string;
  wallet_provider?: string;
  bank78_personal_account_id?: string;
  bank78_personal_account_number?: string;
  bank78_personal_account_name?: string;
  bank78_personal_bank_name?: string;
  bank78_business_account_id?: string;
  bank78_business_account_number?: string;
  bank78_business_account_name?: string;
  bank78_business_bank_name?: string;
  bvn_data?: any;
  cac_data?: any;
  purpose?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  subscription_tier?: SubscriptionTier | null;
  subscription_expires_at?: string | null;
  is_business_registered?: boolean;
  region?: string | null;
  heard_from?: string | null;
  attractions?: string[] | null;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  date_of_birth?: string;
  city?: string;
  state?: string;
  address?: string;
  country?: string;
  profile_picture?: string;
  transaction_pin?: string;
  pin_set?: boolean;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  wallet_id?: string;
  admin_role?: string;
  is_blocked?: boolean;
  blocked_at?: string;
  block_reason?: string;
  last_login?: string;
  last_logout?: string;
  current_login_session?: string;
  notification_preferences?: any;
  wallet_updated_at?: string;
  total_invoices_created?: number;
  invoices_used_monthly?: number;
  receipts_used_monthly?: number;
  contracts_used_monthly?: number;
  last_usage_reset?: string;
  invoices_used_lifetime?: number;
  receipts_used_lifetime?: number;
  contracts_used_lifetime?: number;
  invoice_lifetime_limit?: number;
  receipt_lifetime_limit?: number;
  contract_lifetime_limit?: number;
  pin_attempts?: number;
  pin_locked_until?: string;
  pin_reset_token?: string;
  pin_reset_token_expires?: string;
  is_flagged?: boolean;
  flag_reason?: string;
  flag_notes?: string;
  flagged_at?: string;
  wallet_frozen?: boolean;
  wallet_freeze_reason?: string;
  wallet_frozen_at?: string;
  daily_transaction_limit?: number;
  monthly_transaction_limit?: number;
  limit_updated_at?: string;
  suspension_duration?: number;
  kyc_approved_at?: string;
  kyc_approved_by?: string;
  kyc_rejected_at?: string;
  kyc_rejection_reason?: string;
  kyc_rejected_by?: string;
  nin_verification?: string;
  verification_response?: string;
  nin?: string;
  email_verification_token?: string;
  email_verification_token_expires?: string;
  p_bank_name?: string;
  p_bank_code?: string;
  p_account_number?: string;
  p_account_name?: string;
  referral_source?: string;
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

interface Bank78Balance {
  personal: number;
  business: number;
  total: number;
}

interface UserContextType {
  user: SupabaseUser | null;
  userData: SupabaseUser | null;
  balance: number | null;
  lifetimeBalance: number;
  totalOutflow: number;
  totalTransactions: number;
  setUserData: Dispatch<SetStateAction<SupabaseUser | null>>;
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
  bank78Balance: Bank78Balance | null;
  bank78Loading: boolean;
  refreshBank78Balance: () => Promise<void>;
  hasBank78Account: boolean;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STATIC_PUBLIC_PAGES = [
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/about', '/contact', '/privacy', '/terms', '/auth', '/auth/callback',
  '/auth/login', '/auth/register', '/pricing', '/pay'
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
  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/article(\/.*)?$/,
  /^\/docs(\/.*)?$/,
  /^\/help(\/.*)?$/,
  /^\/faq(\/.*)?$/,
];

const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  manual_bookkeeping: 'free',
  auto_bookkeeping: 'free',
  payment_links: 'free',
  business_bank_account: 'free',
  basic_financial_overview: 'free',
  invoices_5: 'free',
  receipts_5: 'free',
  invoices_10: 'solopreneur',
  unlimited_receipts: 'solopreneur',
  branded_invoices: 'solopreneur',
  expense_tracking: 'solopreneur',
  financial_insights: 'solopreneur',
  bank_statement_upload: 'sme',
  connect_3_bank_accounts: 'sme',
  unlimited_invoices: 'sme',
  unlimited_receipts_sme: 'sme',
  vault: 'sme',
  tax_calculator: 'sme',
  financial_statements: 'sme',
  team_member_1: 'sme',
  multi_user_access: 'enterprise',
  role_permissions: 'enterprise',
  approval_system: 'enterprise',
  connect_5_bank_accounts: 'enterprise',
  downloadable_reports: 'enterprise',
  contracts_10: 'enterprise',
  dedicated_onboarding: 'enterprise',
  unlimited_contracts: 'corporation',
  department_access: 'corporation',
  unlimited_bank_accounts: 'corporation',
  payroll_system: 'corporation',
  advanced_reporting: 'corporation',
  custom_financial_structure: 'corporation',
  priority_onboarding: 'corporation',
  dedicated_account_manager: 'corporation',
};

const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'solopreneur', 'sme', 'enterprise', 'corporation'];

const UPGRADE_BENEFITS: Record<string, string[]> = {
  free_to_solopreneur: ["Up to 10 invoices (up from 5)", "Unlimited receipts (up from 5)", "Branded invoices", "Better expense tracking", "Basic financial insights"],
  free_to_sme: ["Upload bank statements", "Connect up to 3 bank accounts", "Unlimited invoices", "Unlimited receipts", "Vault for financial documents", "Tax calculator", "Financial statements", "1 extra team member access"],
  free_to_enterprise: ["Multi-user access", "Role-based permissions", "Request & approval system", "Connect 5 bank accounts", "Downloadable reports", "10 contracts", "Dedicated onboarding"],
  free_to_corporation: ["Unlimited contracts", "Department-based access", "Unlimited bank accounts", "Payroll system", "Advanced reporting", "Custom financial structure", "Priority onboarding", "Dedicated account manager"],
  solopreneur_to_sme: ["Upload bank statements", "Connect up to 3 bank accounts", "Unlimited invoices", "Unlimited receipts", "Vault", "Tax calculator", "Financial statements", "1 extra team member"],
  solopreneur_to_enterprise: ["Multi-user access", "Role permissions", "Approval system", "Connect 5 bank accounts", "Downloadable reports", "10 contracts", "Dedicated onboarding"],
  solopreneur_to_corporation: ["Unlimited contracts", "Department access", "Unlimited bank accounts", "Payroll", "Advanced reporting", "Custom structure", "Priority onboarding", "Dedicated manager"],
  sme_to_enterprise: ["Multi-user access", "Role permissions", "Approval system", "Connect 5 bank accounts", "Downloadable reports", "10 contracts", "Dedicated onboarding"],
  sme_to_corporation: ["Unlimited contracts", "Department access", "Unlimited bank accounts", "Payroll", "Advanced reporting", "Custom structure", "Priority onboarding", "Dedicated manager"],
  enterprise_to_corporation: ["Unlimited contracts", "Department access", "Unlimited bank accounts", "Payroll", "Advanced reporting", "Custom structure", "Priority onboarding", "Dedicated manager"],
};

let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
};

const supabase = getSupabaseClient();

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

  delete(key: string) { this.cache.delete(key); }
  clear() { this.cache.clear(); }
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) this.cache.delete(key);
    }
  }
}

class SubscriptionCache {
  private cache = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: this.DEFAULT_TTL });
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

  delete(key: string) { this.cache.delete(key); }
  clear() { this.cache.clear(); }
}

const notificationCache = new NotificationCache();
const subscriptionCache = new SubscriptionCache();

const createFullName = (firstName?: string, lastName?: string): string => {
  const first = firstName || "";
  const last = lastName || "";
  if (first && last) return `${first} ${last}`;
  return first || last || "";
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
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
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [bank78Balance, setBank78Balance] = useState<Bank78Balance | null>(null);
  const [bank78Loading, setBank78Loading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const fetchInProgress = useRef(false);

  const isPublicPage = useCallback(() => {
    if (!pathname) return false;
    if (STATIC_PUBLIC_PAGES.some(page => pathname === page)) return true;
    if (STATIC_PUBLIC_PAGES.some(page => pathname.startsWith(page + '/'))) return true;
    if (PUBLIC_PAGE_PATTERNS.some(pattern => pattern.test(pathname))) return true;
    return false;
  }, [pathname]);

  const isUserVerified = useCallback((data: SupabaseUser | null): boolean => {
    if (!data) return false;
    return (
      data.bvn_verification === 'verified' ||
      data.identity_verified === true ||
      data.kyc_level === 'personal_verified' ||
      data.kyc_level === 'business_verified' ||
      data.verification_completed === true
    );
  }, []);

  const fetchUserFromDB = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;
        const userId = authUser.id;
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) return null;
        if (data) {
          const fullName = createFullName(data.first_name, data.last_name);
          return {
            ...data,
            fullName: fullName,
            full_name: data.full_name || fullName,
            bvn_verification: data.bvn_verification || 'unverified',
            identity_verified: data.identity_verified || false,
            kyc_level: data.kyc_level || 'unverified',
            verification_completed: data.verification_completed || false,
            bank78_verified: data.bank78_verified || false,
          };
        }
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) return null;

      if (data) {
        const fullName = createFullName(data.first_name, data.last_name);
        return {
          ...data,
          fullName: fullName,
          full_name: data.full_name || fullName,
          bvn_verification: data.bvn_verification || 'unverified',
          identity_verified: data.identity_verified || false,
          kyc_level: data.kyc_level || 'unverified',
          verification_completed: data.verification_completed || false,
          bank78_verified: data.bank78_verified || false,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      const userData = await fetchUserFromDB();
      if (userData) {
        setUserData(userData);
        setUser(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
      } else {
        setUserData(null);
        setUser(null);
        localStorage.removeItem("userData");
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      fetchInProgress.current = false;
    }
  }, [fetchUserFromDB]);

  const initializeUser = useCallback(async () => {
    if (isInitialized) return;

    // ✅ Step 1: Load from localStorage immediately
    const stored = localStorage.getItem("userData");
    let hasStoredData = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          console.log('📦 Loaded user data from localStorage');
          setUserData(parsed);
          setUser(parsed);
          setShouldFetchData(!isPublicPage());
          hasStoredData = true;
          setLoading(false);
        }
      } catch (e) {
        localStorage.removeItem("userData");
      }
    }

    // ✅ Step 2: Always fetch fresh data in background
    try {
      console.log('🔄 Fetching fresh user data in background...');
      const freshUserData = await fetchUserFromDB();
      
      if (freshUserData) {
        console.log('✅ Fresh user data loaded');
        setUserData(freshUserData);
        setUser(freshUserData);
        localStorage.setItem("userData", JSON.stringify(freshUserData));
        setShouldFetchData(!isPublicPage());
        
        // Check verification and redirect if needed
        const verified = isUserVerified(freshUserData);
        const currentPath = window.location.pathname;
        
        if (verified && currentPath === '/onboarding') {
          router.replace('/dashboard');
        } else if (!verified && currentPath === '/dashboard') {
          router.replace('/onboarding');
        }
      } else if (!hasStoredData) {
        // No data anywhere
        setShouldFetchData(false);
        setUserData(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch fresh user data:', error);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
      setIsInitialized(true);
    }
  }, [isPublicPage, fetchUserFromDB, isUserVerified, router, isInitialized]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await refreshUserData();
        } else if (event === "SIGNED_OUT") {
          setUserData(null);
          setUser(null);
          localStorage.removeItem("userData");
          setShouldFetchData(false);
          setBalance(null);
          setBank78Balance(null);
          if (window.location.pathname.startsWith('/dashboard') || 
              window.location.pathname.startsWith('/onboarding')) {
            router.replace('/auth/login');
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [refreshUserData, router]);

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
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "userData") {
        const newData = e.newValue ? JSON.parse(e.newValue) : null;
        setUserData(newData);
        setUser(newData);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const clearNotificationCache = useCallback(() => notificationCache.clear(), []);

  const fetchNotifications = useCallback(async () => {
    console.log('📢 Notifications API disabled');
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    console.log('📢 Notifications API disabled');
  }, []);

  const markAsRead = useCallback(async () => {
    console.log('📢 Notifications API disabled');
  }, []);

  const markAllAsRead = useCallback(async () => {
    console.log('📢 Notifications API disabled');
  }, []);

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
      const response = await fetch('/api/subscription', {
        headers: { 'Content-Type': 'application/json' },
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
        setSubscription({ tier: 'free', status: 'active', expiresAt: null, features: {} });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({ tier: 'free', status: 'active', expiresAt: null, features: {} });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [shouldFetchData, userData?.id]);

  const refreshSubscription = useCallback(async () => {
    if (userData?.id) {
      subscriptionCache.delete(`subscription_${userData.id}`);
      await fetchSubscription();
    }
  }, [userData?.id, fetchSubscription]);

  const checkFeatureAccess = useCallback(async (
    featureKey: string,
    currentCount?: number
  ) => {
    if (!subscription) {
      return { hasAccess: false, message: "Unable to verify subscription", requiredTier: FEATURE_TIER_MAP[featureKey] || 'free' };
    }

    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'free';
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return { hasAccess: false, message: `This feature requires the ${requiredTier} plan or higher`, requiredTier };
    }

    if (!feature) {
      return { hasAccess: false, message: `This feature is not available in your ${subscription.tier} plan`, requiredTier };
    }

    if (feature.value === 'true' || feature.value === 'unlimited') {
      return { hasAccess: true };
    }

    if (feature.limit && currentCount !== undefined) {
      const limit = feature.limit;
      if (currentCount >= limit) {
        return {
          hasAccess: false,
          limit,
          message: `You've reached your limit of ${limit} for the ${subscription.tier} plan`,
          requiredTier,
        };
      }
      return { hasAccess: true, limit };
    }

    return { hasAccess: true };
  }, [subscription]);

  const canAccessFeature = useCallback((featureKey: string, currentCount?: number): boolean => {
    if (!subscription) return false;
    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'free';
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
    if (userTierIndex < requiredTierIndex) return false;
    if (!feature) return false;
    if (feature.value === 'true' || feature.value === 'unlimited') return true;
    if (feature.limit && currentCount !== undefined) return currentCount < feature.limit;
    return true;
  }, [subscription]);

  const subscribe = useCallback(async (
    tier: SubscriptionTier,
    paymentMethod: string,
    amount: number,
    paymentReference: string,
    isYearly: boolean = false
  ) => {
    if (!userData?.id) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', tier, paymentMethod, amount, paymentReference, isYearly }),
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
      console.error('Error subscribing:', error);
      return { success: false, error: error.message };
    }
  }, [userData?.id, fetchSubscription]);

  const cancelSubscription = useCallback(async () => {
    if (!userData?.id) return { success: false, error: 'User not authenticated' };

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();
      if (data.success) {
        subscriptionCache.delete(`subscription_${userData.id}`);
        await fetchSubscription();
      }
      return data;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }, [userData?.id, fetchSubscription]);

  const getUpgradeBenefits = useCallback((targetTier: SubscriptionTier): string[] => {
    const currentTier = subscription?.tier || 'free';
    return UPGRADE_BENEFITS[`${currentTier}_to_${targetTier}`] || [];
  }, [subscription?.tier]);

  const refreshBank78Balance = useCallback(async () => {
    if (!userData?.bank78_verified || !userData?.id) return;

    setBank78Loading(true);
    try {
      const response = await fetch(`/api/bank78/balance?userId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBank78Balance({
            personal: data.data.personal.balance || 0,
            business: data.data.business?.balance || 0,
            total: data.data.total || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch Bank78 balance:', error);
    } finally {
      setBank78Loading(false);
    }
  }, [userData]);

  const handleDarkModeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/wallet-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userData.id }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setBalance(data.wallet_balance ?? 0);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(userData?.zidcoinBalance ?? 0);
      }
    };
    fetchBalance();
  }, [userData?.id, userData?.zidcoinBalance, shouldFetchData]);

  useEffect(() => {
    if (userData?.bank78_verified && shouldFetchData) {
      refreshBank78Balance();
      const interval = setInterval(refreshBank78Balance, 30000);
      return () => clearInterval(interval);
    }
  }, [userData?.bank78_verified, shouldFetchData, refreshBank78Balance]);

  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const fetchTransactionStats = async () => {
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
        console.error('Error fetching transaction stats:', error);
      }
    };
    fetchTransactionStats();
  }, [userData?.id, shouldFetchData]);

  useEffect(() => {
    if (shouldFetchData && userData?.id) {
      fetchSubscription();
    }
  }, [userData?.id, shouldFetchData, fetchSubscription]);

  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const cleanupInterval = setInterval(() => notificationCache.cleanup(), 5 * 60 * 1000);
    const refreshInterval = setInterval(() => fetchSubscription(), 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userData?.id, shouldFetchData, fetchSubscription]);

  const hasBank78Account = userData?.bank78_verified === true;

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
        bank78Balance,
        bank78Loading,
        refreshBank78Balance,
        hasBank78Account,
        refreshUserData,
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