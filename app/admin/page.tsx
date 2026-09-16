// app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import AdminLayout from '@/app/components/admin-components/layout'
import { DashboardHeader } from '@/app/components/admin-components/dashboard/DashboardHeader'
import { DashboardLoading } from '@/app/components/admin-components/dashboard/DashboardLoading'
import { DashboardError } from '@/app/components/admin-components/dashboard/DashboardError'
import { OverviewKPIRows } from '@/app/components/admin-components/dashboard/overview/OverviewKPIRows'
import { RevenueChart } from '@/app/components/admin-components/dashboard/overview/RevenueChart'
import { ContractStatusPie } from '@/app/components/admin-components/dashboard/overview/ContractStatusPie'

import { fetcher } from '@/lib/fetcher'
import { useWebsiteAnalytics } from '@/app/hooks/useWebsiteAnalytics'
import {
  formatCurrency,
  formatNumber,
  calculateGrowth,
  getSafeData,
} from '@/lib/dashboard-utils'
import { CHART_COLORS } from '@/constants/dashboard'
import { RangeOption, MetricsData, SummaryData, RevenueBreakdown } from '@/types/admin-dashoard'

interface DashboardData {
  totalInflow: number
  totalOutflow: number
  mainWalletBalance: number
  nombaBalance: number
  totalTransactions: number
  totalUsers: number
  pendingInvoices: number
  paidInvoices: number
  partiallyPaidInvoices: number
  totalInvoicesIssued: number
  totalInvoiceRevenue: number
  invoiceCreationRevenue: number
  invoiceFeesFromTable: number
  pendingContracts: number
  signedContracts: number
  totalContractsIssued: number
  latestTransactions: any[]
  monthlyTransactions: Array<{ month: string; transactions: number }>
  monthlyInvoices: Array<{ month: string; count: number; revenue: number }>
  monthlyContracts: Array<{ month: string; count: number }>
  range: string
  totalAppRevenue: number
  transactionFees: number
  platformFees: number
  contractFees: number
  totalContractAmount: number
  contractPaymentsCount: number
  monthlyAppRevenue: Array<{ month: string; revenue: number }>
  transactionStatus: { success: number; failed: number; pending: number }
  successfulTransactions: number
  failedTransactions: number
  pendingTransactions: number
  prevTotalContracts: number
  prevPendingContracts: number
  prevSignedContracts: number
  prevContractFees: number
  prevTotalInvoices: number
  prevPaidInvoices: number
  prevUnpaidInvoices: number
  prevTotalInflow: number
  prevTotalOutflow: number
  prevTotalAppRevenue: number
  revenueBreakdown?: RevenueBreakdown
  _cache?: { cached: boolean; timestamp: number; range: string }
}

export default function AdminDashboard() {
  const [page, setPage] = useState<number>(1)
  const PAGE_LIMIT = 50
  const [range, setRange] = useState<RangeOption>('total')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const savedRange = localStorage.getItem('admin_dashboard_range') as RangeOption
    if (savedRange) {
      setRange(savedRange)
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('admin_dashboard_range', range)
    }
    setPage(1)
  }, [range, isClient])

  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: dashboardLoading,
    mutate: mutateDashboard,
  } = useSWR<DashboardData>(
    `/api/admin-apis/dashboard?range=${range}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
    },
  )

  const {
    data: websiteAnalytics,
    error: websiteError,
    isLoading: websiteLoading,
  } = useWebsiteAnalytics(range)

  const {
    data: paginatedData,
    error: paginatedError,
    isLoading: transactionsLoading,
  } = useSWR<any>(
    `/api/admin-apis/transactions?page=${page}&range=${range}&limit=${PAGE_LIMIT}`,
    fetcher,
  )

  const d = dashboardData

  const totalInflow = Number(d?.totalInflow ?? 0)
  const totalOutflow = Number(d?.totalOutflow ?? 0)
  const mainWalletBalance = Number(d?.mainWalletBalance ?? 0)
  const nombaBalance = Number(d?.nombaBalance ?? 0)
  const totalAppRevenue = Number(d?.totalAppRevenue ?? 0)
  const contractFees = Number(d?.contractFees ?? 0)
  const totalContracts = Number(d?.totalContractsIssued ?? 0)
  const pendingContracts = Number(d?.pendingContracts ?? 0)
  const signedContracts = Number(d?.signedContracts ?? 0)
  const totalInvoices = Number(d?.totalInvoicesIssued ?? 0)
  const paidInvoices = Number(d?.paidInvoices ?? 0)
  const totalUsers = Number(d?.totalUsers ?? 0)

  const contractSignRate = totalContracts > 0 ? ((signedContracts / totalContracts) * 100).toFixed(1) : '0'
  const invoicePaymentRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : '0'

  const inflowGrowth = calculateGrowth(totalInflow, Number(d?.prevTotalInflow ?? 0))
  const outflowGrowth = calculateGrowth(totalOutflow, Number(d?.prevTotalOutflow ?? 0))
  const appRevenueGrowth = calculateGrowth(totalAppRevenue, Number(d?.prevTotalAppRevenue ?? 0))
  const contractsGrowth = calculateGrowth(totalContracts, Number(d?.prevTotalContracts ?? 0))
  const invoicesGrowth = calculateGrowth(totalInvoices, Number(d?.prevTotalInvoices ?? 0))

  const calculateContractRevenueGrowth = (): number => {
    const currentRevenue = contractFees
    const prevRevenue = Number(d?.prevContractFees ?? 0)
    if (prevRevenue === 0 && currentRevenue > 0) return 100
    if (prevRevenue === 0 && currentRevenue === 0) return 0
    return ((currentRevenue - prevRevenue) / prevRevenue) * 100
  }

  // Create metricsData compatible object from consolidated dashboard data
  const rb = d?.revenueBreakdown
  const metricsData: MetricsData = {
    website: { total: 0, today: 0, week: 0, month: 0, "90days": 0, "180days": 0, year: 0, daily: [], weekly: [], monthly: [] },
    signups: { total: totalUsers, today: 0, week: 0, month: 0, "90days": 0, "180days": 0, year: 0, daily: [], weekly: [], monthly: [] },
    active_users: { total: 0, today: 0, week: 0, month: 0, "90days": 0, "180days": 0, year: 0, daily: [], weekly: [], monthly: [] },
    transaction_volume: { total: 0, today: 0, week: 0, month: 0, "90days": 0, "180days": 0, year: 0, daily: [], weekly: [], monthly: [] },
    revenue_breakdown: {
      total: rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      today: rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      week: rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      month: rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      "90days": rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      "180days": rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      year: rb || { total: 0, app_fees: 0, nomba_fees: 0, transfers: 0, invoice: 0, contract: 0, platform: 0 },
      daily: [],
      weekly: [],
      monthly: d?.monthlyAppRevenue?.map(m => ({
        month: m.month,
        total: m.revenue,
        app_fees: 0,
        nomba_fees: 0,
        transfers: 0,
        bill_payment: 0,
        invoice: 0,
        contract: 0,
        platform: 0,
        breakdown: {
          app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0, total: 0 },
          nomba_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0, total: 0 }
        }
      })) || [],
    }
  }

  const getMetricValue = (metric: keyof MetricsData, period: RangeOption): number => {
    if (!metricsData) return 0
    if (metric === 'revenue_breakdown') {
      return metricsData[metric]?.[period]?.total || 0
    }
    return metricsData[metric]?.[period] || 0
  }

  const revenueBreakdownMonthlyData = d?.monthlyAppRevenue?.map((m: any) => ({
    month: m.month,
    total: m.revenue,
    app_fees: 0,
    nomba_fees: 0,
    transfers: 0,
    bill_payment: 0,
    invoice: 0,
    contract: 0,
    platform: 0,
    breakdown: {
      app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0, total: 0 },
      nomba_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0, total: 0 }
    }
  })) || []
  
  const contractsPieData = [
    { name: 'Signed', value: signedContracts, color: CHART_COLORS.pie[0] },
    { name: 'Pending', value: pendingContracts, color: CHART_COLORS.pie[2] },
  ].filter((item) => item.value > 0)

  const refresh = async () => {
    await mutateDashboard()
    await fetch(`/api/admin-apis/transactions?page=${page}&range=${range}&limit=${PAGE_LIMIT}&nocache=true`)
    await fetch(`/api/admin-apis/analytics/website?range=${range}`)
  }

  const isLoading = dashboardLoading || transactionsLoading || websiteLoading
  const hasData = d && paginatedData && websiteAnalytics

  if (isLoading) {
    return <DashboardLoading />
  }

  if (!hasData) {
    return <DashboardError onRetry={refresh} />
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 md:space-y-8">
        <div className="relative">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--color-amber)]/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[var(--color-teal)]/5 blur-3xl" />
          <DashboardHeader
            range={range}
            onRangeChange={(val: RangeOption) => setRange(val)}
            onRefresh={refresh}
          />
        </div>

        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
          <OverviewKPIRows
            metricsData={metricsData}
            summaryData={d}
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
            <div className="lg:col-span-2 animate-fade-in-up-delay-2">
              <RevenueChart data={revenueBreakdownMonthlyData} range={range} />
            </div>
            <div className="animate-fade-in-up-delay-3">
              <ContractStatusPie
                data={contractsPieData}
                contractFees={contractFees}
                contractRevenueShare={totalAppRevenue > 0 ? ((contractFees / totalAppRevenue) * 100).toFixed(1) : '0'}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}