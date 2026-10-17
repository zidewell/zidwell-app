// app/admin/transactions/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable, {
  AdminTableColumn,
} from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

function extractTransactionFees(tx: any): { appFee: number; nombaFee: number } {
  if (!tx.external_response) return { appFee: 0, nombaFee: 0 };
  const ext =
    typeof tx.external_response === "string"
      ? JSON.parse(tx.external_response)
      : tx.external_response;
  if (ext?.fee_breakdown) {
    return {
      appFee: Number(ext.fee_breakdown.app_fee) || 0,
      nombaFee: Number(ext.fee_breakdown.nomba_fee) || 0,
    };
  }
  if (ext?.data?.fee) return { appFee: 0, nombaFee: Number(ext.data.fee) || 0 };
  if (ext?.data?.transaction?.fee)
    return { appFee: 0, nombaFee: Number(ext.data.transaction.fee) || 0 };
  return { appFee: 0, nombaFee: 0 };
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    if (typeFilter) params.append("type", typeFilter);
    return `/api/admin-apis/transactions?${params}`;
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const transactions = data?.transactions ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    { key: "reference", label: "Reference" },
    {
      key: "type",
      label: "Type",
      render: (v) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-primary)">
          {String(v ?? "—")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v) => (
        <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>
      ),
    },
    {
      key: "fee",
      label: "App Fee",
      render: (_v, row) => {
        const { appFee } = extractTransactionFees(row);
        return (
          <span className="text-[--color-lemon-green]">
            {formatCurrency(appFee)}
          </span>
        );
      },
    },
    {
      key: "nomba_fee",
      label: "Nomba Fee",
      render: (_v, row) => {
        const { nombaFee } = extractTransactionFees(row);
        return (
          <span className="text-destructive">{formatCurrency(nombaFee)}</span>
        );
      },
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
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
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
        <div className="p-6 text-destructive">
          Failed to load transactions ❌
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Transactions
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Volume"
            value={formatCurrency(stats.totalVolume ?? 0)}
            icon="⇄"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="App Revenue"
            value={formatCurrency(stats.appRevenue ?? 0)}
            icon="◎"
            subtitle="Platform cut"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Nomba Fees"
            value={formatCurrency(stats.nombaFees ?? 0)}
            icon="◫"
            subtitle="Provider cost"
            className="border-l-4 border-l-destructive"
          />
          <KPICard
            title="Successful"
            value={formatNumber(stats.successful ?? 0)}
            icon="✓"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by reference or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
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
