// app/admin/subscribers/[id]/page.tsx
"use client";

import React from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

export default function SubscriberDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/admin-apis/subscribers/${userId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
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

  if (error || !data?.user) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Link href="/admin/subscribers">
            <Button variant="outline" className="mb-4">
              ← Back
            </Button>
          </Link>
          <div className="text-destructive">Failed to load subscriber ❌</div>
        </div>
      </AdminLayout>
    );
  }

  const user = data.user;
  const zidwell = data.zidwell ?? { subscriptions: [], payments: [] };
  const zidstore = data.zidstore ?? { subscriptions: [], payments: [] };

  const zidwellSubColumns = [
    {
      key: "tier",
      label: "Plan",
      render: (v: any) => (
        <span className="capitalize text-sm">{v ?? "—"}</span>
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
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>
        );
      },
    },
    { key: "started_at", label: "Started" },
    { key: "expires_at", label: "Expires" },
  ];

  const zidwellPaymentColumns = [
    {
      key: "amount",
      label: "Amount",
      render: (v: any) => (
        <span className="font-medium">
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
          s === "success" || s === "paid" || s === "completed"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>
        );
      },
    },
    { key: "payment_method", label: "Method" },
    { key: "reference", label: "Reference" },
    { key: "created_at", label: "Date" },
  ];

  const zidstoreSubColumns = [
    {
      key: "plan_tier",
      label: "Plan",
      render: (v: any) => (
        <span className="capitalize text-sm">{v ?? "—"}</span>
      ),
    },
    { key: "billing_period", label: "Billing" },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "active"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>
        );
      },
    },
    { key: "started_at", label: "Started" },
    { key: "current_period_end", label: "Renews" },
  ];

  const zidstorePaymentColumns = [
    {
      key: "amount",
      label: "Amount",
      render: (v: any) => (
        <span className="font-medium">
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
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>
        );
      },
    },
    { key: "provider", label: "Provider" },
    { key: "reference", label: "Reference" },
    { key: "created_at", label: "Date" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/admin/subscribers">
              <Button variant="outline">← Back</Button>
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
                {user.full_name ?? "Subscriber"}
              </h2>
              <p className="text-sm text-(--text-secondary)">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* User info KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            title="Zidwell Plan"
            value={user.subscription_tier ?? "free"}
            icon="◉"
            className="border-l-4 border-l-[--color-accent-yellow] capitalize"
          />
          <KPICard
            title="Zidwell Subscriptions"
            value={formatNumber(zidwell.subscriptions.length)}
            icon="◆"
          />
          <KPICard
            title="Zidstore Subscriptions"
            value={formatNumber(zidstore.subscriptions.length)}
            icon="◫"
          />
        </div>

        {/* Zidwell section */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Zidwell Subscriptions
          </h3>
          <AdminTable
            columns={zidwellSubColumns}
            rows={zidwell.subscriptions}
            emptyMessage="No Zidwell subscriptions"
          />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Zidwell Payment History
          </h3>
          <AdminTable
            columns={zidwellPaymentColumns}
            rows={zidwell.payments}
            emptyMessage="No Zidwell payments"
          />
        </div>

        {/* Zidstore section */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Zidstore Subscriptions
          </h3>
          <AdminTable
            columns={zidstoreSubColumns}
            rows={zidstore.subscriptions}
            emptyMessage="No Zidstore subscriptions"
          />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Zidstore Payment History
          </h3>
          <AdminTable
            columns={zidstorePaymentColumns}
            rows={zidstore.payments}
            emptyMessage="No Zidstore payments"
          />
        </div>
      </div>
    </AdminLayout>
  );
}