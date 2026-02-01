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
  firstName: string;
  lastName: string;
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
];

// Regex patterns for dynamic public routes
const PUBLIC_PAGE_PATTERNS = [
  /^\/sign-contract\/[^\/]+$/,
  /^\/sign-receipt\/[^\/]+$/,
  /^\/pay-invoice\/[^\/]+$/,
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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

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

    if (pathname.startsWith('/sign-contract/')) return true;
    if (pathname.startsWith('/sign-receipt/')) return true;
    if (pathname.startsWith('/pay-invoice/')) return true;

    return false;
  };

  // Clear notification cache
  const clearNotificationCache = () => {
    notificationCache.clear();
  };

  // Fetch notifications
  const fetchNotifications = async (filter: string = 'all', limit: number = 50) => {
    if (!shouldFetchData || !userData?.id) {
      console.log('❌ No userData.id available or should not fetch data');
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
          setLastFetchTime(Date.now());
          
          const newUnreadCount = data.filter((n: Notification) => !n.read_at).length;
          setUnreadCount(newUnreadCount);

          if (filter === 'all') {
            notificationCache.set(cacheKey, data);
          }
        } else {
          console.error('❌ Invalid data format:', data);
          setNotifications([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch notifications:', errorText);
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
      const calculatedCount = notifications.filter(n => !n.read_at).length;
      setUnreadCount(calculatedCount);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!shouldFetchData || !userData?.id) return;

    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Clear relevant cache
      notificationCache.delete(`notifications_${userData.id}_all_50`);
      notificationCache.delete(`notifications_${userData.id}_unread_50`);
      notificationCache.delete(`unread_count_${userData.id}`);

      // Update on server
      const response = await fetch(`/api/notifications/${notificationId}/read?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Refresh data to sync with server
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!shouldFetchData || !userData?.id) return;

    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      // Clear cache
      clearNotificationCache();

      // Update on server
      const response = await fetch(`/api/notifications/read-all?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  // Initialize user from localStorage and determine if we should fetch data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserData(parsedUser);
          
          // Check if we're on a public page
          const isPublic = isPublicPage();
          if (isPublic) {
            setShouldFetchData(false);
          } else {
            setShouldFetchData(true);
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
  }, []);

  // Watch for pathname changes
  useEffect(() => {
    if (!initialCheckDone) return;

    const isPublic = isPublicPage();
    
    if (isPublic) {
      setShouldFetchData(false);
      if (userData) {
        setBalance(null);
        setNotifications([]);
        setUnreadCount(0);
        setLifetimeBalance(0);
        setTotalOutflow(0);
        setTotalTransactions(0);
      }
    } else {
      setShouldFetchData(true);
    }
  }, [pathname, initialCheckDone, userData]);

  // Fetch balance (only when shouldFetchData is true)
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

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch balance');
        }

        const balance = data.wallet_balance ?? 0;
        setBalance(balance);
        
      } catch (error) {
        console.error('❌ Error fetching balance:', error);
        if (userData?.zidcoinBalance !== undefined) {
          setBalance(userData.zidcoinBalance);
        } else {
          setBalance(0);
        }
      }
    };

    if (shouldFetchData && userData?.id) {
      fetchBalance();
    }
  }, [userData?.id, userData?.zidcoinBalance, shouldFetchData]);

  // Fetch transaction stats (lifetime balance, total outflow, total transactions)
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
        if (cached) {
          setLifetimeBalance(cached.lifetimeBalance);
          setTotalOutflow(cached.totalOutflow);
          setTotalTransactions(cached.totalTransactions);
        }
      }
    };

    if (shouldFetchData && userData?.id) {
      fetchTransactionStats();
    }
  }, [userData?.id, shouldFetchData]);

  // Fetch notifications (only when shouldFetchData is true)
  useEffect(() => {
    if (shouldFetchData && userData?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [userData?.id, shouldFetchData]);

  // Cache cleanup and refresh intervals (only when shouldFetchData is true)
  useEffect(() => {
    if (!shouldFetchData || !userData?.id) return;

    const cleanupInterval = setInterval(() => {
      notificationCache.cleanup();
    }, 5 * 60 * 1000);

    const refreshInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [userData?.id, shouldFetchData]);

  // Theme initialization (always runs)
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