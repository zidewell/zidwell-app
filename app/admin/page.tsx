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
    []
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

  const nombaBalance = Number(stats.nombaBalance ?? 0);
  const walletBalance = Number(
    stats.totalWalletBalance ?? stats.mainWalletBalance ?? 0
  );
  const appRevenue = Number(
    stats.appRevenue ??
      stats.totalAppRevenue ??
      Math.max(0, nombaBalance - walletBalance)
  );
  const totalFunds = walletBalance + nombaBalance;

  const totalTransactions = Number(
    stats.totalTransactions ?? stats.successfulTransactions ?? 0
  );
  const totalInflow = Number(stats.totalInflow ?? 0);
  const totalOutflow = Number(stats.totalOutflow ?? 0);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
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

        {/* Row 1 — primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
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
            value={formatCurrency(walletBalance)}
            icon="◫"
            subtitle="Aggregate across all users"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Nomba Balance"
            value={formatCurrency(nombaBalance)}
            icon="◎"
            subtitle="Provider account balance"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="App Revenue"
            value={formatCurrency(appRevenue)}
            icon="⇄"
            subtitle="Nomba balance − user wallets"
            className="border-l-4 border-l-destructive"
          />
        </div>

        {/* Row 2 — fund movement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          <KPICard
            title="Total Funds"
            value={formatCurrency(totalFunds)}
            icon="◆"
            subtitle="Wallets + Nomba combined"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Total Transactions"
            value={formatNumber(totalTransactions)}
            icon="⇄"
            subtitle="All-time transaction count"
          />
          <KPICard
            title="Total Inflow"
            value={formatCurrency(totalInflow)}
            icon="↓"
            subtitle="Money coming in"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Total Outflow"
            value={formatCurrency(totalOutflow)}
            icon="↑"
            subtitle="Money going out"
            className="border-l-4 border-l-destructive"
          />
        </div>

        {/* Row 3 — operational KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
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
          <KPICard
            title="Pending Invoices"
            value={formatNumber(stats.pendingInvoices ?? 0)}
            icon="▤"
          />
        </div>

        <div className="text-xs text-(--text-secondary) leading-relaxed break-words">
          <p>
            Nomba balance:{" "}
            <span className="text-(--text-primary) font-medium">
              {formatCurrency(nombaBalance)}
            </span>
            {" − "}
            User wallets:{" "}
            <span className="text-(--text-primary) font-medium">
              {formatCurrency(walletBalance)}
            </span>
            {" = "}
            App revenue:{" "}
            <span className="text-(--text-primary) font-medium">
              {formatCurrency(appRevenue)}
            </span>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}