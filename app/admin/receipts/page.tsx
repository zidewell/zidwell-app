// app/admin/receipts/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    return `/api/admin-apis/receipts?${params}`;
  }, [page, debouncedSearch]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Shape-safe readers — handle { receipts: [] } / { data: [] } / { pagination: { total } }
  const receipts =
    data?.receipts ?? data?.data ?? (Array.isArray(data) ? data : []);
  const total =
    data?.total ??
    data?.pagination?.total ??
    data?.pagination?.totalItems ??
    0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns = [
    { key: "reciept_number", label: "Receipt No." },
    { key: "initiator_email", label: "Initiator" },
    { key: "signee_email", label: "Signee" },
    {
      key: "amount_balance",
      label: "Amount",
      render: (v: any) => (
        <span className="font-medium">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    { key: "payment_for", label: "Payment For" },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "signed" || s === "completed" || s === "paid"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending" || s === "sent"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        const icon =
          s === "signed" || s === "completed" || s === "paid" ? "✓" : "⏳";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    { key: "created_at", label: "Created" },
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
          Failed to load receipts ❌
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Receipts
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Receipts"
            value={formatNumber(stats.total ?? total)}
            icon="▣"
          />
          <KPICard
            title="Signed"
            value={formatNumber(stats.signed ?? 0)}
            icon="✓"
          />
          <KPICard
            title="Total Value"
            value={formatCurrency(stats.totalValue ?? 0)}
            icon="◎"
          />
        </div>

        <Input
          placeholder="Search by receipt number or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />

        <div className="text-sm text-(--text-secondary)">
          Showing {receipts.length} of {total} receipts
        </div>

        <AdminTable
          columns={columns}
          rows={receipts}
          emptyMessage="No receipts found"
        />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <span className="px-4 py-2 text-sm text-(--text-secondary)">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}