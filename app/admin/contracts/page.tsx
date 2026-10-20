// app/admin/contracts/page.tsx
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
import { formatNumber } from "@/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function ContractsPage() {
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
    return `/api/admin-apis/contracts?${params}`;
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

  const contracts = data?.contracts ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    { key: "contract_title", label: "Title" },
    { key: "initiator_name", label: "Initiator" },
    { key: "signee_name", label: "Signee" },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "pending");
        const cls =
          s === "signed" || s === "completed"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        const icon = s === "signed" || s === "completed" ? "✓" : s === "pending" ? "⏳" : "✗";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    {
      key: "fraud_flag",
      label: "Fraud",
      render: (v) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive">
            ⚑ Flagged
          </span>
        ) : (
          <span className="text-(--text-secondary)">—</span>
        ),
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
        <div className="p-6 text-destructive">Failed to load contracts ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Contracts
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total" value={formatNumber(stats.total ?? total)} icon="✎" />
          <KPICard title="Signed" value={formatNumber(stats.signed ?? 0)} icon="✓" />
          <KPICard title="Pending" value={formatNumber(stats.pending ?? 0)} icon="⏳" />
          <KPICard title="Flagged" value={formatNumber(stats.flagged ?? 0)} icon="⚑" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by title or email..."
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
            <option value="pending">Pending</option>
            <option value="issued">Issued</option>
            <option value="signed">Signed</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {contracts.length} of {total} contracts
        </div>

        <AdminTable
          columns={columns}
          rows={contracts}
          onRowClick={(row) => {
            window.location.href = `/admin/contracts/${row.id}`;
          }}
          emptyMessage="No contracts found"
        />

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
