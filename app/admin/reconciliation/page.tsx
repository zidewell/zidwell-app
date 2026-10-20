// app/admin/reconciliation/page.tsx
"use client";

import React, { useState } from "react";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/app/lib/dashboard-utils";
import Swal from "sweetalert2";

export default function ReconciliationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runReconciliation = async () => {
    const confirm = await Swal.fire({
      title: "Run reconciliation?",
      text: "This will compare Zidwell wallet balances against Nomba balances.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Run",
      confirmButtonColor: "#FDC020",
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin-apis/wallets/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setResult(json);
      Swal.fire("Done", "Reconciliation completed.", "success");
    } catch {
      Swal.fire("Error", "Reconciliation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !result) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
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
          <Button
            variant="outline"
            onClick={runReconciliation}
            disabled={loading}
            className="disabled:opacity-50"
          >
            {loading ? "Reconciling..." : "🔄 Run Reconciliation"}
          </Button>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Zidwell Balance"
              value={formatCurrency(result.summary?.totalSystemBalance ?? 0)}
              icon="◎"
              className="border-l-4 border-l-[--color-lemon-green]"
            />
            <KPICard
              title="Nomba Balance"
              value={formatCurrency(result.summary?.totalGatewayBalance ?? 0)}
              icon="◫"
              className="border-l-4 border-l-[--color-accent-yellow]"
            />
            <KPICard
              title="Difference"
              value={formatCurrency(result.summary?.totalDifference ?? 0)}
              icon="⇄"
              className="border-l-4 border-l-destructive"
            />
            <KPICard
              title="Matched %"
              value={`${(
                result.summary?.totalSystemBalance && result.summary?.totalGatewayBalance
                  ? Math.min(
                      (result.summary.totalGatewayBalance ?? 0) /
                        (result.summary.totalSystemBalance ?? 1),
                      1
                    ) * 100
                  : 0
              ).toFixed(1)}%`}
              icon="◆"
            />
          </div>
        )}

        {result && result.discrepancies && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Discrepancies Found: {result.discrepanciesFound ?? 0}
            </h3>
            <AdminTable
              columns={[
                { key: "user_email", label: "User Email" },
                { key: "system_balance", label: "System Balance" },
                { key: "gateway_balance", label: "Gateway Balance" },
                { key: "difference", label: "Difference" },
                { key: "status", label: "Status" },
              ]}
              rows={result.discrepancies}
              emptyMessage="No discrepancies found"
            />
          </div>
        )}

        {!result && (
          <div className="text-center py-8">
            <p className="text-(--text-secondary)">
              Click &quot;Run Reconciliation&quot; to compare wallet balances between Zidwell and
              Nomba systems.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}