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
import { supabase } from "../supabase/supabase";

export type PodcastEpisode = {
  id: string;
  title: string;
  creator: string;
  pubDate: string;
  link: string;
  tags?: string[];
};

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

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  current_login_session: any;
  zidcoinBalance: number;
  bvnVerification: string;
  referralCode: string;
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
  setUserData: Dispatch<SetStateAction<any | null>>;
  loading: boolean;
  episodes: PodcastEpisode[];
  transactions: any[];
  lifetimeBalance: number;
  totalOutflow: number;
  totalTransactions: number;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  handleDarkModeToggle: () => void;
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  fetchNotifications: (filter?: string, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  clearNotificationCache: () => void;
  setTransactions: Dispatch<SetStateAction<any[]>>;
}

// ADD THIS LINE - Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

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
  // Your specific dynamic pages
  /^\/sign-contract\/[^\/]+$/,           // /sign-contract/[token]
  /^\/sign-receipt\/[^\/]+$/,            // /sign-receipt/[token]
  /^\/pay-invoice\/[^\/]+$/,             // /pay-invoice/[token]
  
  // Common dynamic pages you might have
  /^\/verify-email\/[^\/]+$/,            // /verify-email/[token]
  /^\/reset-password\/[^\/]+$/,          // /reset-password/[token]
  /^\/invite\/[^\/]+$/,                  // /invite/[code]
  /^\/share\/[^\/]+$/,                   // /share/[id]
  /^\/preview\/[^\/]+$/,                 // /preview/[id]
  /^\/public\/[^\/]+$/,                  // /public/[id]
  
  // Blog/content pages (if applicable)
  /^\/blog(\/.*)?$/,                     // All blog pages
  /^\/news(\/.*)?$/,                     // All news pages
  /^\/article(\/.*)?$/,                  // All article pages
  
  // Documentation pages
  /^\/docs(\/.*)?$/,                     // All documentation pages
  /^\/help(\/.*)?$/,                     // All help pages
  /^\/faq(\/.*)?$/,                      // All FAQ pages
];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lifetimeBalance, setLifetimeBalance] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [transactionPage, setTransactionPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [debugMode] = useState(false); // Set to true for debugging

  const pathname = usePathname();

  // Check if current page is public
  const isPublicPage = () => {
    if (!pathname) return false;
    
    // Check static pages
    if (STATIC_PUBLIC_PAGES.some(page => pathname === page)) {
      if (debugMode) console.log(`Public page (static): ${pathname}`);
      return true;
    }

    // Check if path starts with any static public page
    if (STATIC_PUBLIC_PAGES.some(page => 
      pathname.startsWith(page + '/')
    )) {
      if (debugMode) console.log(`Public page (static prefix): ${pathname}`);
      return true;
    }

    // Check dynamic patterns
    if (PUBLIC_PAGE_PATTERNS.some(pattern => pattern.test(pathname))) {
      if (debugMode) console.log(`Public page (pattern): ${pathname}`);
      return true;
    }

    // Additional specific checks for common patterns
    if (pathname.startsWith('/sign-contract/')) {
      if (debugMode) console.log(`Public page (sign-contract): ${pathname}`);
      return true;
    }

    if (pathname.startsWith('/sign-receipt/')) {
      if (debugMode) console.log(`Public page (sign-receipt): ${pathname}`);
      return true;
    }

    if (pathname.startsWith('/pay-invoice/')) {
      if (debugMode) console.log(`Public page (pay-invoice): ${pathname}`);
      return true;
    }

    if (debugMode) console.log(`Protected page: ${pathname}`);
    return false;
  };

  const clearNotificationCache = () => {
    notificationCache.clear();
  };

  const fetchNotifications = async (filter: string = 'all', limit: number = 50) => {
    if (!userData?.id) {
      console.log('❌ No userData.id available');
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
        const cached = notificationCache.get(cacheKey);
        if (cached) {
          setNotifications(cached);
        } else {
          setNotifications([]);
        }
      }
    } catch (error) {
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

  const fetchUnreadCount = async () => {
    if (!userData?.id) return;

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
      const calculatedCount = notifications.filter(n => !n.read_at).length;
      setUnreadCount(calculatedCount);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userData?.id) return;

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

      const response = await fetch(`/api/notifications/${notificationId}/read?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
    } catch (error) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.id) return;

    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      clearNotificationCache();

      const response = await fetch(`/api/notifications/read-all?userId=${userData.id}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      await fetchNotifications();
    } catch (error) {
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
            if (debugMode) console.log('Public page detected, skipping data fetch');
            setShouldFetchData(false);
          } else {
            if (debugMode) console.log('Protected page detected, will fetch data');
            setShouldFetchData(true);
          }
        } else {
          // No user in localStorage
          setShouldFetchData(false);
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

  // Watch for pathname changes to update shouldFetchData
  useEffect(() => {
    if (!initialCheckDone) return;

    const isPublic = isPublicPage();
    
    if (isPublic) {
      if (debugMode) console.log('Switched to public page, stopping data fetches');
      setShouldFetchData(false);
      
      // Clear sensitive data when moving to public pages
      if (userData) {
        setTransactions([]);
        setNotifications([]);
        setUnreadCount(0);
        setBalance(null);
        setLifetimeBalance(0);
        setTotalOutflow(0);
        setTotalTransactions(0);
      }
    } else {
      if (debugMode) console.log('Switched to protected page, enabling data fetches');
      setShouldFetchData(true);
    }
  }, [pathname, initialCheckDone, userData]);

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

  const fetchEpisodes = async () => {
    const cacheKey = 'podcast_episodes';
    const cached = notificationCache.get(cacheKey);
    
    if (cached) {
      setEpisodes(cached);
      return;
    }

    try {
      const res = await fetch("/api/medium-feed");
      const data = await res.json();
      setEpisodes(data);
      notificationCache.set(cacheKey, data, 10 * 60 * 1000);
    } catch (err) {
      const cached = notificationCache.get(cacheKey);
      if (cached) {
        setEpisodes(cached);
      }
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!shouldFetchData || !userData?.id) return;

      const cacheKey = `balance_${userData.id}`;
      const cached = notificationCache.get(cacheKey);
      
      if (cached !== undefined && cached !== null) {
        setBalance(cached);
        return;
      }

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
        notificationCache.set(cacheKey, balance, 2 * 60 * 1000);
        
      } catch (error) {
        if (cached !== undefined && cached !== null) {
          setBalance(cached);
        } else if (userData?.zidcoinBalance !== undefined) {
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

  // Fetch transactions (only when shouldFetchData is true)
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!shouldFetchData || !userData?.id) {
        setTransactions([]);
        return;
      }

      const cacheKey = `transactions_${userData.id}_${searchTerm}`;
      const cached = notificationCache.get(cacheKey);
      
      if (cached) {
        setTransactions(cached);
        setTransactionPage(1);
        setHasMoreTransactions(cached.length >= 10);
        return;
      }

      setTransactionsLoading(true);
      try {
        const params = new URLSearchParams({
          userId: userData.id,
          page: "1",
          limit: "10",
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const res = await fetch(`/api/bill-transactions?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        const transactions = data.transactions || [];
        setTransactions(transactions);
        setTransactionPage(1);
        setHasMoreTransactions(data.hasMore || false);
        notificationCache.set(cacheKey, transactions, 3 * 60 * 1000);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
        
        const cached = notificationCache.get(cacheKey);
        if (cached) {
          setTransactions(cached);
        }
      } finally {
        setTransactionsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userData?.id, searchTerm, shouldFetchData]);

  // Fetch transaction stats (only when shouldFetchData is true)
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
        setUserData,
        loading: loading || (shouldFetchData && transactionsLoading),
        episodes,
        isDarkMode,
        setIsDarkMode,
        handleDarkModeToggle,
        transactions: shouldFetchData ? transactions : [],
        setTransactions,
        lifetimeBalance: shouldFetchData ? lifetimeBalance : 0,
        totalOutflow: shouldFetchData ? totalOutflow : 0,
        totalTransactions: shouldFetchData ? totalTransactions : 0,
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