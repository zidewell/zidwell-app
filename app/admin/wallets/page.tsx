// app/admin/wallets/page.tsx
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
import { resolveFullName, hasRealName } from "@/lib/resolve-name"; 

export default function WalletsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [balanceFilter, setBalanceFilter] = useState("all");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (appliedSearch) params.append("search", appliedSearch);
    if (balanceFilter && balanceFilter !== "all")
      params.append("balance", balanceFilter);
    return `/api/admin-apis/wallets?${params}`;
  }, [page, appliedSearch, balanceFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, balanceFilter]);

  const wallets = data?.wallets ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? (Math.ceil(total / 20) || 1);
  const stats = data?.stats ?? {};

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const columns = [
    {
      key: "email",
      label: "User",
      render: (_v: any, row: any) => (
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate">{resolveFullName(row)}</span>
          <span className="text-xs text-(--text-secondary) truncate">
            {row.email ?? row.user_email ?? "—"}
          </span>
          {!hasRealName(row) && (
            <span className="mt-1 inline-flex w-fit squircle-sm px-2 py-0.5 text-[10px] font-medium bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]">
              ⚠ Profile incomplete
            </span>
          )}
        </div>
      ),
    },
    {
      key: "wallet_balance",
      label: "Balance",
      render: (v: any, row: any) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(Number(row.wallet_balance ?? row.balance ?? v) || 0)}
        </span>
      ),
    },
    {
      key: "zidcoin_balance",
      label: "Zidcoin",
      render: (v: any) => (
        <span className="whitespace-nowrap">
          {formatNumber(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_v: any, row: any) => {
        const status = row.status ?? "unknown";
        if (status === "unknown") {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-secondary) whitespace-nowrap">
              — Unknown
            </span>
          );
        }
        if (status === "blocked") {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive whitespace-nowrap">
              ✗ Blocked
            </span>
          );
        }
        if (status === "frozen") {
          return (
            <span className="squircle-sm px-2 py-1 text-xs bg-[--color-accent-yellow]/15 text-[--color-accent-yellow] whitespace-nowrap">
              ❄ Frozen
            </span>
          );
        }
        return (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
            ✓ Active
          </span>
        );
      },
    },
    {
      key: "last_updated",
      label: "Last Updated",
      render: (v: any) => (
        <span className="whitespace-nowrap">
          {v ? new Date(v).toLocaleString("en-GB") : "—"}
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
        <div className="p-6 text-destructive">Failed to load wallets ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Wallets
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* ✅ Fixed grid: 1→2→3→5 across breakpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-5">
          <KPICard
            title="Total Balance"
            value={formatCurrency(stats.totalBalance ?? 0)}
            icon="◫"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Active"
            value={formatNumber(stats.active ?? 0)}
            icon="✓"
          />
          <KPICard
            title="Frozen"
            value={formatNumber(stats.frozen ?? 0)}
            icon="❄"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Blocked"
            value={formatNumber(stats.blocked ?? 0)}
            icon="✗"
            className="border-l-4 border-l-destructive"
          />
          <KPICard
            title="Nomba Balance"
            value={formatCurrency(stats.nombaBalance ?? 0)}
            icon="◎"
            subtitle="Provider balance"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by name or email..."
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
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <option value="all">All Balances</option>
            <option value="high">High (≥ ₦10,000)</option>
            <option value="medium">Medium (₦1,000 – ₦10,000)</option>
            <option value="low">Low (₦1 – ₦1,000)</option>
            <option value="zero">Zero</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {wallets.length} of {total} wallets
        </div>

        <AdminTable
          columns={columns}
          rows={wallets}
          emptyMessage="No wallets found"
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
