// app/admin/tax-filings/page.tsx
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
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function TaxFilingsPage() {
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
    if (typeFilter) params.append("filing_type", typeFilter);
    return `/api/admin-apis/tax-filings?${params}`;
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

  const filings = data?.filings ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    {
      key: "first_name",
      label: "Taxpayer",
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.first_name} {row.last_name}
          </span>
          <span className="text-xs text-(--text-secondary)">{row.company_name ?? "Individual"}</span>
        </div>
      ),
    },
    { key: "filing_type", label: "Type" },
    { key: "tax_year", label: "Year" },
    {
      key: "income_amount",
      label: "Income",
      render: (v) => formatCurrency(Number(v) || 0),
    },
    {
      key: "tax_amount",
      label: "Tax",
      render: (v) => (
        <span className="font-medium text-[--color-accent-yellow]">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "pending");
        const cls =
          s === "approved"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending" || s === "submitted"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        const icon = s === "approved" ? "✓" : s === "rejected" ? "✗" : "⏳";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    { key: "created_at", label: "Filed" },
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
        <div className="p-6 text-destructive">Failed to load tax filings ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Tax Filings
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Filings" value={formatNumber(stats.total ?? total)} icon="◈" />
          <KPICard title="Approved" value={formatNumber(stats.approved ?? 0)} icon="✓" />
          <KPICard title="Pending" value={formatNumber(stats.pending ?? 0)} icon="⏳" />
          <KPICard
            title="Total Tax"
            value={formatCurrency(stats.totalTax ?? 0)}
            icon="◎"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name or NIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="corporate">Corporate</option>
            <option value="vat">VAT</option>
            <option value="withholding">Withholding</option>
            <option value="paye">PAYE</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {filings.length} of {total} filings
        </div>

        <AdminTable
          columns={columns}
          rows={filings}
          onRowClick={(row) => {
            window.location.href = `/api/admin-apis/tax-filings/${row.id}`;
          }}
          emptyMessage="No tax filings found"
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
