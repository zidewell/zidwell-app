// app/admin/online-stores/[id]/page.tsx
"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

export default function StoreDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const apiUrl = useMemo(
    () => (id ? `/api/admin-apis/online-stores/${id}` : null),
    [id]
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
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

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">Failed to load store ❌</div>
      </AdminLayout>
    );
  }

  const { store, wallet, owner, pages, recent_payments } = data;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary) truncate">
              {store.name}
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1 truncate">
              {store.slug} · {owner?.email ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            {store.is_active && (
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                className="squircle-md border border-(--border-color) px-4 py-2 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
              >
                🔗 Visit Store
              </a>
            )}
          </div>
        </div>

        {/* ✅ Fixed grid: 1→2→3 across breakpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <KPICard
            title="Available Balance"
            value={formatCurrency(
              Number(wallet?.available_balance ?? store.wallet_balance ?? 0)
            )}
            icon="◫"
            subtitle="Ready to withdraw"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Pending Balance"
            value={formatCurrency(Number(wallet?.pending_balance ?? 0))}
            icon="⏳"
            subtitle="Awaiting settlement"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Total Earned"
            value={formatCurrency(
              Number(wallet?.total_earned ?? store.total_revenue ?? 0)
            )}
            icon="◎"
            subtitle="Lifetime revenue"
          />
          <KPICard
            title="Total Withdrawn"
            value={formatCurrency(Number(wallet?.total_withdrawn ?? 0))}
            icon="↑"
          />
          <KPICard
            title="Total Orders"
            value={formatNumber(Number(store.total_orders ?? 0))}
            icon="📦"
          />
          <KPICard
            title="Total Views"
            value={formatNumber(Number(store.total_views ?? 0))}
            icon="👁"
          />
        </div>

        {/* Store info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Store Info
            </p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">Owner</dt>
                <dd className="text-(--text-primary) truncate text-right">
                  {owner?.full_name || owner?.email || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">Phone</dt>
                <dd className="text-(--text-primary) truncate text-right">
                  {owner?.phone ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">Location</dt>
                <dd className="text-(--text-primary) truncate text-right">
                  {[store.city, store.state, store.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">
                  Activation Paid
                </dt>
                <dd className="text-(--text-primary) text-right">
                  {store.activation_paid ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">Delivery</dt>
                <dd className="text-(--text-primary) text-right">
                  {store.delivery_enabled
                    ? `Enabled · ${formatCurrency(
                        Number(store.delivery_fee) || 0
                      )}`
                    : "Disabled"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-secondary) shrink-0">Pickup</dt>
                <dd className="text-(--text-primary) text-right">
                  {store.local_pickup_enabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Description
            </p>
            <p className="text-sm text-(--text-primary) whitespace-pre-wrap leading-relaxed">
              {store.description || "No description"}
            </p>
          </div>
        </div>

        {/* Storefront pages */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
            Storefront Pages ({pages.length})
          </p>
          {pages.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">
              No payment pages linked to this store yet.
            </p>
          ) : (
            <div className="space-y-1">
              {pages.map((p: any) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 border-b border-(--border-color) last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-(--text-primary) truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-(--text-secondary) truncate">
                      {p.page_type} · /{p.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.is_published ? (
                      <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
                        ✓ Published
                      </span>
                    ) : (
                      <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-secondary) whitespace-nowrap">
                        Draft
                      </span>
                    )}
                    <span className="text-sm text-(--text-secondary) whitespace-nowrap">
                      {formatCurrency(Number(p.total_revenue) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
            Recent Payments ({recent_payments.length})
          </p>
          {recent_payments.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-1">
              {recent_payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 border-b border-(--border-color) last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-(--text-primary) truncate">
                      {p.customer_name ?? "—"}
                    </p>
                    <p className="text-xs text-(--text-secondary) truncate">
                      {p.customer_email ?? p.customer_phone ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-medium text-sm text-(--text-primary) whitespace-nowrap">
                      {formatCurrency(Number(p.amount) || 0)}
                    </span>
                    <span
                      className={`squircle-sm px-2 py-1 text-xs whitespace-nowrap ${
                        p.status === "completed"
                          ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
                          : p.status === "pending"
                            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
                            : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {p.status}
                    </span>
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