// app/admin/page.tsx
"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import GrowthIndicator from "@/app/components/admin-components/dashboard/GrowthIndicator";
import Loader from "@/app/components/Loader";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

export default function AdminDashboardPage() {
  const apiUrl = useMemo(
    () => `/api/admin-apis/dashboard/summary?includeStats=true`,
    [],
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">Failed to load dashboard ❌</div>
      </AdminLayout>
    );
  }

  const stats = data?.stats ?? data ?? {};

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Overview
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              Platform-wide metrics across wallets, contracts, and revenue.
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="squircle-md border border-(--border-color) px-4 py-2 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Total Users"
            value={formatNumber(stats.totalUsers ?? 0)}
            icon="◉"
            growth={
              typeof stats.userGrowth === "number" ? (
                <GrowthIndicator value={stats.userGrowth} />
              ) : undefined
            }
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Wallet Balance"
            value={formatCurrency(stats.totalWalletBalance ?? 0)}
            icon="◫"
            subtitle="Aggregate across all users"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="App Revenue"
            value={formatCurrency(stats.appRevenue ?? 0)}
            icon="◎"
            subtitle="From fee_breakdown.app_fee"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Nomba Fees"
            value={formatCurrency(stats.nombaFees ?? 0)}
            icon="⇄"
            subtitle="Provider cost"
            className="border-l-4 border-l-destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KPICard
            title="Active Contracts"
            value={formatNumber(stats.activeContracts ?? 0)}
            icon="✎"
          />
          <KPICard
            title="Pending KYC"
            value={formatNumber(stats.pendingKyc ?? 0)}
            icon="✓"
          />
          <KPICard
            title="Open Disputes"
            value={formatNumber(stats.openDisputes ?? 0)}
            icon="⚑"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
