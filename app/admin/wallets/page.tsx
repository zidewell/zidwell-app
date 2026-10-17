// app/admin/wallets/page.tsx
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
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function WalletsPage() {
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
    return `/api/admin-apis/wallets?${params}`;
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

  const wallets = data?.wallets ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    {
      key: "user_email",
      label: "User",
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.full_name ?? "—"}</span>
          <span className="text-xs text-(--text-secondary)">
            {row.user_email ?? row.email}
          </span>
        </div>
      ),
    },
    {
      key: "wallet_balance",
      label: "Balance",
      render: (v) => (
        <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>
      ),
    },
    {
      key: "zidcoin_balance",
      label: "Zidcoin",
      render: (v) => formatNumber(Number(v) || 0),
    },
    {
      key: "wallet_frozen",
      label: "Status",
      render: (v) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive">
            ❄ Frozen
          </span>
        ) : (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green]">
            ✓ Active
          </span>
        ),
    },
    { key: "updated_at", label: "Last Updated" },
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Wallets
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Balance"
            value={formatCurrency(stats.totalBalance ?? 0)}
            icon="◫"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Active Wallets"
            value={formatNumber(stats.active ?? 0)}
            icon="✓"
          />
          <KPICard
            title="Frozen"
            value={formatNumber(stats.frozen ?? 0)}
            icon="❄"
          />
          <KPICard
            title="Nomba Balance"
            value={formatCurrency(stats.nombaBalance ?? 0)}
            icon="◎"
            subtitle="Provider balance"
          />
        </div>

        <Input
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />

        <div className="text-sm text-(--text-secondary)">
          Showing {wallets.length} of {total} wallets
        </div>

        <AdminTable
          columns={columns}
          rows={wallets}
          emptyMessage="No wallets found"
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
