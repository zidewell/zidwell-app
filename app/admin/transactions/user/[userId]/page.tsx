// app/admin/transactions/user/[userId]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";

function extractTransactionFees(tx: any): { appFee: number; nombaFee: number } {
  if (!tx.external_response) return { appFee: 0, nombaFee: 0 };
  try {
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
  } catch {
    // ignore malformed JSON
  }
  return { appFee: 0, nombaFee: 0 };
}

export default function UserTransactionsPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [page, setPage] = useState(1);

  const apiUrl = useMemo(() => {
    if (!userId) return null;
    const p = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    return `/api/admin-apis/users/${userId}/transactions?${p}`;
  }, [userId, page]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  const transactions = data?.transactions ?? data?.data ?? [];
  const total = data?.total ?? data?.pagination?.totalItems ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns = [
    { key: "reference", label: "Reference" },
    { key: "type", label: "Type" },
    {
      key: "amount",
      label: "Amount",
      render: (v: any) => (
        <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>
      ),
    },
    {
      key: "fee",
      label: "App Fee",
      render: (_v: any, row: any) => {
        const { appFee } = extractTransactionFees(row);
        return (
          <span className="text-[--color-lemon-green]">
            {formatCurrency(appFee)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "success"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-destructive/15 text-destructive";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>
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
          Failed to load user transactions ❌
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              User Transactions
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              User ID: {userId}
            </p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Transactions"
            value={formatNumber(stats.total ?? total)}
            icon="⇄"
          />
          <KPICard
            title="Total Volume"
            value={formatCurrency(stats.totalVolume ?? 0)}
            icon="◎"
          />
          <KPICard
            title="App Fees"
            value={formatCurrency(stats.appFees ?? 0)}
            icon="◫"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Successful"
            value={formatNumber(stats.successful ?? 0)}
            icon="✓"
          />
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {transactions.length} of {total} transactions
        </div>

        <AdminTable
          columns={columns}
          rows={transactions}
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