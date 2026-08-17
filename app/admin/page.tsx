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
import { RangeOption, MetricsData, SummaryData } from '@/types/admin-dashoard'

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
  )

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
    `/api/admin-apis/transactions?page=${page}&range=${range}`,
    fetcher,
  )

  const totalInflow = Number(summaryData?.totalInflow ?? 0)
  const totalOutflow = Number(summaryData?.totalOutflow ?? 0)
  const mainWalletBalance = Number(summaryData?.mainWalletBalance ?? 0)
  const nombaBalance = Number(summaryData?.nombaBalance ?? 0)
  const totalAppRevenue = Number(summaryData?.totalAppRevenue ?? 0)
  const contractFees = Number(summaryData?.contractFees ?? 0)
  const totalContracts = Number(summaryData?.totalContractsIssued ?? 0)
  const pendingContracts = Number(summaryData?.pendingContracts ?? 0)
  const signedContracts = Number(summaryData?.signedContracts ?? 0)
  const totalInvoices = Number(summaryData?.totalInvoicesIssued ?? 0)
  const paidInvoices = Number(summaryData?.paidInvoices ?? 0)
  const totalUsers = Number(summaryData?.totalUsers ?? 0)

  const contractSignRate = totalContracts > 0 ? ((signedContracts / totalContracts) * 100).toFixed(1) : '0'
  const invoicePaymentRate = totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : '0'

  const getMetricValue = (metric: keyof MetricsData, period: RangeOption): number => {
    if (!metricsData) return 0
    if (metric === 'revenue_breakdown') {
      return metricsData[metric]?.[period]?.total || 0
    }
    return metricsData[metric]?.[period] || 0
  }

  const inflowGrowth = calculateGrowth(totalInflow, Number(summaryData?.prevTotalInflow ?? 0))
  const outflowGrowth = calculateGrowth(totalOutflow, Number(summaryData?.prevTotalOutflow ?? 0))
  const appRevenueGrowth = calculateGrowth(totalAppRevenue, Number(summaryData?.prevTotalAppRevenue ?? 0))
  const contractsGrowth = calculateGrowth(totalContracts, Number(summaryData?.prevTotalContracts ?? 0))
  const invoicesGrowth = calculateGrowth(totalInvoices, Number(summaryData?.prevTotalInvoices ?? 0))

  const calculateContractRevenueGrowth = (): number => {
    const currentRevenue = metricsData?.revenue_breakdown?.[range]?.contract || 0
    const prevRevenue = Number(summaryData?.prevContractFees ?? 0)
    if (prevRevenue === 0 && currentRevenue > 0) return 100
    if (prevRevenue === 0 && currentRevenue === 0) return 0
    return ((currentRevenue - prevRevenue) / prevRevenue) * 100
  }

  const revenueBreakdownMonthlyData = getSafeData(metricsData, 'revenue_breakdown.monthly', [])
  
  const contractsPieData = [
    { name: 'Signed', value: signedContracts, color: CHART_COLORS.pie[0] },
    { name: 'Pending', value: pendingContracts, color: CHART_COLORS.pie[2] },
  ].filter((item) => item.value > 0)

  const refresh = async () => {
    await fetch(`/api/admin-apis/dashboard/summary?range=${range}&nocache=true`)
    await fetch(`/api/admin-apis/dashboard/metrics?range=${range}`)
    await fetch(`/api/admin-apis/transactions?page=${page}&range=${range}`)
    await fetch(`/api/admin-apis/analytics/website?range=${range}`)
  }

  const isLoading = summaryLoading || metricsLoading || transactionsLoading || websiteLoading
  const hasData = summaryData && metricsData && paginatedData && websiteAnalytics

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
            <div className="lg:col-span-2 animate-fade-in-up-delay-2">
              <RevenueChart data={revenueBreakdownMonthlyData} range={range} />
            </div>
            <div className="animate-fade-in-up-delay-3">
              <ContractStatusPie
                data={contractsPieData}
                contractFees={contractFees}
                contractRevenueShare={((contractFees / totalAppRevenue) * 100).toFixed(1)}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}