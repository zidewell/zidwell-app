import KPICard from "../../KPICard";
import { GrowthIndicator } from "../GrowthIndicator";
import {
  Eye,
  UserPlus,
  Activity,
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  FileSignature,
  File,
  Users,
  Percent,
  PieChart,
} from "lucide-react";
import { RangeOption, MetricsData, SummaryData } from "@/types/admin-dashoard";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";

interface OverviewKPIRowsProps {
  metricsData: MetricsData;
  summaryData: SummaryData;
  range: RangeOption;
  getMetricValue: (metric: keyof MetricsData, period: RangeOption) => number;
  inflowGrowth: number;
  outflowGrowth: number;
  appRevenueGrowth: number;
  contractRevenueGrowth: number;
  contractsGrowth: number;
  invoicesGrowth: number;
  contractSignRate: string;
  invoicePaymentRate: string;
  calculateContractRevenueGrowth: () => number;
}

export const OverviewKPIRows = ({
  metricsData,
  summaryData,
  range,
  getMetricValue,
  inflowGrowth,
  outflowGrowth,
  appRevenueGrowth,
  contractRevenueGrowth,
  contractsGrowth,
  invoicesGrowth,
  contractSignRate,
  invoicePaymentRate,
  calculateContractRevenueGrowth,
}: OverviewKPIRowsProps) => {
  // Safely extract data with fallbacks
  const totalInflow = Number(summaryData?.totalInflow ?? 0);
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0);
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0);
  const nombaBalance = Number(summaryData?.nombaBalance ?? 0);
  const totalAppRevenue = Number(summaryData?.totalAppRevenue ?? 0);
  const contractFees = Number(summaryData?.contractFees ?? 0);
  const totalContracts = Number(summaryData?.totalContractsIssued ?? 0);
  const totalInvoices = Number(summaryData?.totalInvoicesIssued ?? 0);
  const totalUsers = Number(summaryData?.totalUsers ?? 0);
  
  // Get revenue breakdown for current range
  const revenueData = metricsData?.revenue_breakdown?.[range] || {
    total: 0,
    app_fees: 0,
    nomba_fees: 0,
    transfers: 0,
    invoice: 0,
    contract: 0,
  };
  
  const netMargin = revenueData.total > 0 
    ? ((revenueData.app_fees / revenueData.total) * 100).toFixed(1)
    : "0";

  return (
    <>
      {/* Top Row: Website, Signups, Active Users, Transaction Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="New Signups"
          value={formatNumber(getMetricValue("signups", range))}
          icon={<UserPlus className="w-5 h-5 text-green-600" />}
          className="border-l-4 border-l-green-500"
          subtitle={`New users (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Active Users"
          value={formatNumber(getMetricValue("active_users", range))}
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          className="border-l-4 border-l-purple-500"
          subtitle={`Active users (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Transaction Volume"
          value={formatCurrency(getMetricValue("transaction_volume", range))}
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
          className="border-l-4 border-l-amber-500"
          subtitle={`Cash processed (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Total Revenue"
          // value={formatCurrency(revenueData.total)}
          value={formatCurrency(nombaBalance - mainWalletBalance)}
          icon={<PieChart className="w-5 h-5 text-indigo-600" />}
          className="border-l-4 border-l-indigo-500"
          // subtitle={`App: ${formatCurrency(revenueData.app_fees)} | Nomba: ${formatCurrency(revenueData.nomba_fees)}`}
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
          value={formatCurrency(nombaBalance)}
          icon={<CreditCard className="w-5 h-5 text-purple-600" />}
          className="border-l-4 border-l-purple-500"
          subtitle="Nomba account balance"
        />
      </div>

      {/* Third Row: Platform Revenue Metrics with Fee Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="App Fees (Platform)"
          value={formatCurrency(revenueData.app_fees)}
          growth={<GrowthIndicator value={appRevenueGrowth} />}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white"
          subtitle={`Net platform earnings (${netMargin}% margin)`}
        />
        <KPICard
          title="Nomba Fees (Provider)"
          value={formatCurrency(revenueData.nomba_fees)}
          icon={<CreditCard className="w-5 h-5 text-orange-600" />}
          className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white"
          subtitle="API provider costs"
        />
        <KPICard
          title="Contract Revenue"
          value={formatCurrency(revenueData.contract)}
          growth={<GrowthIndicator value={calculateContractRevenueGrowth()} />}
          icon={<FileSignature className="w-5 h-5 text-indigo-600" />}
          className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50 to-white"
          subtitle={`Revenue from contracts (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Invoice Revenue"
          value={formatCurrency(revenueData.invoice)}
          icon={<File className="w-5 h-5 text-purple-600" />}
          className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white"
          subtitle={`Revenue from invoices (${range === "total" ? "all time" : range})`}
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

      {/* Fifth Row: Detailed Fee Breakdown (Optional) */}
      {revenueData.breakdown && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="col-span-4 bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-3">App Fee Sources</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(revenueData.breakdown.app_fees.transactions)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoice Creation</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(revenueData.breakdown.app_fees.invoice_creation)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Invoice Fees (2%)</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(revenueData.breakdown.app_fees.invoices)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contracts</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(revenueData.breakdown.app_fees.contracts)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};