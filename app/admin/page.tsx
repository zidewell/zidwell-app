"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import AdminLayout from "../components/admin-components/layout";
import KPICard from "../components/admin-components/KPICard";
import { Skeleton } from "../components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  Users,
  FileText,
  BarChart3,
  RefreshCw,
  Eye,
  UserPlus,
  Activity,
  FileSignature,
  FileCheck,
  FileClock,
  Percent,
  File,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(text || `Request failed: ${r.status}`);
    }
    return r.json();
  });

type RangeOption =
  | "total"
  | "today"
  | "week"
  | "month"
  | "90days"
  | "180days"
  | "year";

const CHART_COLORS = {
  inflow: "#10b981",
  outflow: "#ef4444",
  contracts: "#3b82f6",
  invoices: "#8b5cf6",
  revenue: "#f59e0b",
  contract_revenue: "#8b5cf6",
  invoice_revenue: "#8b5cf6",
  pie: ["#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#f59e0b", "#84cc16"],
  website: "#3b82f6",
  signups: "#10b981",
  active_users: "#8b5cf6",
  transaction_volume: "#f59e0b",
  revenue_breakdown: {
    transfers: "#3b82f6",
    bill_payment: "#10b981",
    invoice: "#8b5cf6",
    contract: "#8b5cf6",
    platform: "#84cc16",
  },
};

interface GrowthIndicatorProps {
  value: number;
  className?: string;
}

const GrowthIndicator = ({ value, className = "" }: GrowthIndicatorProps) => {
  if (value === 0) {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        <Minus size={14} />
        <span className="ml-1 text-xs">0%</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <div className={`flex items-center ${colorClass} ${className}`}>
      <Icon size={14} />
      <span className="ml-1 text-xs font-medium">
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  );
};

interface MetricsData {
  website: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  signups: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  active_users: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  transaction_volume: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  revenue_breakdown: {
    total: {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    today: {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    week: {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    month: {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    "90days": {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    "180days": {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    year: {
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    };
    daily: Array<{
      date: string;
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    }>;
    weekly: Array<{
      week: string;
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    }>;
    monthly: Array<{
      month: string;
      total: number;
      transfers: number;
      bill_payment: number;
      invoice: number;
      contract: number;
      platform: number;
    }>;
  };
}

const getSafeData = <T,>(
  data: T | undefined,
  path: string,
  defaultValue: any = []
): any => {
  if (!data) return defaultValue;

  try {
    const keys = path.split(".");
    let current: any = data;

    for (const key of keys) {
      if (current[key] === undefined || current[key] === null) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  } catch {
    return defaultValue;
  }
};

export default function AdminDashboard() {
  const [page, setPage] = useState<number>(1);
  const PAGE_LIMIT = 50;
  const [range, setRange] = useState<RangeOption>("total");
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    setIsClient(true);
    const savedRange = localStorage.getItem(
      "admin_dashboard_range"
    ) as RangeOption;
    if (savedRange) {
      setRange(savedRange);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("admin_dashboard_range", range);
    }
    setPage(1);
  }, [range, isClient]);

  const {
    data: summaryData,
    error: summaryError,
    isLoading: summaryLoading,
  } = useSWR<any>(`/api/admin-apis/dashboard/summary?range=${range}`, fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: true,
  });

  const {
    data: metricsData,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR<MetricsData>(
    `/api/admin-apis/dashboard/metrics?range=${range}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    }
  );

  const {
    data: paginatedData,
    error: paginatedError,
    isLoading: transactionsLoading,
  } = useSWR<any>(
    `/api/admin-apis/transactions?page=${page}&range=${range}`,
    fetcher
  );

  useEffect(() => {
    if (paginatedError)
      console.error("Paginated transactions error:", paginatedError);
    if (summaryError) console.error("Summary error:", summaryError);
    if (metricsError) console.error("Metrics error:", metricsError);
  }, [paginatedError, summaryError, metricsError]);

  const totalInflow = Number(summaryData?.totalInflow ?? 0);
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0);
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0);
  const nombaBalanceRaw = Number(summaryData?.nombaBalance ?? 0);
  const totalAppRevenue = Number(summaryData?.totalAppRevenue ?? 0);
  const transactionFees = Number(summaryData?.transactionFees ?? 0);
  const platformFees = Number(summaryData?.platformFees ?? 0);
  const contractFees = Number(summaryData?.contractFees ?? 0);
  const totalContractAmount = Number(summaryData?.totalContractAmount ?? 0);
  const contractPaymentsCount = Number(summaryData?.contractPaymentsCount ?? 0);
  const totalContracts = Number(summaryData?.totalContractsIssued ?? 0);
  const pendingContracts = Number(summaryData?.pendingContracts ?? 0);
  const signedContracts = Number(summaryData?.signedContracts ?? 0);
  const totalInvoices = Number(summaryData?.totalInvoicesIssued ?? 0);
  const paidInvoices = Number(summaryData?.paidInvoices ?? 0);
  const unpaidInvoices = Number(summaryData?.pendingInvoices ?? 0);
  const totalInvoiceRevenue = Number(summaryData?.totalInvoiceRevenue ?? 0);
  const totalTransactions = Number(summaryData?.totalTransactions ?? 0);
  const successfulTransactions = Number(
    summaryData?.successfulTransactions ?? 0
  );
  const failedTransactions = Number(summaryData?.failedTransactions ?? 0);
  const pendingTransactions = Number(summaryData?.pendingTransactions ?? 0);
  const totalUsers = Number(summaryData?.totalUsers ?? 0);

  // Contract-specific calculations
  const contractSignRate =
    totalContracts > 0
      ? ((signedContracts / totalContracts) * 100).toFixed(1)
      : "0";

  const avgContractFee =
    contractPaymentsCount > 0
      ? (contractFees / contractPaymentsCount).toFixed(2)
      : "0";

  const contractRevenueShare =
    totalAppRevenue > 0
      ? ((contractFees / totalAppRevenue) * 100).toFixed(1)
      : "0";

  // Platform revenue share calculation
  const platformRevenueShare =
    totalAppRevenue > 0
      ? ((platformFees / totalAppRevenue) * 100).toFixed(1)
      : "0";

  const avgContractValue =
    signedContracts > 0
      ? (totalContractAmount / signedContracts).toFixed(2)
      : "0";

  // Invoice-specific calculations
  const invoicePaymentRate =
    totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : "0";

  const getMetricValue = (
    metric: keyof MetricsData,
    period: RangeOption
  ): number => {
    if (!metricsData) return 0;

    if (metric === "revenue_breakdown") {
      return metricsData[metric]?.[period]?.total || 0;
    }

    return metricsData[metric]?.[period] || 0;
  };

  const prevTotalInflow = Number(summaryData?.prevTotalInflow ?? 0);
  const prevTotalOutflow = Number(summaryData?.prevTotalOutflow ?? 0);
  const prevTotalAppRevenue = Number(summaryData?.prevTotalAppRevenue ?? 0);
  const prevTotalContracts = Number(summaryData?.prevTotalContracts ?? 0);
  const prevPendingContracts = Number(summaryData?.prevPendingContracts ?? 0);
  const prevSignedContracts = Number(summaryData?.prevSignedContracts ?? 0);
  const prevTotalInvoices = Number(summaryData?.prevTotalInvoices ?? 0);
  const prevPaidInvoices = Number(summaryData?.prevPaidInvoices ?? 0);
  const prevUnpaidInvoices = Number(summaryData?.prevUnpaidInvoices ?? 0);
  const prevContractFees = Number(summaryData?.prevContractFees ?? 0);

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const inflowGrowth = calculateGrowth(totalInflow, prevTotalInflow);
  const outflowGrowth = calculateGrowth(totalOutflow, prevTotalOutflow);
  const appRevenueGrowth = calculateGrowth(
    totalAppRevenue,
    prevTotalAppRevenue
  );
  const contractRevenueGrowth = calculateGrowth(contractFees, prevContractFees);
  const platformFeesGrowth = calculateGrowth(platformFees, 0);
  const contractsGrowth = calculateGrowth(totalContracts, prevTotalContracts);
  const pendingContractsGrowth = calculateGrowth(
    pendingContracts,
    prevPendingContracts
  );
  const signedContractsGrowth = calculateGrowth(
    signedContracts,
    prevSignedContracts
  );
  const invoicesGrowth = calculateGrowth(totalInvoices, prevTotalInvoices);
  const paidInvoicesGrowth = calculateGrowth(paidInvoices, prevPaidInvoices);
  const unpaidInvoicesGrowth = calculateGrowth(
    unpaidInvoices,
    prevUnpaidInvoices
  );

  const monthlyTransactions = summaryData?.monthlyTransactions ?? [];
  const monthlyInvoices = summaryData?.monthlyInvoices ?? [];
  const monthlyContracts = summaryData?.monthlyContracts ?? [];
  const monthlyAppRevenue = summaryData?.monthlyAppRevenue ?? [];

  const contractsPieData = [
    { name: "Signed", value: signedContracts, color: CHART_COLORS.pie[0] },
    { name: "Pending", value: pendingContracts, color: CHART_COLORS.pie[2] },
  ].filter((item) => item.value > 0);

  const invoicesPieData = [
    { name: "Paid", value: paidInvoices, color: CHART_COLORS.pie[0] },
    { name: "Unpaid", value: unpaidInvoices, color: CHART_COLORS.pie[1] },
  ].filter((item) => item.value > 0);

  const cashflowPieData = [
    { name: "Inflow", value: totalInflow, color: CHART_COLORS.pie[0] },
    { name: "Outflow", value: totalOutflow, color: CHART_COLORS.pie[1] },
  ].filter((item) => item.value > 0);

  const revenueBreakdownData = [
    {
      name: "Transaction Fees",
      value: transactionFees,
      color: CHART_COLORS.revenue_breakdown.transfers,
    },
    {
      name: "Platform Fees (2%)",
      value: platformFees,
      color: CHART_COLORS.revenue_breakdown.platform,
    },
    {
      name: "Contract Fees",
      value: contractFees,
      color: CHART_COLORS.revenue_breakdown.contract,
    },
  ].filter((item) => item.value > 0);

  const getRevenueBreakdownPieData = () => {
    if (!metricsData?.revenue_breakdown) return [];

    const currentRevenue = metricsData.revenue_breakdown[range];
    if (!currentRevenue) return [];

    return [
      {
        name: "Transfers",
        value: currentRevenue.transfers,
        color: CHART_COLORS.revenue_breakdown.transfers,
      },
      {
        name: "Bill Payment",
        value: currentRevenue.bill_payment,
        color: CHART_COLORS.revenue_breakdown.bill_payment,
      },
      {
        name: "Invoice",
        value: currentRevenue.invoice,
        color: CHART_COLORS.revenue_breakdown.invoice,
      },
      {
        name: "Contract",
        value: currentRevenue.contract || 0,
        color: CHART_COLORS.revenue_breakdown.contract,
      },
      {
        name: "Platform",
        value: currentRevenue.platform || 0,
        color: CHART_COLORS.revenue_breakdown.platform,
      },
    ].filter((item) => item.value > 0);
  };

  const recentActivity =
    summaryData?.latestTransactions?.slice(0, 5) ??
    paginatedData?.transactions?.slice(0, 5) ??
    [];
  const hasNextPage = paginatedData?.transactions?.length === PAGE_LIMIT;
  const hasPrevPage = page > 1;

  const goNext = () => {
    if (!hasNextPage) return;
    setPage((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (!hasPrevPage) return;
    setPage((p) => Math.max(1, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = async () => {
    await mutate(
      `/api/admin-apis/dashboard/summary?range=${range}&nocache=true`
    );
    await mutate(`/api/admin-apis/dashboard/metrics?range=${range}`);
    await mutate(`/api/admin-apis/transactions?page=${page}&range=${range}`);
  };

  const isLoading = summaryLoading || metricsLoading || transactionsLoading;
  const hasData = summaryData && metricsData && paginatedData;

  const formatCurrency = (value: number | string) => {
    const n = Number(value || 0);
    if (n === 0) return "₦0";
    return n.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDateSafely = (dateString: string) => {
    if (!isClient) return dateString;
    try {
      return new Date(dateString).toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrencyShort = (value: number) => {
    const numValue = Number(value);
    if (numValue === 0) return "₦0";

    if (numValue >= 1000000000) {
      return `₦${(numValue / 1000000000).toFixed(1)}B`;
    }
    if (numValue >= 1000000) {
      return `₦${(numValue / 1000000).toFixed(1)}M`;
    }
    if (numValue >= 1000) {
      return `₦${(numValue / 1000).toFixed(1)}K`;
    }
    return `₦${Math.round(numValue)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-NG").format(value);
  };

  const websiteMonthlyData = getSafeData(metricsData, "website.monthly", []);
  const signupsMonthlyData = getSafeData(metricsData, "signups.monthly", []);
  const activeUsersMonthlyData = getSafeData(
    metricsData,
    "active_users.monthly",
    []
  );
  const transactionVolumeMonthlyData = getSafeData(
    metricsData,
    "transaction_volume.monthly",
    []
  );
  const revenueBreakdownMonthlyData = getSafeData(
    metricsData,
    "revenue_breakdown.monthly",
    []
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 space-y-8">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <Skeleton className="h-6 w-56 mb-4" />
            <div className="space-y-3">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!hasData) {
    return (
      <AdminLayout>
        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">
              Failed to load dashboard data. Please try refreshing the page.
            </p>
            <button
              onClick={refresh}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const revenueBreakdownPieData = getRevenueBreakdownPieData();
  const allTimeRanges: RangeOption[] = [
    "total",
    "today",
    "week",
    "month",
    "90days",
    "180days",
    "year",
  ];
  const specificTimeRanges: Exclude<RangeOption, "total">[] = [
    "today",
    "week",
    "month",
    "90days",
    "180days",
    "year",
  ];

  const getDisplayValueForPeriod = (
    metric: keyof MetricsData,
    period: RangeOption
  ): string => {
    if (metric === "transaction_volume") {
      return formatCurrency(getMetricValue(metric, period));
    }
    return formatNumber(getMetricValue(metric, period));
  };

  const calculateContractRevenueGrowth = (): number => {
    const currentRevenue =
      metricsData?.revenue_breakdown?.[range]?.contract || 0;
    const prevRevenue = prevContractFees;

    if (prevRevenue === 0 && currentRevenue > 0) return 100;

    if (prevRevenue === 0 && currentRevenue === 0) return 0;

    return ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  };

  return (
    <AdminLayout>
      <div className="px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h2>
            <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
              <BarChart3 size={14} />
              <span>Range: {range === "total" ? "All time" : range}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <label className="text-xs text-gray-500 mb-1">Filter Range</label>
              <Select
                value={range}
                onValueChange={(val: RangeOption) => setRange(val)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="180days">Last 180 Days</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh Data
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Top Row: Website, Signups, Active Users, Transaction Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Website Visits"
                value={formatNumber(getMetricValue("website", range))}
                icon={<Eye className="w-5 h-5 text-blue-600" />}
                className="border-l-4 border-l-blue-500"
                subtitle={`Total visits (${
                  range === "total" ? "all time" : range
                })`}
              />
              <KPICard
                title="New Signups"
                value={formatNumber(getMetricValue("signups", range))}
                icon={<UserPlus className="w-5 h-5 text-green-600" />}
                className="border-l-4 border-l-green-500"
                subtitle={`New users (${
                  range === "total" ? "all time" : range
                })`}
              />
              <KPICard
                title="Active Users"
                value={formatNumber(getMetricValue("active_users", range))}
                icon={<Activity className="w-5 h-5 text-purple-600" />}
                className="border-l-4 border-l-purple-500"
                subtitle={`Active users (${
                  range === "total" ? "all time" : range
                })`}
              />
              <KPICard
                title="Transaction Volume"
                value={formatCurrency(
                  getMetricValue("transaction_volume", range)
                )}
                icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                className="border-l-4 border-l-amber-500"
                subtitle={`Cash processed (${
                  range === "total" ? "all time" : range
                })`}
              />
            </div>

            {/* Second Row: Financial Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Inflow"
                value={formatCurrency(totalInflow)}
                growth={<GrowthIndicator value={inflowGrowth} />}
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                className="border-l-4 border-l-green-500"
                subtitle="Money coming into the platform"
              />
              <KPICard
                title="Total Outflow"
                value={formatCurrency(totalOutflow)}
                growth={<GrowthIndicator value={outflowGrowth} />}
                className="border-l-4 border-l-red-500"
                subtitle="Money leaving the platform"
              />
              <KPICard
                title="Main Wallet Balance"
                value={formatCurrency(mainWalletBalance)}
                icon={<Wallet className="w-5 h-5 text-blue-600" />}
                className="border-l-4 border-l-blue-500"
                subtitle="Total user wallet balances"
              />
              <KPICard
                title="Admin Wallet (Nomba)"
                value={formatCurrency(nombaBalanceRaw)}
                icon={<CreditCard className="w-5 h-5 text-purple-600" />}
                className="border-l-4 border-l-purple-500"
                subtitle="Nomba account balance"
              />
            </div>

            {/* Third Row: Platform Revenue Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total App Revenue"
                value={formatCurrency(nombaBalanceRaw - mainWalletBalance)}
                growth={<GrowthIndicator value={appRevenueGrowth} />}
                icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                className="border-l-4 border-l-amber-500 bg-linear-to-r from-amber-50 to-white"
                subtitle="Net platform earnings"
              />
              <KPICard
                title="Contract Revenue"
                value={formatCurrency(
                  metricsData?.revenue_breakdown?.[range]?.contract || 0
                )}
                growth={
                  <GrowthIndicator value={calculateContractRevenueGrowth()} />
                }
                icon={<FileSignature className="w-5 h-5 text-indigo-600" />}
                className="border-l-4 border-l-indigo-500 bg-linear-to-r from-indigo-50 to-white"
                subtitle={`Revenue from contracts (${
                  range === "total" ? "all time" : range
                })`}
              />
              <KPICard
                title="Invoice Revenue"
                value={formatCurrency(
                  metricsData?.revenue_breakdown?.[range]?.invoice || 0
                )}
                icon={<File className="w-5 h-5 text-purple-600" />}
                className="border-l-4 border-l-purple-500 bg-linear-to-r from-purple-50 to-white"
                subtitle={`Revenue from invoices (${
                  range === "total" ? "all time" : range
                })`}
              />
              <KPICard
                title="Total Users"
                value={totalUsers.toLocaleString()}
                icon={<Users className="w-5 h-5 text-green-600" />}
                className="border-l-4 border-l-green-500"
                subtitle="Registered users"
              />
            </div>

            {/* Fourth Row: Contract & Invoice Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Contracts"
                value={formatNumber(totalContracts)}
                growth={<GrowthIndicator value={contractsGrowth} />}
                icon={<FileSignature className="w-5 h-5 text-blue-600" />}
                className="border-l-4 border-l-blue-500"
                subtitle="Contracts issued"
              />
              <KPICard
                title="Contract Sign Rate"
                value={`${contractSignRate}%`}
                icon={<Percent className="w-5 h-5 text-purple-600" />}
                className="border-l-4 border-l-purple-500"
                subtitle="Success rate"
              />
              <KPICard
                title="Total Invoices"
                value={formatNumber(totalInvoices)}
                growth={<GrowthIndicator value={invoicesGrowth} />}
                icon={<File className="w-5 h-5 text-indigo-600" />}
                className="border-l-4 border-l-indigo-500"
                subtitle="Invoices issued"
              />
              <KPICard
                title="Invoice Payment Rate"
                value={`${invoicePaymentRate}%`}
                icon={<Percent className="w-5 h-5 text-green-600" />}
                className="border-l-4 border-l-green-500"
                subtitle="Paid invoices"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Revenue Trend by Source
                  </h3>
                  <div className="text-sm text-gray-500">
                    Filtered: {range === "total" ? "All time" : range}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueBreakdownMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Revenue",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={CHART_COLORS.revenue}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                      name="Total Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="contract"
                      stroke={CHART_COLORS.contract_revenue}
                      strokeWidth={2}
                      name="Contract Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="invoice"
                      stroke={CHART_COLORS.invoice_revenue}
                      strokeWidth={2}
                      name="Invoice Revenue"
                    />
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.revenue}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.revenue}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contract Status
                  </h3>
                  <div className="text-sm text-gray-500">Distribution</div>
                </div>
                <div className="h-64">
                  {contractsPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contractsPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {contractsPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            formatNumber(value),
                            "Contracts",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No contract data
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-indigo-700 mb-1">
                      Contract Revenue
                    </div>
                    <div className="text-lg font-bold text-indigo-900">
                      {formatCurrency(contractFees)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-700 mb-1">
                      Revenue Share
                    </div>
                    <div className="text-lg font-bold text-green-900">
                      {contractRevenueShare}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-8">
            {/* Traffic tab content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Website Traffic Analytics
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
                {allTimeRanges.map((period) => (
                  <div key={period} className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-700 mb-1 capitalize">
                      {period === "total"
                        ? "All Time"
                        : period.replace("days", " Days")}
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {formatNumber(getMetricValue("website", period))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={websiteMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        "Visits",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      fill="#93c5fd"
                      stroke="#3b82f6"
                      name="Website Visits"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            {/* Users tab content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  User Signups
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {allTimeRanges.slice(0, 4).map((period) => (
                    <div key={period} className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-lg font-bold text-green-900">
                        {formatNumber(getMetricValue("signups", period))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {allTimeRanges.slice(4).map((period) => (
                    <div key={period} className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-lg font-bold text-green-900">
                        {formatNumber(getMetricValue("signups", period))}
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={signupsMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        "Signups",
                      ]}
                    />
                    <Bar dataKey="count" fill="#10b981" name="Signups" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Active Users
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {allTimeRanges.slice(0, 4).map((period) => (
                    <div key={period} className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-purple-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {formatNumber(getMetricValue("active_users", period))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {allTimeRanges.slice(4).map((period) => (
                    <div key={period} className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-purple-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {formatNumber(getMetricValue("active_users", period))}
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activeUsersMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        "Active Users",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-8">
            {/* Transactions tab content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Transaction Volume
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
                {allTimeRanges.map((period) => {
                  const periodValue = getMetricValue(
                    "transaction_volume",
                    period
                  );
                  return (
                    <div key={period} className="bg-amber-50 p-4 rounded-lg">
                      <div className="text-sm text-amber-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-xl font-bold text-amber-900">
                        {formatCurrencyShort(periodValue)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-[400px]">
                {transactionVolumeMonthlyData &&
                transactionVolumeMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={transactionVolumeMonthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                      />
                      <YAxis
                        tickFormatter={(value: number) => {
                          const numValue = Number(value);
                          if (numValue >= 1000000) {
                            return `₦${(numValue / 1000000).toFixed(1)}M`;
                          } else if (numValue >= 1000) {
                            return `₦${(numValue / 1000).toFixed(1)}K`;
                          }
                          return `₦${numValue}`;
                        }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: any) => {
                          const numValue = Number(value);
                          return [formatCurrency(numValue), "Volume"];
                        }}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        name="Transaction Volume"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <BarChart3 size={48} className="mb-4" />
                    <p>
                      No transaction volume data available for the selected
                      range
                    </p>
                    <p className="text-sm mt-2">
                      Try selecting a different time range
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Transactions
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(totalTransactions)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">
                    Successful Transactions
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatNumber(successfulTransactions)}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {totalTransactions > 0
                      ? `${(
                          (successfulTransactions / totalTransactions) *
                          100
                        ).toFixed(1)}% success rate`
                      : "0% success rate"}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">
                    Average Transaction Value
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {successfulTransactions > 0
                      ? formatCurrency(
                          (totalInflow + totalOutflow) / successfulTransactions
                        )
                      : formatCurrency(0)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-8">
            {/* Contracts tab content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Contract Analytics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-700 mb-1">
                        Total Contracts
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatNumber(totalContracts)}
                      </div>
                    </div>
                    <FileSignature className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Contracts issued ({range === "total" ? "all time" : range})
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-700 mb-1">
                        Signed Contracts
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatNumber(signedContracts)}
                      </div>
                    </div>
                    <FileCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    Successfully signed
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-700 mb-1">
                        Contract Revenue
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatCurrency(contractFees)}
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-2 text-xs text-purple-600">
                    Revenue from contracts
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Contract Revenue Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-indigo-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-indigo-700 mb-1">
                          Total Contract Revenue
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">
                          {formatCurrency(contractFees)}
                        </div>
                      </div>
                      <FileSignature className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="mt-2">
                      <GrowthIndicator value={contractRevenueGrowth} />
                    </div>
                    <div className="mt-2 text-xs text-indigo-600">
                      Revenue from contract fees
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-700 mb-1">
                          Total Contract Value
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(totalContractAmount)}
                        </div>
                      </div>
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="mt-2 text-xs text-green-600">
                      Total value of signed contracts
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 mb-1">
                          Avg. Fee per Contract
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(avgContractFee)}
                        </div>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      Average fee per contract
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[400px] mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyContracts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        "Contracts",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Contracts Issued"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Trend"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Contract Status Distribution
                  </h4>
                  <div className="h-64">
                    {contractsPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={contractsPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) =>
                              `${entry.name}: ${(
                                (entry.percent || 0) * 100
                              ).toFixed(1)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {contractsPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              formatNumber(value),
                              "Contracts",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        No contract data available
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Contract Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">
                        Total Contracts
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatNumber(totalContracts)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-700">
                        Signed Rate
                      </div>
                      <div className="text-lg font-bold text-green-900">
                        {contractSignRate}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700">
                        Contract Revenue
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(contractFees)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-700">
                        Revenue Share
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {contractRevenueShare}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue Analysis by Feature
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getMetricValue("revenue_breakdown", range))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
                {allTimeRanges.map((period) => {
                  const revenue = metricsData?.revenue_breakdown?.[period];
                  return (
                    <div key={period} className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(revenue?.total || 0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Contract: {formatCurrency(revenue?.contract || 0)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Invoice: {formatCurrency(revenue?.invoice || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-[400px] mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueBreakdownMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value: number) => `₦${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const featureNames: Record<string, string> = {
                          total: "Total Revenue",
                          transfers: "Transfers",
                          bill_payment: "Bill Payment",
                          invoice: "Invoice Revenue",
                          contract: "Contract",
                          platform: "Platform (2%)",
                        };
                        return [
                          formatCurrency(value),
                          featureNames[name] || name,
                        ];
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      fill="#dcfce7"
                      stroke="#16a34a"
                      name="Total Revenue"
                    />
                    <Bar dataKey="transfers" fill="#3b82f6" name="Transfers" />
                    <Bar
                      dataKey="bill_payment"
                      fill="#10b981"
                      name="Bill Payment"
                    />
                    <Bar dataKey="invoice" fill="#8b5cf6" name="Invoice Revenue" />
                    <Bar
                      dataKey="contract"
                      fill={CHART_COLORS.contract_revenue}
                      name="Contract"
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {revenueBreakdownPieData.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Revenue Distribution by Feature
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueBreakdownPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) =>
                              `${entry.name}: ${(
                                (entry.percent || 0) * 100
                              ).toFixed(1)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {revenueBreakdownPieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color || "#8884d8"}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) =>
                              formatCurrency(Number(value))
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {revenueBreakdownPieData.map((entry) => {
                        const totalRevenue = getMetricValue(
                          "revenue_breakdown",
                          range
                        );
                        const percentage =
                          totalRevenue > 0
                            ? (entry.value / totalRevenue) * 100
                            : 0;

                        return (
                          <div
                            key={entry.name}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {entry.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(entry.value)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Transactions Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex flex-col sm:flexRow items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">Page: {page}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={!hasPrevPage}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !hasPrevPage
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={goNext}
                  disabled={!hasNextPage}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !hasNextPage
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentActivity.length > 0 ? (
                  recentActivity.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(tx.amount)}
                        </div>
                        {tx.fee > 0 && (
                          <div className="text-xs text-amber-600 mt-1">
                            Fee: {formatCurrency(tx.fee)}
                          </div>
                        )}
                        {(tx.type?.toLowerCase() || "").includes(
                          "contract"
                        ) && (
                          <div className="text-xs text-indigo-600 mt-1">
                            Contract Fee
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tx.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (tx.type?.toLowerCase() || "").includes("fee")
                              ? "bg-amber-100 text-amber-800"
                            : (tx.type?.toLowerCase() || "").includes(
                                "deposit"
                              ) ||
                              (tx.type?.toLowerCase() || "").includes(
                                "received"
                              )
                              ? "bg-green-100 text-green-800"
                            : (tx.type?.toLowerCase() || "").includes(
                                "withdrawal"
                              ) ||
                              (tx.type?.toLowerCase() || "").includes("sent")
                              ? "bg-red-100 text-red-800"
                            : (tx.type?.toLowerCase() || "").includes(
                                "contract"
                              )
                              ? "bg-indigo-100 text-indigo-800"
                            : (tx.type?.toLowerCase() || "").includes("invoice")
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tx.type || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === "success"
                              ? "bg-green-100 text-green-800"
                            : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateSafely(tx.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Performance Summary */}
        <div className="bg-linear-to-r from-gray-50 to-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Performance Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalTransactions > 0
                  ? `${(
                      (successfulTransactions / totalTransactions) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="text-sm text-gray-500">Contract Revenue</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(contractFees)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="text-sm text-gray-500">Invoice Revenue</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  metricsData?.revenue_breakdown?.[range]?.invoice || 0
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <div className="text-sm text-gray-500">Transaction Revenue</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  metricsData?.revenue_breakdown?.[range]?.transfers || 0
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total App Revenue:</span>{" "}
              {formatCurrency(nombaBalanceRaw - mainWalletBalance)}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Contract Sign Rate:</span>{" "}
              {contractSignRate}%
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Invoice Payment Rate:</span>{" "}
              {invoicePaymentRate}%
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}