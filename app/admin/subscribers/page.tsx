// app/admin/subscribers/page.tsx
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

type Tab = "zidwell" | "zidstore";

export default function SubscribersPage() {
  const [tab, setTab] = useState<Tab>("zidwell");

  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin-apis/subscribers",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  );

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
        <div className="p-6 text-destructive">
          Failed to load subscribers ❌
        </div>
      </AdminLayout>
    );
  }

  const zidwell = data?.zidwell ?? {};
  const zidstore = data?.zidstore ?? {};
  const active = tab === "zidwell" ? zidwell : zidstore;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Subscribers
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              Manage Zidwell and Zidstore subscription revenue
            </p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="inline-flex squircle-md bg-(--bg-secondary) p-1 gap-1 flex-wrap">
          <button
            onClick={() => setTab("zidwell")}
            className={`px-4 py-2 text-sm font-medium squircle-sm transition-colors ${
              tab === "zidwell"
                ? "bg-[--color-accent-yellow] text-(--color-ink)"
                : "text-(--text-secondary) hover:text-(--text-primary)"
            }`}
          >
            Zidwell Plans ({formatNumber(zidwell.activeSubscribers ?? 0)})
          </button>
          <button
            onClick={() => setTab("zidstore")}
            className={`px-4 py-2 text-sm font-medium squircle-sm transition-colors ${
              tab === "zidstore"
                ? "bg-[--color-accent-yellow] text-(--color-ink)"
                : "text-(--text-secondary) hover:text-(--text-primary)"
            }`}
          >
            Zidstore Plans ({formatNumber(zidstore.activeSubscribers ?? 0)})
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Subscribers"
            value={formatNumber(active.activeSubscribers ?? 0)}
            icon="◉"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="MRR (30d)"
            value={formatCurrency(active.mrr30d ?? 0)}
            icon="₦"
            className="border-l-4 border-l-[--color-lemon-green]"
            subtitle={`ARR est: ${formatCurrency(active.arrEstimate ?? 0)}`}
          />
          <KPICard
            title="New This Month"
            value={formatNumber(active.newThisMonth ?? 0)}
            icon="+"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Churn Rate"
            value={`${active.churnRate ?? 0}%`}
            icon="▼"
            className="border-l-4 border-l-destructive"
            subtitle={`${formatNumber(active.churnedThisMonth ?? 0)} cancelled`}
          />
        </div>

        {/* Navigation to detail pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/subscribers/zidwell"
            className="card hover:border-[--color-accent-yellow] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
                  Zidwell Plans
                </div>
                <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
                  {formatNumber(zidwell.activeSubscribers ?? 0)} active
                </div>
                <div className="mt-1 text-sm text-(--text-secondary)">
                  MRR: {formatCurrency(zidwell.mrr30d ?? 0)}
                </div>
              </div>
              <div className="text-3xl text-(--color-accent-yellow)">→</div>
            </div>
          </Link>
          <Link
            href="/admin/subscribers/zidstore"
            className="card hover:border-[--color-accent-yellow] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
                  Zidstore Plans
                </div>
                <div className="mt-2 text-2xl font-semibold text-(--text-primary)">
                  {formatNumber(zidstore.activeSubscribers ?? 0)} active
                </div>
                <div className="mt-1 text-sm text-(--text-secondary)">
                  MRR: {formatCurrency(zidstore.mrr30d ?? 0)}
                </div>
              </div>
              <div className="text-3xl text-(--color-accent-yellow)">→</div>
            </div>
          </Link>
        </div>

        {/* Note */}
        <div className="text-xs text-(--text-secondary) leading-relaxed">
          MRR is calculated from successful payments in the last 30 days. ARR is
          an estimate (MRR × 12). Churn rate = cancellations this month ÷ active
          subscribers.
        </div>
      </div>
    </AdminLayout>
  );
}