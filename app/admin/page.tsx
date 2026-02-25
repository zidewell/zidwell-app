// app/admin/dashboard/page.tsx (or wherever your main dashboard is)
"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import AdminLayout from "../components/admin-components/layout";

// Import refactored components
import { DashboardHeader } from "../components/admin-components/dashboard/DashboardHeader";
import { DashboardLoading } from "../components/admin-components/dashboard/DashboardLoading";
import { DashboardError } from "../components/admin-components/dashboard/DashboardError";
import { OverviewKPIRows } from "../components/admin-components/dashboard/overview/OverviewKPIRows";
import { RevenueChart } from "../components/admin-components/dashboard/overview/RevenueChart";
import { ContractStatusPie } from "../components/admin-components/dashboard/overview/ContractStatusPie";
import { TrafficKPIs } from "../components/admin-components/dashboard/traffic/TrafficKPIs";
import { TrafficTrendChart } from "../components/admin-components/dashboard/traffic/TrafficTrendChart";
import { TopPages } from "../components/admin-components/dashboard/traffic/TopPages";
import { TrafficSources } from "../components/admin-components/dashboard/traffic/TrafficSources";
import { TrafficInsights } from "../components/admin-components/dashboard/traffic/TrafficInsights";
import { TransactionsTable } from "../components/admin-components/dashboard/TransactionsTable";
import { PlatformSummary } from "../components/admin-components/dashboard/PlatformSummary";

// Import utilities and hooks
import { fetcher } from "@/lib/fetcher";
import { useWebsiteAnalytics } from "../hooks/useWebsiteAnalytics";
import {
  formatCurrency,
  formatCurrencyShort,
  formatNumber,
  formatDateSafely,
  calculateGrowth,
  getSafeData,
} from "@/lib/dashboard-utils";
import { CHART_COLORS, ALL_TIME_RANGES } from "@/constants/dashboard";
import {
  RangeOption,
  MetricsData,
  SummaryData,
  WebsiteAnalytics,
} from "@/types/admin-dashoard";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, DollarSign, FileCheck, FileSignature, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [page, setPage] = useState<number>(1);
  const PAGE_LIMIT = 50;
  const [range, setRange] = useState<RangeOption>("total");
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    setIsClient(true);
    const savedRange = localStorage.getItem(
      "admin_dashboard_range",
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

  // Data fetching
  const {
    data: summaryData,
    error: summaryError,
    isLoading: summaryLoading,
  } = useSWR<SummaryData>(
    `/api/admin-apis/dashboard/summary?range=${range}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    },
  );

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
    },
  );

  const {
    data: websiteAnalytics,
    error: websiteError,
    isLoading: websiteLoading,
  } = useWebsiteAnalytics(range);

  const {
    data: paginatedData,
    error: paginatedError,
    isLoading: transactionsLoading,
  } = useSWR<any>(
    `/api/admin-apis/transactions?page=${page}&range=${range}`,
    fetcher,
  );

  // Error logging
  useEffect(() => {
    if (paginatedError)
      console.error("Paginated transactions error:", paginatedError);
    if (summaryError) console.error("Summary error:", summaryError);
    if (metricsError) console.error("Metrics error:", metricsError);
    if (websiteError) console.error("Website analytics error:", websiteError);
  }, [paginatedError, summaryError, metricsError, websiteError]);

  // Derived data from summary - USING CORRECT PROPERTY NAMES
  const totalInflow = Number(summaryData?.totalInflow ?? 0);
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0);
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0);
  const nombaBalance = Number(summaryData?.nombaBalance ?? 0);
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
    summaryData?.successfulTransactions ?? 0,
  );
  const failedTransactions = Number(summaryData?.failedTransactions ?? 0);
  const pendingTransactions = Number(summaryData?.pendingTransactions ?? 0);
  const totalUsers = Number(summaryData?.totalUsers ?? 0);

  // Calculations
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
  const platformRevenueShare =
    totalAppRevenue > 0
      ? ((platformFees / totalAppRevenue) * 100).toFixed(1)
      : "0";
  const avgContractValue =
    signedContracts > 0
      ? (totalContractAmount / signedContracts).toFixed(2)
      : "0";
  const invoicePaymentRate =
    totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : "0";

  // Helper function to get metric values
  const getMetricValue = (
    metric: keyof MetricsData,
    period: RangeOption,
  ): number => {
    if (!metricsData) return 0;
    if (metric === "revenue_breakdown") {
      return metricsData[metric]?.[period]?.total || 0;
    }
    return metricsData[metric]?.[period] || 0;
  };

  // Growth calculations
  const inflowGrowth = calculateGrowth(
    totalInflow,
    Number(summaryData?.prevTotalInflow ?? 0),
  );
  const outflowGrowth = calculateGrowth(
    totalOutflow,
    Number(summaryData?.prevTotalOutflow ?? 0),
  );
  const appRevenueGrowth = calculateGrowth(
    totalAppRevenue,
    Number(summaryData?.prevTotalAppRevenue ?? 0),
  );
  const contractsGrowth = calculateGrowth(
    totalContracts,
    Number(summaryData?.prevTotalContracts ?? 0),
  );
  const invoicesGrowth = calculateGrowth(
    totalInvoices,
    Number(summaryData?.prevTotalInvoices ?? 0),
  );

  const calculateContractRevenueGrowth = (): number => {
    const currentRevenue =
      metricsData?.revenue_breakdown?.[range]?.contract || 0;
    const prevRevenue = Number(summaryData?.prevContractFees ?? 0);
    if (prevRevenue === 0 && currentRevenue > 0) return 100;
    if (prevRevenue === 0 && currentRevenue === 0) return 0;
    return ((currentRevenue - prevRevenue) / prevRevenue) * 100;
  };

  // Chart data
  const monthlyAppRevenue = summaryData?.monthlyAppRevenue ?? [];
  const monthlyContracts = summaryData?.monthlyContracts ?? [];
  const revenueBreakdownMonthlyData = getSafeData(
    metricsData,
    "revenue_breakdown.monthly",
    [],
  );
  const signupsMonthlyData = getSafeData(metricsData, "signups.monthly", []);
  const activeUsersMonthlyData = getSafeData(
    metricsData,
    "active_users.monthly",
    [],
  );
  const transactionVolumeMonthlyData = getSafeData(
    metricsData,
    "transaction_volume.monthly",
    [],
  );

  // Pie chart data
  const contractsPieData = [
    { name: "Signed", value: signedContracts, color: CHART_COLORS.pie[0] },
    { name: "Pending", value: pendingContracts, color: CHART_COLORS.pie[2] },
  ].filter((item) => item.value > 0);

  // Recent transactions
  const recentActivity =
    summaryData?.latestTransactions?.slice(0, 5) ??
    paginatedData?.transactions?.slice(0, 5) ??
    [];
  const hasNextPage = paginatedData?.transactions?.length === PAGE_LIMIT;
  const hasPrevPage = page > 1;

  // Pagination handlers
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

  // Refresh handler
  const refresh = async () => {
    await mutate(
      `/api/admin-apis/dashboard/summary?range=${range}&nocache=true`,
    );
    await mutate(`/api/admin-apis/dashboard/metrics?range=${range}`);
    await mutate(`/api/admin-apis/transactions?page=${page}&range=${range}`);
    await mutate(`/api/admin-apis/analytics/website?range=${range}`);
  };

  // Loading and error states
  const isLoading =
    summaryLoading || metricsLoading || transactionsLoading || websiteLoading;
  const hasData =
    summaryData && metricsData && paginatedData && websiteAnalytics;

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (!hasData) {
    return <DashboardError onRetry={refresh} />;
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 space-y-8">
        <DashboardHeader
          range={range}
          onRangeChange={(val: RangeOption) => setRange(val)}
          onRefresh={refresh}
        />

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
            <OverviewKPIRows
              metricsData={metricsData}
              summaryData={summaryData}
              range={range}
              getMetricValue={getMetricValue}
              inflowGrowth={inflowGrowth}
              outflowGrowth={outflowGrowth}
              appRevenueGrowth={appRevenueGrowth}
              contractRevenueGrowth={calculateContractRevenueGrowth()}
              contractsGrowth={contractsGrowth}
              invoicesGrowth={invoicesGrowth}
              contractSignRate={contractSignRate}
              invoicePaymentRate={invoicePaymentRate}
              calculateContractRevenueGrowth={calculateContractRevenueGrowth}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RevenueChart data={revenueBreakdownMonthlyData} range={range} />
              <ContractStatusPie
                data={contractsPieData}
                contractFees={contractFees}
                contractRevenueShare={contractRevenueShare}
              />
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-8">
            <TrafficKPIs summary={websiteAnalytics?.summary} />
            <TrafficTrendChart data={websiteAnalytics?.daily || []} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopPages pages={websiteAnalytics?.topPages || []} />
              <TrafficSources
                sources={websiteAnalytics?.trafficSources || []}
              />
            </div>
            <TrafficInsights
              topPage={websiteAnalytics?.topPages[0]?.path}
              topSource={websiteAnalytics?.trafficSources[0]?.source}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Signups */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  User Signups
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {ALL_TIME_RANGES.slice(0, 4).map((period) => (
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
                  {ALL_TIME_RANGES.slice(4).map((period) => (
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

              {/* Active Users */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Active Users
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {ALL_TIME_RANGES.slice(0, 4).map((period) => (
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
                  {ALL_TIME_RANGES.slice(4).map((period) => (
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Transaction Volume
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
                {ALL_TIME_RANGES.map((period) => {
                  const periodValue = getMetricValue(
                    "transaction_volume",
                    period,
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
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value: number) => {
                          if (value >= 1000000) {
                            return `₦${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `₦${(value / 1000).toFixed(1)}K`;
                          }
                          return `₦${value}`;
                        }}
                      />
                      <Tooltip
                        formatter={(value: any) => [
                          formatCurrency(value),
                          "Volume",
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
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
                      ? `${((successfulTransactions / totalTransactions) * 100).toFixed(1)}% success rate`
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
                          (totalInflow + totalOutflow) / successfulTransactions,
                        )
                      : formatCurrency(0)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="contracts" className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Contract Analytics
              </h3>

              {/* Get revenue data for current range */}
              {(() => {
                const revenueData = metricsData?.revenue_breakdown?.[range] || {
                  total: 0,
                  app_fees: 0,
                  nomba_fees: 0,
                  transfers: 0,
                  invoice: 0,
                  contract: 0,
                };

                const contractRevenue = revenueData.contract || 0;
                const contractAppFees =
                  revenueData.breakdown?.app_fees?.contracts || 0;
                const contractNombaFees =
                  revenueData.breakdown?.nomba_fees?.contracts || 0;

                return (
                  <>
                    {/* Contract Revenue Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-purple-700 mb-1">
                              Total Contract Revenue
                            </div>
                            <div className="text-2xl font-bold text-purple-900">
                              {formatCurrency(contractRevenue)}
                            </div>
                          </div>
                          <DollarSign className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="mt-2 text-xs text-purple-700">
                          <div className="flex justify-between">
                            <span>App Fees:</span>
                            <span className="font-medium">
                              {formatCurrency(contractAppFees)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nomba Fees:</span>
                            <span className="font-medium">
                              {formatCurrency(contractNombaFees)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-700 mb-1">
                              Total Contracts
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                              {formatNumber(
                                summaryData?.totalContractsIssued || 0,
                              )}
                            </div>
                          </div>
                          <FileSignature className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-green-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-green-700 mb-1">
                              Signed Contracts
                            </div>
                            <div className="text-2xl font-bold text-green-900">
                              {formatNumber(summaryData?.signedContracts || 0)}
                            </div>
                          </div>
                          <FileCheck className="w-8 h-8 text-green-600" />
                        </div>
                      </div>

                      <div className="bg-amber-50 p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-amber-700 mb-1">
                              Avg. Contract Value
                            </div>
                            <div className="text-2xl font-bold text-amber-900">
                              {summaryData?.signedContracts &&
                              summaryData.signedContracts > 0
                                ? formatCurrency(
                                    (summaryData?.totalContractAmount || 0) /
                                      summaryData.signedContracts,
                                  )
                                : formatCurrency(0)}
                            </div>
                          </div>
                          <TrendingUp className="w-8 h-8 text-amber-600" />
                        </div>
                      </div>
                    </div>

                    {/* Contract Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-xl border">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                          Revenue Breakdown
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              Total Contract Revenue
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(contractRevenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-700">
                              App Fees (Platform)
                            </span>
                            <span className="text-lg font-bold text-green-900">
                              {formatCurrency(contractAppFees)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                            <span className="text-sm font-medium text-orange-700">
                              Nomba Fees (Provider)
                            </span>
                            <span className="text-lg font-bold text-orange-900">
                              {formatCurrency(contractNombaFees)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-700">
                              Total Contract Amount
                            </span>
                            <span className="text-lg font-bold text-blue-900">
                              {formatCurrency(
                                summaryData?.totalContractAmount || 0,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                          Performance Metrics
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              Contract Sign Rate
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {summaryData?.totalContractsIssued &&
                              summaryData.totalContractsIssued > 0
                                ? `${(((summaryData.signedContracts || 0) / summaryData.totalContractsIssued) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-700">
                              Revenue per Contract
                            </span>
                            <span className="text-lg font-bold text-purple-900">
                              {summaryData?.signedContracts &&
                              summaryData.signedContracts > 0
                                ? formatCurrency(
                                    contractRevenue /
                                      summaryData.signedContracts,
                                  )
                                : formatCurrency(0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                            <span className="text-sm font-medium text-indigo-700">
                              Platform Margin
                            </span>
                            <span className="text-lg font-bold text-indigo-900">
                              {contractRevenue > 0
                                ? `${((contractAppFees / contractRevenue) * 100).toFixed(1)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                            <span className="text-sm font-medium text-amber-700">
                              Pending Contracts
                            </span>
                            <span className="text-lg font-bold text-amber-900">
                              {formatNumber(summaryData?.pendingContracts || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Contract Revenue Chart */}
                    <div className="h-[400px] mb-8">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">
                        Monthly Contract Revenue Trend
                      </h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={summaryData?.monthlyContracts || []}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f3f4f6"
                          />
                          <XAxis dataKey="month" />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#3b82f6"
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#f59e0b"
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => {
                              if (name === "revenue")
                                return [formatCurrency(value), "Revenue"];
                              return [formatNumber(value), "Contracts"];
                            }}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="count"
                            name="Contracts Issued"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Contract Status Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Contract Status Distribution
                        </h4>
                        <div className="h-64">
                          {(() => {
                            const signed = summaryData?.signedContracts || 0;
                            const pending = summaryData?.pendingContracts || 0;
                            const total = signed + pending;
                            const pieData = [
                              {
                                name: "Signed",
                                value: signed,
                                color: CHART_COLORS.inflow,
                              },
                              {
                                name: "Pending",
                                value: pending,
                                color: CHART_COLORS.outflow,
                              },
                            ].filter((item) => item.value > 0);

                            return pieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: any) =>
                                      `${entry.name}: ${((entry.percent || 0) * 100).toFixed(1)}%`
                                    }
                                    outerRadius={80}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
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
                            );
                          })()}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Revenue by Contract Status
                        </h4>
                        <div className="h-64">
                          {(() => {
                            const signed = summaryData?.signedContracts || 0;
                            const pending = summaryData?.pendingContracts || 0;
                            const signedRevenue =
                              signed > 0
                                ? contractRevenue *
                                  (signed / (signed + pending || 1))
                                : 0;
                            const pendingRevenue =
                              pending > 0
                                ? contractRevenue *
                                  (pending / (signed + pending || 1))
                                : 0;

                            const revenuePieData = [
                              {
                                name: "Signed Revenue",
                                value: signedRevenue,
                                color: CHART_COLORS.inflow,
                              },
                              {
                                name: "Pending Revenue",
                                value: pendingRevenue,
                                color: CHART_COLORS.outflow,
                              },
                            ].filter((item) => item.value > 0);

                            return revenuePieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={revenuePieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: any) =>
                                      `${entry.name}: ${((entry.percent || 0) * 100).toFixed(1)}%`
                                    }
                                    outerRadius={80}
                                    dataKey="value"
                                  >
                                    {revenuePieData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(value: number) => [
                                      formatCurrency(value),
                                      "Revenue",
                                    ]}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-400">
                                No revenue data available
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Contract Revenue Table */}
                    <div className="mt-8">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">
                        Monthly Contract Performance
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Month
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Contracts
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Revenue
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Avg per Contract
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(summaryData?.monthlyContracts || [])
                              .slice()
                              .reverse()
                              .map((item: any, idx: number) => {
                                const avgPerContract =
                                  item.count > 0
                                    ? item.revenue / item.count
                                    : 0;
                                return (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.month}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                      {formatNumber(item.count)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-purple-600">
                                      {formatCurrency(item.revenue || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-amber-600">
                                      {formatCurrency(avgPerContract)}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
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

              {/* Fee Type Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    App Fees (Platform Revenue)
                  </h4>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(
                      metricsData?.revenue_breakdown?.[range]?.app_fees || 0,
                    )}
                  </p>
                  <div className="mt-2 text-xs text-green-700">
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.app_fees.transactions || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoice Creation:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.app_fees.invoice_creation || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoice Fees (2%):</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.app_fees.invoices || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contracts:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.app_fees.contracts || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">
                    Nomba Fees (Provider Cost)
                  </h4>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(
                      metricsData?.revenue_breakdown?.[range]?.nomba_fees || 0,
                    )}
                  </p>
                  <div className="mt-2 text-xs text-orange-700">
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.nomba_fees.transactions || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoices:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.nomba_fees.invoices || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contracts:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          metricsData?.revenue_breakdown?.[range]?.breakdown
                            ?.nomba_fees.contracts || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Net Profit Margin
                  </h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {metricsData?.revenue_breakdown?.[range]?.total > 0
                      ? `${((metricsData?.revenue_breakdown?.[range]?.app_fees / metricsData?.revenue_breakdown?.[range]?.total) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    App Fees:{" "}
                    {formatCurrency(
                      metricsData?.revenue_breakdown?.[range]?.app_fees || 0,
                    )}{" "}
                    / Total:{" "}
                    {formatCurrency(
                      metricsData?.revenue_breakdown?.[range]?.total || 0,
                    )}
                  </p>
                </div>
              </div>

              {/* Period Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
                {[
                  "total",
                  "today",
                  "week",
                  "month",
                  "90days",
                  "180days",
                  "year",
                ].map((period) => {
                  const revenue =
                    metricsData?.revenue_breakdown?.[period as RangeOption];
                  return (
                    <div
                      key={period}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="text-sm text-gray-700 mb-1 capitalize">
                        {period === "total"
                          ? "All Time"
                          : period.replace("days", " Days")}
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(revenue?.total || 0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        App: {formatCurrency(revenue?.app_fees || 0)}
                      </div>
                      <div className="text-xs text-orange-600">
                        Nomba: {formatCurrency(revenue?.nomba_fees || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revenue Breakdown Table */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Monthly Revenue Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Month
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          App Fees
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Nomba Fees
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metricsData?.revenue_breakdown?.monthly
                        ?.slice()
                        .reverse()
                        .map((item: any, idx: number) => {
                          const margin =
                            item.total > 0
                              ? ((item.app_fees / item.total) * 100).toFixed(1)
                              : "0";
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.month}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                {formatCurrency(item.total)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-green-600">
                                {formatCurrency(item.app_fees)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-orange-600">
                                {formatCurrency(item.nomba_fees)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-blue-600">
                                {margin}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <TransactionsTable
          transactions={recentActivity}
          page={page}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onNext={goNext}
          onPrev={goPrev}
          formatCurrency={formatCurrency}
          formatDateSafely={(date) => formatDateSafely(date, isClient)}
        />

        <PlatformSummary
          totalUsers={totalUsers}
          totalTransactions={totalTransactions}
          successfulTransactions={successfulTransactions}
          contractFees={contractFees}
          invoiceRevenue={metricsData?.revenue_breakdown?.[range]?.invoice || 0}
          transactionRevenue={
            metricsData?.revenue_breakdown?.[range]?.transfers || 0
          }
          nombaBalance={nombaBalance}
          mainWalletBalance={mainWalletBalance}
          contractSignRate={contractSignRate}
          invoicePaymentRate={invoicePaymentRate}
          range={range}
        />
      </div>
    </AdminLayout>
  );
}
