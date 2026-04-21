// context/userData.tsx
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

import { usePathname } from "next/navigation";

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
  // Add subscription fields with zidlite
  subscription_tier?: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite' | null;
  subscription_expires_at?: string | null;
}

// Add subscription interface with zidlite
export interface SubscriptionInfo {
  tier: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';
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
  // Add subscription-related methods with zidlite
  subscription: SubscriptionInfo | null;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (featureKey: string, currentCount?: number) => Promise<{
    hasAccess: boolean;
    limit?: number;
    message?: string;
    requiredTier?: string;
  }>;
  subscribe: (tier: 'zidlite' | 'growth' | 'premium' | 'elite', paymentMethod: string, amount: number, paymentReference: string, isYearly?: boolean) => Promise<any>;
  cancelSubscription: () => Promise<any>;
  getUpgradeBenefits: (targetTier: string) => string[];
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


const FEATURE_TIER_MAP: Record<string, string> = {
  'invoices_total': 'free', 
  'receipts_total': 'free',  
  'contracts_total': 'free',
  'transfer_fee': 'free',
  'bookkeeping_trial_days': 'free',
  'tax_calculator_trial_days': 'free',
  'support_type': 'free',
  
  // ZidLite features
  'zidlite_invoices_total': 'zidlite',
  'zidlite_receipts_total': 'zidlite',
  'zidlite_contracts_total': 'zidlite',
  'whatsapp_community': 'zidlite',
  
  // Growth features
  'bookkeeping_access': 'growth',
  'tax_calculator': 'growth',
  'growth_contracts': 'growth',
  
  // Premium features
  'payment_reminders': 'premium',
  'financial_statements': 'premium',
  'tax_support': 'premium',
  'priority_support': 'premium',
  
  // Elite features
  'full_tax_filing': 'elite',
  'vat_filing': 'elite',
  'paye_filing': 'elite',
  'wht_filing': 'elite',
  'cit_audit': 'elite',
  'cfo_guidance': 'elite',
  'direct_whatsapp_support': 'elite',
  'audit_coordination': 'elite',
};

// Tier hierarchy for upgrade benefits (includes zidlite)
const TIER_HIERARCHY = ['free', 'zidlite', 'growth', 'premium', 'elite'];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [lifetimeBalance, setLifetimeBalance] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  // Subscription states
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const pathname = usePathname();

  // Check if current page is public
  const isPublicPage = () => {
    if (!pathname) return false;
    
    // Check static pages
    if (STATIC_PUBLIC_PAGES.some(page => pathname === page)) {
      return true;
    }

    // Check if path starts with any static public page
    if (STATIC_PUBLIC_PAGES.some(page => 
      pathname.startsWith(page + '/')
    )) {
      return true;
    }

    // Check dynamic patterns
    if (PUBLIC_PAGE_PATTERNS.some(pattern => pattern.test(pathname))) {
      return true;
    }

    return false;
  };

  

  // Clear notification cache
  const clearNotificationCache = () => {
    notificationCache.clear();
  };


  useEffect(() => {
  if (typeof window !== 'undefined') {
    const hasPaymentCookie = document.cookie.includes('payment_processed=true');
    if (hasPaymentCookie) {
      setPaymentProcessed(true);
      // Clear the cookie
      document.cookie = 'payment_processed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
}, []);

  // Fetch notifications
  const fetchNotifications = async (filter: string = 'all', limit: number = 50) => {
    if (!shouldFetchData || !userData?.id) {
      return;
    }

    const cacheKey = `notifications_${userData.id}_${filter}_${limit}`;
    
    const cached = notificationCache.get(cacheKey);
    if (cached && filter === 'all') {
      setNotifications(cached);
      const newUnreadCount = cached.filter((n: Notification) => !n.read_at).length;
      setUnreadCount(newUnreadCount);
      return;
    }

    setNotificationsLoading(true);
    try {
      const params = new URLSearchParams({
        userId: userData.id,
        limit: limit.toString(),
        filter: filter
      });
      const response = await fetch(`/api/notifications?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        if (data && Array.isArray(data)) {
          setNotifications(data);
          
          const newUnreadCount = data.filter((n: Notification) => !n.read_at).length;
          setUnreadCount(newUnreadCount);

          if (filter === 'all') {
            notificationCache.set(cacheKey, data);
          }
        } else {
          setNotifications([]);
        }
      } else {
        const cached = notificationCache.get(cacheKey);
        if (cached) {
          setNotifications(cached);
        } else {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      const cached = notificationCache.get(cacheKey);
      if (cached) {
        setNotifications(cached);
      } else {
        setNotifications([]);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!shouldFetchData || !userData?.id) return;

    const cacheKey = `unread_count_${userData.id}`;
    
    const cached = notificationCache.get(cacheKey);
    if (cached !== undefined) {
      setUnreadCount(cached);
      return;
    }

    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        notificationCache.set(cacheKey, count, 60 * 1000);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!shouldFetchData || !userData?.id) return;

    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      notificationCache.delete(`notifications_${userData.id}_all_50`);
      notificationCache.delete(`notifications_${userData.id}_unread_50`);
      notificationCache.delete(`unread_count_${userData.id}`);

      await fetch(`/api/notifications/${notificationId}/read?userId=${userData.id}`, {
        method: 'POST'
      });

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!shouldFetchData || !userData?.id) return;

    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      clearNotificationCache();

      await fetch(`/api/notifications/read-all?userId=${userData.id}`, {
        method: 'POST'
      });

    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  // ============ SUBSCRIPTION METHODS ============

  // Fetch subscription data
  const fetchSubscription = async () => {
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
          // Convert expiresAt string to Date if needed
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
        // If no subscription found, set default free tier
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
  };

  // Refresh subscription (clear cache and fetch)
  const refreshSubscription = async () => {
    if (userData?.id) {
      subscriptionCache.delete(`subscription_${userData.id}`);
      await fetchSubscription();
    }
  };

  // Check if user can access a specific feature
  const checkFeatureAccess = async (
    featureKey: string, 
    currentCount?: number
  ): Promise<{ hasAccess: boolean; limit?: number; message?: string; requiredTier?: string }> => {
    if (!subscription) {
      return { 
        hasAccess: false, 
        message: "Unable to verify subscription",
        requiredTier: FEATURE_TIER_MAP[featureKey] || 'premium'
      };
    }

    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'premium';
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier as any);

    // Check if user's tier meets the requirement
    if (userTierIndex < requiredTierIndex) {
      return {
        hasAccess: false,
        message: `This feature requires the ${requiredTier} plan or higher`,
        requiredTier,
      };
    }

    // Check if feature exists in user's tier
    if (!feature) {
      return {
        hasAccess: false,
        message: `This feature is not available in your ${subscription.tier} plan`,
        requiredTier,
      };
    }

    // Check if feature value is "true" (boolean feature)
    if (feature.value === 'true') {
      return { hasAccess: true };
    }

    // Check if feature is unlimited
    if (feature.value === 'unlimited') {
      return { hasAccess: true };
    }

    // Check numeric limits
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
  };

  // Synchronous version of checkFeatureAccess for UI
  const canAccessFeature = (featureKey: string, currentCount?: number): boolean => {
    if (!subscription) return false;

    const feature = subscription.features[featureKey];
    const requiredTier = FEATURE_TIER_MAP[featureKey] || 'premium';
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier as any);

    // Check tier requirement
    if (userTierIndex < requiredTierIndex) {
      return false;
    }

    // Check if feature exists
    if (!feature) {
      return false;
    }

    // Check value
    if (feature.value === 'true' || feature.value === 'unlimited') {
      return true;
    }

    // Check limits
    if (feature.limit && currentCount !== undefined) {
      return currentCount < feature.limit;
    }

    return true;
  };

  // Subscribe to a paid tier (includes zidlite)
  const subscribe = async (
    tier: 'zidlite' | 'growth' | 'premium' | 'elite',
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
  };

  // Cancel subscription
  const cancelSubscription = async () => {
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
  };

  // Get upgrade benefits from current tier to target tier (includes zidlite)
  const getUpgradeBenefits = (targetTier: string): string[] => {
    const benefitsMap: Record<string, Record<string, string[]>> = {
      free: {
        zidlite: [
          "20 invoices total",
          "20 receipts total",
          "2 contracts total",
          "Access to WhatsApp Business Community",
          "WhatsApp support",
        ],
        growth: [
          "Unlimited invoices",
          "Unlimited receipts",
          "5 contracts total",
          "Bookkeeping tool access",
          "Tax calculator",
          "Access to WhatsApp Business Community",
          "WhatsApp support",
        ],
        premium: [
          "Everything in Growth, plus:",
          "Unlimited contracts",
          "Invoice Payment Reminders",
          "Financial statement preparation",
          "Tax calculation support",
          "Tax filing support",
          "Priority support",
        ],
        elite: [
          "Everything in Premium, plus:",
          "Full tax filing support (VAT, PAYE, WHT)",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
      zidlite: {
        growth: [
          "Unlimited invoices (up from 10)",
          "Unlimited receipts (up from 10)",
          "5 contracts total (up from 2)",
          "Bookkeeping tool",
          "Tax calculator",
        ],
        premium: [
          "Unlimited invoices & receipts",
          "Unlimited contracts (up from 2)",
          "Invoice Payment Reminders",
          "Financial statement preparation",
          "Tax calculation support",
          "Tax filing support",
          "Priority support",
        ],
        elite: [
          "Everything in Premium, plus:",
          "Full tax filing support (VAT, PAYE, WHT)",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
      growth: {
        premium: [
          "Unlimited contracts (up from 5)",
          "Invoice Payment Reminders",
          "Financial statement preparation",
          "Tax calculation support",
          "Tax filing support",
          "Priority support",
        ],
        elite: [
          "Everything in Premium, plus:",
          "Full tax filing support (VAT, PAYE, WHT)",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
      premium: {
        elite: [
          "Full tax filing support (VAT, PAYE, WHT)",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
    };

    const currentTier = subscription?.tier || 'free';
    return benefitsMap[currentTier]?.[targetTier] || [];
  };

  // ============ END SUBSCRIPTION METHODS ============


  useEffect(() => {
  const initializeUser = async () => {
    try {
      const storedUser = localStorage.getItem("userData");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserData(parsedUser);
        
        const isPublic = isPublicPage();
        setShouldFetchData(!isPublic);
        
        // If payment was processed, refresh subscription data
        if (paymentProcessed) {
          setTimeout(() => {
            refreshSubscription();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Failed to parse localStorage user:", error);
    } finally {
      setInitialCheckDone(true);
      setLoading(false);
    }
  };

  initializeUser();
}, [paymentProcessed]);

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
  }, [pathname, initialCheckDone]);

  // Fetch subscription when user is authenticated
  useEffect(() => {
    if (shouldFetchData && userData?.id) {
      fetchSubscription();
    }
  }, [userData?.id, shouldFetchData]);

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

  // Fetch notifications
  useEffect(() => {
    if (shouldFetchData && userData?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userData?.id, shouldFetchData]);

  // Cache cleanup and refresh intervals
  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const cleanupInterval = setInterval(() => {
      notificationCache.cleanup();
    }, 5 * 60 * 1000);

    const refreshInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
      fetchSubscription();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userData?.id, shouldFetchData]);

  // Theme initialization
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

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
        // Subscription values with zidlite
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
  if (!context)
    throw new Error("useUserContextData must be used inside UserProvider");
  return context;
};