"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Plus,
  BookOpen,
  LayoutGrid,
  Receipt,
  FileText,
  FileSignature,
  Wallet,
  Users,
  CreditCard,
  Target,
  BarChart3,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import CircleAction from "./CircleAction";
import { useUserContextData } from "@/app/context/userData";

// Define transaction types
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "p2p_credit",
  "referral",
  "referral_reward",
  "funding",
  "credit",
];

const outflowTypes = [
  "transfer",
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "p2p_transfer",
  "p2p_debit",
  "payment",
  "expense",
];

// Cache keys
const CACHE_KEY = "todays_money_transactions";
const CACHE_TIMESTAMP_KEY = "todays_money_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

interface CachedData {
  transactions: any[];
  metrics: {
    totalInflow: number;
    totalOutflow: number;
    totalTransactions: number;
    netFlow: number;
  };
}

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    {/* Balance + health skeleton */}
    <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 shadow-[2px_2px_0px_var(--border-color)]">
        <div className="h-4 w-32 bg-(--bg-secondary) rounded mb-4"></div>
        <div className="h-16 w-48 bg-(--bg-secondary) rounded"></div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="h-8 w-40 bg-(--bg-secondary) rounded-full"></div>
          <div className="h-4 w-32 bg-(--bg-secondary) rounded"></div>
        </div>
      </div>
      <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center justify-center">
        <div className="h-4 w-32 bg-(--bg-secondary) rounded mb-4"></div>
        <div className="relative grid place-items-center">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border-color)" strokeWidth="12" />
            <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeDasharray="326.73" strokeDashoffset="58.81" />
          </svg>
          <div className="absolute text-center">
            <div className="h-8 w-12 bg-(--bg-secondary) rounded mx-auto"></div>
            <div className="h-3 w-16 bg-(--bg-secondary) rounded mt-2 mx-auto"></div>
          </div>
        </div>
      </div>
    </section>

    {/* Metrics skeleton */}
    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-6 shadow-[2px_2px_0px_var(--border-color)]">
          <div className="h-4 w-24 bg-(--bg-secondary) rounded mb-3"></div>
          <div className="h-8 w-32 bg-(--bg-secondary) rounded"></div>
          <div className="h-4 w-28 bg-(--bg-secondary) rounded mt-3"></div>
        </div>
      ))}
    </section>

    {/* Actions skeleton */}
    <section>
      <div className="h-8 w-48 bg-(--bg-secondary) rounded mb-8"></div>
      <div className="flex flex-wrap gap-8 sm:gap-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-3.5">
            <div className="w-24 sm:w-28 aspect-square rounded-full bg-(--bg-secondary)"></div>
            <div className="h-4 w-20 bg-(--bg-secondary) rounded"></div>
          </div>
        ))}
      </div>
    </section>

    {/* Tools + transactions skeleton */}
    <section className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
      <div>
        <div className="h-8 w-48 bg-(--bg-secondary) rounded mb-6"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center gap-3">
              <div className="h-6 w-6 bg-(--bg-secondary) rounded"></div>
              <div className="h-3 w-16 bg-(--bg-secondary) rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-8 w-48 bg-(--bg-secondary) rounded mb-6"></div>
        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md shadow-[2px_2px_0px_var(--border-color)] divide-y divide-(--border-color) overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-5">
              <div className="h-11 w-11 rounded-full bg-(--bg-secondary) shrink-0"></div>
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 bg-(--bg-secondary) rounded"></div>
                <div className="h-3 w-24 bg-(--bg-secondary) rounded mt-2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 bg-(--bg-secondary) rounded"></div>
                <div className="h-3 w-16 bg-(--bg-secondary) rounded mt-1 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const TodaysMoney = () => {
  const router = useRouter();
  const { userData, balance } = useUserContextData();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    totalTransactions: 0,
    netFlow: 0,
  });
  const [isFromCache, setIsFromCache] = useState(false);
  const fetchInProgress = useRef(false);

  const circumference = 2 * Math.PI * 52;
  const healthScore = 82;

  // Helper to get cached data
  const getCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      
      // Check if cache is still valid
      if (now - cacheTime > CACHE_DURATION) {
        // Cache expired, clear it
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        return null;
      }
      
      return JSON.parse(cached);
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }, []);

  // Helper to save data to cache
  const saveToCache = useCallback((data: CachedData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }, []);

  // Calculate metrics from transactions
  const calculateMetrics = useCallback((transactions: any[]) => {
    const successfulTransactions = transactions.filter(
      (tx: any) => tx.status === "success" || tx.status === "completed"
    );

    const inflow = successfulTransactions.filter((tx: any) =>
      inflowTypes.includes(tx.type?.toLowerCase())
    );
    const outflow = successfulTransactions.filter((tx: any) =>
      outflowTypes.includes(tx.type?.toLowerCase())
    );

    const totalInflow = inflow.reduce(
      (sum: number, tx: any) => sum + Number(tx.amount || 0),
      0
    );
    const totalOutflow = outflow.reduce(
      (sum: number, tx: any) => sum + Number(tx.amount || 0),
      0
    );

    return {
      totalInflow,
      totalOutflow,
      totalTransactions: successfulTransactions.length,
      netFlow: totalInflow - totalOutflow,
    };
  }, []);

  // Fetch all transactions
  const fetchAllTransactions = useCallback(async (forceRefresh = false) => {
    if (!userData?.id) return;
    
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) return;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        const { transactions, metrics: cachedMetrics } = cachedData;
        setAllTransactions(transactions);
        setRecentTransactions(transactions.slice(0, 5));
        setMetrics(cachedMetrics);
        setIsFromCache(true);
        setLoading(false);
        return;
      }
    }

    fetchInProgress.current = true;
    setLoading(true);
    setIsFromCache(false);

    try {
      let allTxns: any[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100;

      // Fetch all pages to get complete data
      while (hasMore) {
        const params = new URLSearchParams({
          userId: userData.id,
          page: page.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(
          `/api/bill-transactions?${params.toString()}`
        );
        const data = await response.json();

        if (data.transactions && data.transactions.length > 0) {
          allTxns = [...allTxns, ...data.transactions];
          hasMore = data.hasMore || false;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Calculate metrics
      const calculatedMetrics = calculateMetrics(allTxns);

      // Update state
      setAllTransactions(allTxns);
      setRecentTransactions(allTxns.slice(0, 5));
      setMetrics(calculatedMetrics);

      // Save to cache
      saveToCache({
        transactions: allTxns,
        metrics: calculatedMetrics,
      });

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [userData, getCachedData, calculateMetrics, saveToCache]);

  // Initial fetch on mount and when user changes
  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  // Refresh data periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not already loading
      if (!fetchInProgress.current) {
        fetchAllTransactions(true); // Force refresh
      }
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchAllTransactions]);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    if (amount === 0) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to determine if transaction is outflow
  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  // Get description for transaction
  const getDescription = (transaction: any) => {
    return (
      transaction.narration ||
      transaction.description ||
      transaction.external_response?.data?.transaction?.narration ||
      transaction.external_response?.withdrawal_details?.narration ||
      "Transaction"
    );
  };

  // Format amount with + or - sign and proper color
  const formatAmount = (transaction: any) => {
    const isOutflowTransaction = isOutflow(transaction.type);
    const amount = Number(transaction.amount) || 0;
    const formatted = formatCurrency(amount);

    return {
      display: formatted,
      signedDisplay: isOutflowTransaction ? `-${formatted}` : `+${formatted}`,
      isOutflow: isOutflowTransaction,
      rawAmount: amount,
      color: isOutflowTransaction ? "text-(--color-accent-yellow)" : "text-[#00B64F]",
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return `Today · ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date >= yesterday) {
      return `Yesterday · ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} · ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    const configs: any = {
      success: { label: "Completed", className: "text-[#00B64F]" },
      completed: { label: "Completed", className: "text-[#00B64F]" },
      pending: { label: "Pending", className: "text-(--color-accent-yellow)" },
      failed: { label: "Failed", className: "text-red-500" },
      processing: { label: "Processing", className: "text-blue-500" },
    };
    return configs[status?.toLowerCase()] || configs.pending;
  };

  // Use real balance from context or fallback
  const displayBalance = balance ?? 0;

  // Use real metrics calculated from all transactions
  const displayMetrics = [
    {
      label: "Money In",
      value: formatCurrency(metrics.totalInflow),
      delta: `+${formatCurrency(metrics.totalInflow)}`,
      positive: true,
    },
    {
      label: "Money Out",
      value: formatCurrency(metrics.totalOutflow),
      delta: `-${formatCurrency(metrics.totalOutflow)}`,
      positive: false,
    },
    {
      label: "Profit",
      value: formatCurrency(metrics.netFlow),
      delta: `${metrics.netFlow >= 0 ? "+" : ""}${formatCurrency(metrics.netFlow)}`,
      positive: metrics.netFlow >= 0,
    },
    {
      label: "Transactions",
      value: metrics.totalTransactions.toString(),
      delta: `${metrics.totalTransactions} total`,
      positive: true,
    },
  ];

  // Tools data with actual routes from FeatureCards
  const tools = [
    { 
      title: "Receipts", 
      icon: Receipt,
      route: "/dashboard/services/receipt",
    },
    { 
      title: "Invoices", 
      icon: FileText,
      route: "/dashboard/services/create-invoice",
    },
    { 
      title: "Contracts", 
      icon: FileSignature,
      route: "/dashboard/services/contract",
    },
    { 
      title: "Fund Wallet", 
      icon: Wallet,
      route: "/dashboard/fund-account",
    },
    { 
      title: "Transfer", 
      icon: Users,
      route: "/dashboard/fund-account/transfer-page",
    },
    { 
      title: "Bookkeeping", 
      icon: BookOpen,
      route: "/dashboard/services/bookkeeping",
    },
    { 
      title: "Tax Manager", 
      icon: Target,
      route: "/dashboard/services/tax-filing",
    },
    { 
      title: "Transactions", 
      icon: BarChart3,
      route: "/dashboard/transactions",
    },
    { 
      title: "Settings", 
      icon: Settings,
      route: "/dashboard/profile",
    },
  ];

  // Handle tool click navigation
  const handleToolClick = (route: string) => {
    router.push(route);
  };

  // Use real transactions for recent list with proper formatting
  const displayTransactions = recentTransactions.slice(0, 5).map((tx) => {
    const amountInfo = formatAmount(tx);
    return {
      name: getDescription(tx),
      date: formatDate(tx.created_at),
      amount: amountInfo.signedDisplay,
      amountDisplay: amountInfo.display,
      isOutflow: amountInfo.isOutflow,
      color: amountInfo.color,
      status: getStatusConfig(tx.status).label,
      incoming: !isOutflow(tx.type) && (tx.status === "success" || tx.status === "completed"),
      rawAmount: amountInfo.rawAmount,
      transaction: tx,
    };
  });

  // Fallback transactions when no real data
  const fallbackTransactions = [
    {
      name: "No transactions yet",
      date: "Start using Zidwell",
      amount: "₦0.00",
      amountDisplay: "₦0.00",
      isOutflow: false,
      color: "text-(--text-secondary)",
      status: "",
      incoming: false,
      rawAmount: 0,
    },
  ];

  const finalTransactions =
    displayTransactions.length > 0 ? displayTransactions : fallbackTransactions;

  // Check if we have real data
  const hasRealData = allTransactions.length > 0;

  // Show loading skeleton while fetching
  if (loading && !isFromCache) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-10">
      {/* Balance + health */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 shadow-[2px_2px_0px_var(--border-color)] relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-(--color-accent-yellow)/25 blur-3xl" />
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
            Account Balance
          </p>
          <p className="text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-none text-(--text-primary) mt-3">
            {formatCurrency(displayBalance)}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                metrics.netFlow >= 0
                  ? "bg-[#00B64F]/15 text-[#00B64F]"
                  : "bg-(--color-accent-yellow)/15 text-(--color-accent-yellow)"
              }`}
            >
              {metrics.netFlow >= 0 ? "+" : ""}
              {formatCurrency(metrics.netFlow)} net flow
            </span>
            <span className="text-sm text-(--text-secondary)">
              {hasRealData ? `${allTransactions.length} total transactions` : "No transactions yet"}
              {isFromCache && !loading && (
                <span className="ml-2 text-xs text-(--text-secondary)/60">(cached)</span>
              )}
            </span>
          </div>
        </div>

        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center justify-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
            Financial Health
          </p>
          <div className="relative grid place-items-center">
            <svg width="140" height="140" className="-rotate-90">
              <circle
                cx="70"
                cy="70"
                r="52"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="12"
              />
              <circle
                cx="70"
                cy="70"
                r="52"
                fill="none"
                stroke="#00B64F"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - healthScore / 100)}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-bold text-(--text-primary)">
                {healthScore}
              </p>
              <p className="text-xs uppercase tracking-widest text-(--text-secondary)">
                Strong
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics - Real Data */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {displayMetrics.map((m) => (
          <div
            key={m.label}
            className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-6 shadow-[2px_2px_0px_var(--border-color)] transition-all duration-300 hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px"
          >
            <p className="text-sm font-medium text-(--text-secondary)">
              {m.label}
            </p>
            <p className="text-3xl font-bold text-(--text-primary) mt-3">
              {m.value}
            </p>
            <p
              className={`mt-3 text-sm font-semibold ${
                m.positive ? "text-[#00B64F]" : "text-(--color-accent-yellow)"
              }`}
            >
              {m.delta}
            </p>
          </div>
        ))}
      </section>

      {/* Actions */}
      <section>
        <h2 className="mb-8 text-2xl font-extrabold text-(--text-primary)">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-8 sm:gap-12">
          <CircleAction label="Send Money" icon={Send} variant="gold" />
          <CircleAction label="Add Money" icon={Plus} variant="green" />
          <CircleAction label="Bookkeeping" icon={BookOpen} />
          <CircleAction label="More Tools" icon={LayoutGrid} />
        </div>
      </section>

      {/* Tools + transactions */}
      <section className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
        <div>
          <h2 className="mb-6 text-2xl font-extrabold text-(--text-primary)">
            More tools
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {tools.map((t) => (
              <button
                key={t.title}
                onClick={() => handleToolClick(t.route)}
                className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px group"
              >
                <t.icon
                  className="h-6 w-6 text-(--color-accent-yellow) group-hover:scale-110 transition-transform"
                  strokeWidth={1.4}
                />
                <span className="text-xs font-semibold text-(--text-primary) sm:text-sm">
                  {t.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-extrabold text-(--text-primary)">
            Recent transactions
          </h2>
          <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md shadow-[2px_2px_0px_var(--border-color)] divide-y divide-(--border-color) overflow-hidden">
            {loading && isFromCache ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-(--color-accent-yellow)" />
                  <p className="text-sm text-(--text-secondary)">
                    Refreshing data...
                  </p>
                </div>
              </div>
            ) : !hasRealData ? (
              <div className="text-center py-12 text-(--text-secondary)">
                <p className="mb-2">No transactions yet</p>
                <p className="text-sm">Start using Zidwell to see your transactions here</p>
              </div>
            ) : (
              finalTransactions.map((t, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-(--bg-secondary)"
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                      t.incoming
                        ? "bg-[#00B64F]/15 text-[#00B64F]"
                        : "bg-(--color-accent-yellow)/15 text-(--color-accent-yellow)"
                    }`}
                  >
                    {t.incoming ? (
                      <ArrowDownLeft className="h-5 w-5" strokeWidth={1.5} />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-(--text-primary)">
                      {t.name}
                    </p>
                    <p className="text-sm text-(--text-secondary)">{t.date}</p>
                    {t.transaction?.reference && (
                      <p className="text-xs text-(--text-secondary) mt-0.5">
                        Ref: {t.transaction.reference.substring(0, 12)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${t.color}`}>
                      {t.amount}
                    </p>
                    {t.status && (
                      <p
                        className={`text-xs font-medium ${
                          t.status === "Pending"
                            ? "text-(--color-accent-yellow)"
                            : t.status === "Completed"
                            ? "text-[#00B64F]"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        {t.status}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TodaysMoney;