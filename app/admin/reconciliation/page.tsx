// app/admin/reconciliation/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable, { AdminTableColumn } from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import Swal from "sweetalert2";

export default function ReconciliationPage() {
  const [running, setRunning] = useState(false);

  const apiUrl = useMemo(
    () => `/api/admin-apis/wallets/reconcile?includeStats=true`,
    []
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  const handleRunReconcile = async () => {
    const result = await Swal.fire({
      title: "Run reconciliation?",
      text: "This will compare Zidwell wallet balances against Nomba balances.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Run",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;
    setRunning(true);
    try {
      const res = await fetch("/api/admin-apis/wallets/reconcile", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      await mutate();
      Swal.fire("Done", "Reconciliation completed.", "success");
    } catch {
      Swal.fire("Error", "Reconciliation failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const records = data?.reconciliations ?? data?.data ?? [];
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    { key: "reference", label: "Reference" },
    { key: "created_at", label: "Date" },
    {
      key: "expected_amount",
      label: "Expected",
      render: (v) => formatCurrency(Number(v) || 0),
    },
    {
      key: "actual_amount",
      label: "Actual",
      render: (v) => formatCurrency(Number(v) || 0),
    },
    {
      key: "difference",
      label: "Difference",
      render: (v) => {
        const diff = Number(v) || 0;
        return (
          <span className={diff === 0 ? "text-[--color-lemon-green]" : "text-destructive"}>
            {formatCurrency(diff)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const s = String(v ?? "matched");
        const cls =
          s === "matched"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : "bg-destructive/15 text-destructive";
        return <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {s}</span>;
      },
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
        <div className="p-6 text-destructive">Failed to load reconciliation ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Reconciliation
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button
              onClick={handleRunReconcile}
              disabled={running}
              className="bg-[--color-accent-yellow] text-(--color-ink)"
            >
              {running ? "Running..." : "⇌ Run Reconciliation"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Zidwell Balance"
            value={formatCurrency(stats.zidwellBalance ?? 0)}
            icon="◫"
          />
          <KPICard
            title="Nomba Balance"
            value={formatCurrency(stats.nombaBalance ?? 0)}
            icon="◎"
          />
          <KPICard
            title="Difference"
            value={formatCurrency(stats.difference ?? 0)}
            icon="⇌"
            className={
              (stats.difference ?? 0) === 0
                ? "border-l-4 border-l-[--color-lemon-green]"
                : "border-l-4 border-l-destructive"
            }
          />
          <KPICard
            title="Matched"
            value={`${stats.matchedPercent ?? 0}%`}
            icon="✓"
          />
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {records.length} reconciliation records
        </div>

        <AdminTable columns={columns} rows={records} emptyMessage="No reconciliation records found" />
      </div>
    </AdminLayout>
  );
}
