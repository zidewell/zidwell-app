// app/admin/receipts/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable, { AdminTableColumn } from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } = "@/app/components/ui/input";
import { Button } = "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } = "@/lib/dashboard-utils";
import { useDebounce } = "@/app/lib/hooks/useDebounce";

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (searchTerm) params.append("search", searchTerm);
    return `/api/admin-apis/receipts?${params}`;
  }, [page, searchTerm]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const receipts = data?.receipts ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    { key: "receipt_id", label: "Receipt ID" },
    { key: "payer_name", label: "Payer" },
    { key: "payee_name", label: "Payee" },
    {
      key: "amount",
      label: "Amount",
      render: (v) => <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "pending");
        const cls =
          s === "paid"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        const icon = s === "paid" ? "✓" : s === "pending" ? "⏳" : "✗";
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
        <div className="p-6 text-destructive">Failed to load receipts ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6>
        <div className="flex items-center justify-between>
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)>
            Receipts
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4>
          <KPICard title="Total Receipts" value={formatNumber(stats.total ?? total)} icon="▣" />
          <KPICard title="Paid" value={formatNumber(stats.paid ?? 0)} icon="✓" />
          <KPICard title="Pending" value={formatNumber(stats.pending ?? 0)} icon="⏳" />
          <KPICard
            title="Total Value"
            value={formatCurrency(stats.totalValue ?? 0)}
            icon="◎"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4>
          <div className="flex flex-1 gap-2>
            <Input
              placeholder="Search by payer or payee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => setPage(1)}
              className="input squircle-md"
            >
              🔍 Search
            </Button>
          </div>
        </div>

        <div className="text-sm text-(--text-secondary)>
          Showing {receipts.length} of {total} receipts
        </div>

        <AdminTable columns={columns} rows={receipts} emptyMessage="No receipts found" />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2>
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <span className="px-4 py-2 text-sm text-(--text-secondary)>
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
