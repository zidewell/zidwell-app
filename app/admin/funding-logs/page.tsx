// app/admin/funding-logs/page.tsx
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
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function FundingLogsPage() {
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
    return `/api/admin-apis/wallets/funding-logs?${params}`;
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

  const logs = data?.logs ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns = [
    { key: "reference", label: "Reference" },
    { key: "user_email", label: "User" },
    {
      key: "amount",
      label: "Amount",
      render: (v: any) => <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>,
    },
    { key: "gateway", label: "Channel" },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "success");
        const cls =
          s === "success"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        return <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>;
      },
    },
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
        <div className="p-6 text-destructive">Failed to load funding logs ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Funding Logs
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Funded"
            value={formatCurrency(stats.totalFunded ?? 0)}
            icon="◎"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard title="Transactions" value={formatNumber(stats.count ?? total)} icon="⇄" />
          <KPICard title="Success Rate" value={`${stats.successRate ?? 0}%`} icon="✓" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by reference or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setPage(1)} className="input squircle-md">
              🔍 Search
            </Button>
          </div>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {logs.length} of {total} funding logs
        </div>

        <AdminTable columns={columns} rows={logs} emptyMessage="No funding logs found" />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
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