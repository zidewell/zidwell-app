// app/admin/invoices/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable, { AdminTableColumn } = "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } = "@/app/components/ui/input";
import { Select } = "@/app/components/ui/select";
import { Button } = "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } = "@/lib/dashboard-utils";
import { useDebounce } = "@/app/lib/hooks/useDebounce";

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (searchTerm) params.append("search", searchTerm);
    if (statusFilter) params.append("status", statusFilter);
    return `/api/admin-apis/invoices?${params}`;
  }, [page, searchTerm, statusFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const invoices = data?.invoices ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    { key: "invoice_id", label: "Invoice ID" },
    { key: "business_name", label: "Business" },
    { key: "client_name", label: "Client" },
    {
      key: "total_amount",
      label: "Total",
      render: (v) => <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>,
    },
    {
      key: "paid_amount",
      label: "Paid",
      render: (v) => (
        <span className="text-[--color-lemon-green]">{formatCurrency(Number(v) || 0)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "unpaid");
        const cls =
          s === "paid"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "unpaid" || s === "partially_paid"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : s === "overdue" || s === "cancelled"
            ? "bg-destructive/15 text-destructive"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        const icon = s === "paid" ? "✓" : s === "overdue" ? "✗" : "⏳";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    { key: "issue_date", label: "Issued" },
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
        <div className="p-6 text-destructive">Failed to load invoices ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Invoices
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4>
          <KPICard title="Total Invoices" value={formatNumber(stats.total ?? total)} icon="▤" />
          <KPICard title="Paid" value={formatNumber(stats.paid ?? 0)} icon="✓" />
          <KPICard title="Overdue" value={formatNumber(stats.overdue ?? 0)} icon="✗" />
          <KPICard
            title="Total Value"
            value={formatCurrency(stats.totalValue ?? 0)}
            icon="◎"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4>
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by invoice ID or client..."
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="partially_paid">Partially Paid</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {invoices.length} of {total} invoices
        </div>

        <AdminTable columns={columns} rows={invoices} emptyMessage="No invoices found" />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2>
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
