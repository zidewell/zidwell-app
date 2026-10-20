// app/admin/online-stores/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";

export default function OnlineStoresPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (appliedSearch) params.append("search", appliedSearch);
    if (statusFilter) params.append("status", statusFilter);
    return `/api/admin-apis/online-stores?${params}`;
  }, [page, appliedSearch, statusFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, statusFilter]);

  const stores = data?.stores ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / 20) || 1);
  const stats = data?.stats ?? {};

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const columns = [
    {
      key: "name",
      label: "Store",
      render: (_v: any, row: any) => (
        <div className="flex items-center gap-3 min-w-0 py-1">
          {row.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.logo_url}
              alt={row.name}
              className="w-9 h-9 squircle-sm object-cover border border-(--border-color) shrink-0"
            />
          ) : (
            <div className="w-9 h-9 squircle-sm bg-(--bg-secondary) flex items-center justify-center text-(--text-secondary) shrink-0 text-sm font-medium">
              {(row.name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="font-medium text-sm truncate">
              {row.name ?? "—"}
            </span>
            <span className="text-xs text-(--text-secondary) truncate">
              {row.owner_email ?? "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (_v: any, row: any) => (
        <span className="text-sm whitespace-nowrap">
          {[row.city, row.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (_v: any, row: any) => {
        if (!row.activation_paid) {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-[--color-accent-yellow]/15 text-[--color-accent-yellow] whitespace-nowrap">
              ⏳ Pending
            </span>
          );
        }
        if (row.is_active) {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
              ✓ Active
            </span>
          );
        }
        return (
          <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-secondary) whitespace-nowrap">
            ● Inactive
          </span>
        );
      },
    },
    {
      key: "available_balance",
      label: "Available",
      render: (v: any) => (
        <span className="font-medium text-sm whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "pending_balance",
      label: "Pending",
      render: (v: any) => (
        <span className="text-sm text-[--color-accent-yellow] whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "total_earned",
      label: "Earned",
      render: (v: any) => (
        <span className="text-sm text-[--color-lemon-green] whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "live_order_count",
      label: "Orders",
      render: (v: any) => (
        <span className="text-sm whitespace-nowrap">
          {formatNumber(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "page_count",
      label: "Pages",
      render: (v: any) => (
        <span className="text-sm whitespace-nowrap">
          {formatNumber(Number(v) || 0)}
        </span>
      ),
    },
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
        <div className="p-6 text-destructive">Failed to load stores ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Online Stores
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* ✅ Fixed grid: 1→2→3→5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-5">
          <KPICard
            title="Total Stores"
            value={formatNumber(stats.total ?? total)}
            icon="🏪"
          />
          <KPICard
            title="Active"
            value={formatNumber(stats.active ?? 0)}
            icon="✓"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Pending Activation"
            value={formatNumber(stats.pendingActivation ?? 0)}
            icon="⏳"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Available Balances"
            value={formatCurrency(stats.totalAvailableBalance ?? 0)}
            icon="◫"
            subtitle="Across all stores"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Total Earned"
            value={formatCurrency(stats.totalEarned ?? 0)}
            icon="◎"
            subtitle="Lifetime"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by store name, slug, city, or state..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending_activation">Pending Activation</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {stores.length} of {total} stores
        </div>

        <AdminTable
          columns={columns}
          rows={stores}
          onRowClick={(row) => {
            window.location.href = `/admin/online-stores/${row.id}`;
          }}
          emptyMessage="No stores found"
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