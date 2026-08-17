// app/components/admin-components/dashboard/overview/OverviewKPIRows.tsx
import KPICard from "../../KPICard"
import { GrowthIndicator } from "../GrowthIndicator"
import {
  TrendingUp,
  Wallet,
  CreditCard,
  DollarSign,
  Users,
  Activity,
} from "lucide-react"
import { RangeOption, MetricsData, SummaryData } from "@/types/admin-dashoard"
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils"

interface OverviewKPIRowsProps {
  metricsData: MetricsData
  summaryData: SummaryData
  range: RangeOption
  getMetricValue: (metric: keyof MetricsData, period: RangeOption) => number
  inflowGrowth: number
  outflowGrowth: number
  appRevenueGrowth: number
  contractRevenueGrowth: number
  contractsGrowth: number
  invoicesGrowth: number
  contractSignRate: string
  invoicePaymentRate: string
  calculateContractRevenueGrowth: () => number
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

  const totalInflow = Number(summaryData?.totalInflow ?? 0)
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0)
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0)
  const nombaBalance = Number(summaryData?.nombaBalance ?? 0)
  const totalAppRevenue = Number(summaryData?.totalAppRevenue ?? 0)
  const totalUsers = Number(summaryData?.totalUsers ?? 0)

  const revenueData = metricsData?.revenue_breakdown?.[range] || {
    total: 0,
    app_fees: 0,
    nomba_fees: 0,
    transfers: 0,
    invoice: 0,
    contract: 0,
  }

  const netMargin = revenueData.total > 0
    ? ((revenueData.app_fees / revenueData.total) * 100).toFixed(1)
    : "0"

  return (
    <div className="space-y-4">
      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={formatNumber(totalUsers)}
          icon={<Users className="w-5 h-5 text-blue-500" />}
          className="border-l-4 border-l-blue-500"
          subtitle="Registered users"
        />
        <KPICard
          title="Total Signups"
          value={formatNumber(getMetricValue("signups", range))}
          icon={<Activity className="w-5 h-5 text-purple-500" />}
          className="border-l-4 border-l-purple-500"
          subtitle={`New users (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Transaction Volume"
          value={formatCurrency(getMetricValue("transaction_volume", range))}
          icon={<DollarSign className="w-5 h-5 text-amber-500" />}
          className="border-l-4 border-l-amber-500"
          subtitle={`Cash processed (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenueData.total)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          className="border-l-4 border-l-emerald-500"
          subtitle={`App: ${formatCurrency(revenueData.app_fees)}`}
        />
      </div>

      {/* Row 2: Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Inflow"
          value={formatCurrency(totalInflow)}
          growth={<GrowthIndicator value={inflowGrowth} />}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          className="border-l-4 border-l-emerald-500"
          subtitle="Money coming in"
        />
        <KPICard
          title="Total Outflow"
          value={formatCurrency(totalOutflow)}
          growth={<GrowthIndicator value={outflowGrowth} />}
          icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
          className="border-l-4 border-l-rose-500"
          subtitle="Money going out"
        />
        <KPICard
          title="Main Wallet Balance"
          value={formatCurrency(mainWalletBalance)}
          icon={<Wallet className="w-5 h-5 text-blue-500" />}
          className="border-l-4 border-l-blue-500"
          subtitle="Total user wallet balances"
        />
        <KPICard
          title="Admin Wallet (Nomba)"
          value={formatCurrency(nombaBalance)}
          icon={<CreditCard className="w-5 h-5 text-purple-500" />}
          className="border-l-4 border-l-purple-500"
          subtitle="Nomba account balance"
        />
      </div>

      {/* Row 3: Platform Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="App Fees (Platform)"
          value={formatCurrency(revenueData.app_fees)}
          growth={<GrowthIndicator value={appRevenueGrowth} />}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          className="border-l-4 border-l-emerald-500 bg-linear-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20"
          subtitle={`${netMargin}% margin`}
        />
        <KPICard
          title="Nomba Fees (Provider)"
          value={formatCurrency(revenueData.nomba_fees)}
          icon={<CreditCard className="w-5 h-5 text-orange-500" />}
          className="border-l-4 border-l-orange-500 bg-linear-to-r from-orange-50/50 to-transparent dark:from-orange-950/20"
          subtitle="API provider costs"
        />
        <KPICard
          title="Contract Revenue"
          value={formatCurrency(revenueData.contract)}
          growth={<GrowthIndicator value={calculateContractRevenueGrowth()} />}
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          className="border-l-4 border-l-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20"
          subtitle={`Revenue from contracts (${range === "total" ? "all time" : range})`}
        />
        <KPICard
          title="Invoice Revenue"
          value={formatCurrency(revenueData.invoice)}
          icon={<CreditCard className="w-5 h-5 text-pink-500" />}
          className="border-l-4 border-l-pink-500 bg-linear-to-r from-pink-50/50 to-transparent dark:from-pink-950/20"
          subtitle={`Revenue from invoices (${range === "total" ? "all time" : range})`}
        />
      </div>
    </div>
  )
}