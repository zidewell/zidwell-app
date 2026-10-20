// app/admin/transactions/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable, { AdminTableColumn } from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

// `fee` is the platform/app fee column on `transactions`.
function resolveFee(tx: any): number {
  const raw = tx?.fee;
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
}

export default function TransactionsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (appliedSearch) params.append("search", appliedSearch);
    if (statusFilter) params.append("status", statusFilter);
    if (typeFilter) params.append("type", typeFilter);
    return `/api/admin-apis/transactions?${params}`;
  }, [page, appliedSearch, statusFilter, typeFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, statusFilter, typeFilter]);

  const transactions = data?.transactions ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const columns: AdminTableColumn[] = [
    { key: "reference", label: "Reference" },
    {
      key: "type",
      label: "Type",
      render: (v) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-primary) whitespace-nowrap">
          {String(v ?? "—")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "fee",
      label: "Fee",
      render: (_v, row) => (
        <span className="whitespace-nowrap">
          {formatCurrency(resolveFee(row))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "pending");
        const cls =
          s === "success"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending" || s === "processing"
              ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
              : "bg-destructive/15 text-destructive";
        const icon = s === "success" ? "✓" : s === "pending" ? "⏳" : "✗";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls} whitespace-nowrap`}>
            {icon} {s}
          </span>
        );
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
        <div className="p-6 text-destructive">Failed to load transactions ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Transactions
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* ✅ Fixed grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <KPICard
            title="Total Volume"
            value={formatCurrency(stats.totalVolume ?? stats.totalInflow ?? 0)}
            icon="⇄"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Total Fees"
            value={formatCurrency(stats.totalFee ?? 0)}
            icon="◎"
            subtitle="Sum of all fees"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Total Inflow"
            value={formatCurrency(stats.totalInflow ?? 0)}
            icon="↓"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Total Outflow"
            value={formatCurrency(stats.totalOutflow ?? 0)}
            icon="↑"
            className="border-l-4 border-l-destructive"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by reference or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              className="flex-1"
            />
            <Button onClick={runSearch} className="input squircle-md">
              🔍 Search
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="reversed">Reversed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="airtime">Airtime</option>
            <option value="data">Data</option>
            <option value="electricity">Electricity</option>
            <option value="cable">Cable</option>
            <option value="invoice">Invoice</option>
            <option value="contract">Contract</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {transactions.length} of {total} transactions
        </div>

        <AdminTable
          columns={columns}
          rows={transactions}
          onRowClick={(row) => {
            window.location.href = `/admin/transactions/user/${row.user_id}`;
          }}
          emptyMessage="No transactions found"
        />

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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