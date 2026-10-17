// app/admin/contracts/[id]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher"; 
import Swal from "sweetalert2";

export default function ContractDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [updating, setUpdating] = useState(false);

  const apiUrl = useMemo(
    () => (id ? `/api/admin-apis/contracts/${id}` : null),
    [id],
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
  });

  const handleFlag = async () => {
    const result = await Swal.fire({
      title: data?.fraud_flag
        ? "Remove fraud flag?"
        : "Flag contract as fraud?",
      text: data?.fraud_flag
        ? "This will remove the fraud flag from this contract."
        : "This will mark the contract as potentially fraudulent.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: data?.fraud_flag ? "Unflag" : "Flag",
      confirmButtonColor: data?.fraud_flag ? "#00B64F" : "#dc2626",
    });
    if (!result.isConfirmed) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin-apis/contracts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          fraud_flag: !data?.fraud_flag,
          fraud_reason: data?.fraud_flag ? null : "Flagged by admin",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await mutate();
    } catch {
      Swal.fire("Error", "Failed to update contract", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">Failed to load contract ❌</div>
      </AdminLayout>
    );
  }

  const contract = data?.contract ?? data;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              {contract.contract_title ?? "Contract"}
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              Token: {contract.token}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button
              onClick={handleFlag}
              disabled={updating}
              className={
                contract.fraud_flag
                  ? "bg-[--color-lemon-green] text-white"
                  : "bg-destructive text-white"
              }
            >
              {contract.fraud_flag ? "✓ Unflag" : "⚑ Flag Fraud"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Status"
            value={contract.status ?? "pending"}
            className={
              contract.status === "signed" || contract.status === "completed"
                ? "border-l-4 border-l-[--color-lemon-green]"
                : "border-l-4 border-l-[--color-accent-yellow]"
            }
          />
          <KPICard title="Initiator" value={contract.initiator_name ?? "—"} />
          <KPICard title="Signee" value={contract.signee_name ?? "—"} />
          <KPICard
            title="Fraud Flag"
            value={contract.fraud_flag ? "Flagged" : "Clear"}
            className={
              contract.fraud_flag
                ? "border-l-4 border-l-destructive"
                : "border-l-4 border-l-[--color-lemon-green]"
            }
          />
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
            Contract Body
          </p>
          <div className="prose prose-sm max-w-none text-(--text-primary) whitespace-pre-wrap">
            {contract.contract_text ?? "No contract text available."}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Initiator Details
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Name</dt>
                <dd>{contract.initiator_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Email</dt>
                <dd>{contract.initiator_email ?? "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-3">
              Signee Details
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Name</dt>
                <dd>{contract.signee_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Email</dt>
                <dd>{contract.signee_email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">NIN</dt>
                <dd>{contract.signee_nin ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
