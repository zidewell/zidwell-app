"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  UserPlus,
  UserCog,
  Shield,
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

// Filter options
const FILTER_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "180D", value: 180 },
  { label: "365D", value: 365 },
  { label: "All", value: 0 },
];

// Team items
const teamItems = [
  { title: "Members", icon: Users, route: "/dashboard/team" },
  { title: "Invitations", icon: UserPlus, route: "/dashboard/team/invitations" },
  { title: "Roles", icon: UserCog, route: "/dashboard/team/roles" },
  { title: "Permissions", icon: Shield, route: "/dashboard/team/permissions" },
];

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {[1, 2].map((i) => (
        <div key={i} className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] h-[110px]">
          <div className="h-3 w-24 bg-(--bg-secondary) rounded mb-2"></div>
          <div className="h-8 w-40 bg-(--bg-secondary) rounded"></div>
          <div className="h-3 w-32 bg-(--bg-secondary) rounded mt-2"></div>
        </div>
      ))}
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)]">
          <div className="h-3 w-20 bg-(--bg-secondary) rounded mb-2"></div>
          <div className="h-7 w-28 bg-(--bg-secondary) rounded"></div>
          <div className="h-3 w-24 bg-(--bg-secondary) rounded mt-2"></div>
        </div>
      ))}
    </section>
  </div>
);

const TodaysMoney = () => {
  const router = useRouter();
  const { userData, balance } = useUserContextData();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(30);
  const [metrics, setMetrics] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    totalTransactions: 0,
    netFlow: 0,
  });
  const [totalTransactionCount, setTotalTransactionCount] = useState(0);
  const [allTimeMetrics, setAllTimeMetrics] = useState({
    totalInflow: 0,
    totalOutflow: 0,
    netFlow: 0,
  });
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  // Calculate metrics from transactions with date filtering
  const calculateMetricsWithFilter = useCallback((transactions: any[], filterDays: number) => {
    const now = new Date();
    const cutoffDate = filterDays > 0 ? new Date(now.setDate(now.getDate() - filterDays)) : new Date(0);
    
    const filteredTransactions = filterDays === 0 
      ? transactions 
      : transactions.filter((tx: any) => {
          const txDate = new Date(tx.created_at);
          return txDate >= cutoffDate;
        });

    const successfulTransactions = filteredTransactions.filter(
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

  // Calculate all-time metrics
  const calculateAllTimeMetrics = useCallback((transactions: any[]) => {
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
      netFlow: totalInflow - totalOutflow,
    };
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!userData?.id) return;
    if (fetchInProgress.current) return;

    fetchInProgress.current = true;
    setLoading(true);

    try {
      let allTxns: any[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100;

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

      const allTime = calculateAllTimeMetrics(allTxns);
      setAllTimeMetrics(allTime);

      const filteredMetrics = calculateMetricsWithFilter(allTxns, selectedFilter);
      setMetrics(filteredMetrics);
      setTotalTransactionCount(allTxns.length);

      const recent = allTxns.slice(0, 5);
      setRecentTransactions(recent);

      initialFetchDone.current = true;

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [userData, selectedFilter, calculateMetricsWithFilter, calculateAllTimeMetrics]);

  useEffect(() => {
    if (userData?.id) {
      fetchTransactions();
    }
  }, [userData, selectedFilter, fetchTransactions]);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  const getDescription = (transaction: any) => {
    return (
      transaction.narration ||
      transaction.description ||
      transaction.external_response?.data?.transaction?.narration ||
      transaction.external_response?.withdrawal_details?.narration ||
      "Transaction"
    );
  };

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

  const displayBalance = balance ?? 0;

  const getFilterLabel = () => {
    const option = FILTER_OPTIONS.find(opt => opt.value === selectedFilter);
    return option ? option.label : "30D";
  };

  const handleFilterChange = (days: number) => {
    setSelectedFilter(days);
  };

  // Tools data
  const tools = [
    { title: "Receipts", icon: Receipt, route: "/dashboard/services/receipt" },
    { title: "Invoices", icon: FileText, route: "/dashboard/services/create-invoice" },
    { title: "Contracts", icon: FileSignature, route: "/dashboard/services/contract" },
    { title: "Fund Wallet", icon: Wallet, route: "/dashboard/fund-account" },
    { title: "Transfer", icon: Users, route: "/dashboard/fund-account/transfer-page" },
    { title: "Bookkeeping", icon: BookOpen, route: "/dashboard/services/bookkeeping" },
    { title: "Tax Manager", icon: Target, route: "/dashboard/services/tax-filing" },
    { title: "Transactions", icon: BarChart3, route: "/dashboard/transactions" },
    { title: "Settings", icon: Settings, route: "/dashboard/profile" },
  ];

  const handleToolClick = (route: string) => {
    router.push(route);
  };

  const handleTeamClick = (route: string) => {
    router.push(route);
  };

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

  const hasRealData = recentTransactions.length > 0;

  if (loading) {
    return <LoadingSkeleton />;
  }

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
      value: totalTransactionCount.toString(),
      delta: `${metrics.totalTransactions} in period`,
      positive: true,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Balance Cards - Only 2 cards */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Current Balance Card */}
        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] relative overflow-hidden h-[110px] flex flex-col justify-center">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-(--color-accent-yellow)/20 blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs font-medium text-(--text-secondary) flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Current Balance
            </p>
            <p className="text-2xl font-bold text-(--text-primary) mt-1">
              {formatCurrency(displayBalance)}
            </p>
            <p className="text-[10px] text-(--text-secondary) mt-0.5">Available balance</p>
          </div>
        </div>

        {/* All-Time Balance Card */}
        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] relative overflow-hidden h-[110px] flex flex-col justify-center">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#00B64F]/20 blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs font-medium text-(--text-secondary) flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#00B64F]" />
              All-Time Balance
            </p>
            <p className="text-2xl font-bold text-(--text-primary) mt-1">
              {formatCurrency(allTimeMetrics.totalInflow)}
            </p>
            <p className="text-[10px] text-(--text-secondary) mt-0.5">
              Total money in since start
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Row - Below balance cards */}
      <section>
        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)]">
          <p className="text-xs font-medium text-(--text-secondary) mb-3 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            Quick Actions
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/dashboard/fund-account/transfer-page">
              <CircleAction label="Send Money" icon={Send} variant="gold" />
            </Link>
            <Link href="/dashboard/fund-account">
              <CircleAction label="Add Money" icon={Plus} variant="green" />
            </Link>
            <Link href="/dashboard/services/bookkeeping">
              <CircleAction label="Bookkeeping" icon={BookOpen} />
            </Link>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="flex flex-wrap items-center gap-1.5 bg-(--bg-secondary) rounded-lg p-1.5 border border-(--border-color)">
        <span className="text-[10px] font-medium text-(--text-secondary) px-1.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Period:
        </span>
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange(option.value)}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${
              selectedFilter === option.value
                ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-[2px_2px_0px_var(--border-color)]"
                : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-primary)"
            }`}
          >
            {option.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-(--text-secondary) px-1.5">
          Showing: {getFilterLabel()} period
        </span>
      </section>

      {/* Metrics - Compact */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {displayMetrics.map((m) => (
          <div
            key={m.label}
            className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] transition-all duration-300 hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px"
          >
            <p className="text-xs font-medium text-(--text-secondary)">
              {m.label}
            </p>
            <p className="text-2xl font-bold text-(--text-primary) mt-1.5">
              {m.value}
            </p>
            <p
              className={`mt-1.5 text-xs font-semibold ${
                m.positive ? "text-[#00B64F]" : "text-(--color-accent-yellow)"
              }`}
            >
              {m.delta}
            </p>
          </div>
        ))}
      </section>

      {/* Team Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-(--text-primary)">
            Team
          </h2>
          <Link
            href="/dashboard/team"
            className="flex items-center gap-0.5 text-xs font-medium text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 transition-colors group"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {teamItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleTeamClick(item.route)}
              className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center gap-2 transition-all duration-300 hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px group"
            >
              <item.icon
                className="h-6 w-6 text-(--color-accent-yellow) group-hover:scale-110 transition-transform"
                strokeWidth={1.4}
              />
              <span className="text-xs font-semibold text-(--text-primary) text-center">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-(--text-primary)">
          More tools
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
          {tools.map((t) => (
            <button
              key={t.title}
              onClick={() => handleToolClick(t.route)}
              className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-3 shadow-[2px_2px_0px_var(--border-color)] flex flex-col items-center gap-2 transition-all duration-300 hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-px hover:-translate-y-px group"
            >
              <t.icon
                className="h-5 w-5 text-(--color-accent-yellow) group-hover:scale-110 transition-transform"
                strokeWidth={1.4}
              />
              <span className="text-[10px] font-semibold text-(--text-primary) text-center leading-tight">
                {t.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-(--text-primary)">
            Recent transactions
          </h2>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-0.5 text-xs font-medium text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 transition-colors group"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md shadow-[2px_2px_0px_var(--border-color)] divide-y divide-(--border-color) overflow-hidden">
          {!hasRealData ? (
            <div className="text-center py-8 text-(--text-secondary)">
              <p className="mb-1 text-sm">No transactions yet</p>
              <p className="text-xs">Start using Zidwell to see your transactions here</p>
            </div>
          ) : (
            finalTransactions.map((t, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--bg-secondary)"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    t.incoming
                      ? "bg-[#00B64F]/15 text-[#00B64F]"
                      : "bg-(--color-accent-yellow)/15 text-(--color-accent-yellow)"
                  }`}
                >
                  {t.incoming ? (
                    <ArrowDownLeft className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-(--text-primary)">
                    {t.name}
                  </p>
                  <p className="text-xs text-(--text-secondary)">{t.date}</p>
                  {t.transaction?.reference && (
                    <p className="text-[10px] text-(--text-secondary) mt-0.5">
                      Ref: {t.transaction.reference.substring(0, 12)}...
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${t.color}`}>
                    {t.amount}
                  </p>
                  {t.status && (
                    <p
                      className={`text-[10px] font-medium ${
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
      </section>
    </div>
  );
};

export default TodaysMoney;