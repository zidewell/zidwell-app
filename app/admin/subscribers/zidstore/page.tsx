// app/admin/subscribers/zidstore/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import FilterBar from "@/app/components/admin-components/FilterBar";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function ZidstoreSubscribersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    return `/api/admin-apis/subscribers/zidstore?${params}`;
  }, [page, debouncedSearch, statusFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const kpis = data?.kpis ?? {};
  const planDistribution = data?.planDistribution ?? [];
  const recentSubscribers = data?.recentSubscribers ?? [];
  const recentPayments = data?.recentPayments ?? [];
  const expiringSoon = data?.expiringSoon ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  const subscriberColumns = [
    {
      key: "user_email",
      label: "User",
      render: (_v: any, row: any) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate">{row.user_name ?? "—"}</span>
          <span className="text-xs text-(--text-secondary) truncate">
            {row.user_email ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "plan_tier",
      label: "Plan",
      render: (v: any) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-[--color-accent-yellow]/15 text-[--color-accent-yellow] whitespace-nowrap capitalize">
          {String(v ?? "—")}
        </span>
      ),
    },
    {
      key: "billing_period",
      label: "Billing",
      render: (v: any) => (
        <span className="text-xs text-(--text-secondary) capitalize">
          {v ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "active"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "past_due"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls} whitespace-nowrap`}>
            ● {s}
          </span>
        );
      },
    },
    { key: "started_at", label: "Started" },
    { key: "current_period_end", label: "Renews" },
  ];

  const paymentColumns = [
    { key: "user_email", label: "User" },
    {
      key: "plan_tier",
      label: "Plan",
      render: (v: any) => (
        <span className="capitalize text-xs">{v ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v: any) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "success"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending" || s === "processing"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls} whitespace-nowrap`}>
            ● {s}
          </span>
        );
      },
    },
    { key: "provider", label: "Provider" },
    { key: "created_at", label: "Date" },
  ];

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
          Failed to load Zidstore subscribers ❌
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Zidstore Subscribers
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              E-commerce subscription revenue
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/subscribers">
              <Button variant="outline">← All Subscribers</Button>
            </Link>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Subscribers"
            value={formatNumber(kpis.activeSubscribers ?? 0)}
            icon="◉"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="MRR (30d)"
            value={formatCurrency(kpis.mrr30d ?? 0)}
            icon="₦"
            className="border-l-4 border-l-[--color-lemon-green]"
            subtitle={`ARR: ${formatCurrency(kpis.arrEstimate ?? 0)}`}
          />
          <KPICard
            title="New This Month"
            value={formatNumber(kpis.newThisMonth ?? 0)}
            icon="+"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Churn Rate"
            value={`${kpis.churnRate ?? 0}%`}
            icon="▼"
            className="border-l-4 border-l-destructive"
            subtitle={`Failed pmts: ${formatNumber(kpis.failedPayments ?? 0)}`}
          />
        </div>

        {/* Plan distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Plan Distribution
          </h3>
          {planDistribution.length === 0 ? (
            <div className="text-sm text-(--text-secondary) py-4">
              No active Zidstore subscribers yet
            </div>
          ) : (
            <div className="space-y-2">
              {planDistribution.map((p: any, i: number) => {
                const total = planDistribution.reduce(
                  (s: number, x: any) => s + x.count,
                  0
                );
                const pct = total ? (p.count / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-(--text-primary) capitalize">
                      {p.tier}
                    </div>
                    <div className="flex-1 h-6 bg-(--bg-secondary) squircle-sm overflow-hidden">
                      <div
                        className="h-full squircle-sm bg-[--color-lemon-green]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm text-(--text-secondary) tabular-nums">
                      {formatNumber(p.count)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search + filter */}
        <div className="space-y-3">
          <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft p-4">
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <FilterBar
            filters={[
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: "All Status",
                options: [
                  { value: "active", label: "Active" },
                  { value: "past_due", label: "Past Due" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "expired", label: "Expired" },
                ],
              },
            ]}
            onClear={() => setStatusFilter("")}
            hasActiveFilters={!!statusFilter}
          />
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {recentSubscribers.length} of {pagination.total} subscribers
        </div>

        <AdminTable
          columns={subscriberColumns}
          rows={recentSubscribers}
          emptyMessage="No subscribers found"
        />

        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <span className="px-4 py-2 text-sm text-(--text-secondary)">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        )}

        {/* Recent payments */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Recent Payments
          </h3>
          <AdminTable
            columns={paymentColumns}
            rows={recentPayments}
            emptyMessage="No payments yet"
          />
        </div>

        {/* Expiring soon */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Renewing in 7 Days
          </h3>
          {expiringSoon.length === 0 ? (
            <div className="text-sm text-(--text-secondary) py-4">
              No renewals in the next 7 days
            </div>
          ) : (
            <div className="space-y-2">
              {expiringSoon.map((s: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-(--border-color) last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-(--text-primary)">
                      {s.user_email}
                    </div>
                    <div className="text-xs text-(--text-secondary) capitalize">
                      {s.plan_tier}
                    </div>
                  </div>
                  <div className="text-sm text-(--text-secondary)">
                    {new Date(s.current_period_end).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}