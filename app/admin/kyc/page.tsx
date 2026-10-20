// app/admin/kyc/page.tsx
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
import { formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";
import Swal from "sweetalert2";

export default function KycPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    return `/api/admin-apis/kyc?${params}`;
  }, [page, debouncedSearch, statusFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const kycRecords = data?.kyc ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const handleApprove = async (row: any) => {
    const result = await Swal.fire({
      title: "Approve KYC?",
      text: `Approve KYC for ${row.user?.first_name ?? ""} ${row.user?.last_name ?? ""}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#00B64F",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to approve KYC", "error");
    }
  };

  const handleReject = async (row: any) => {
    const result = await Swal.fire({
      title: "Reject KYC?",
      text: `Reject KYC for ${row.user?.first_name ?? ""} ${row.user?.last_name ?? ""}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to reject KYC", "error");
    }
  };

  const columns = [
    {
      key: "first_name",
      label: "User",
      render: (_v: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.user?.first_name ?? "—"} {row.user?.last_name ?? ""}
          </span>
          <span className="text-xs text-(--text-secondary)">{row.user?.email ?? "—"}</span>
        </div>
      ),
    },
    { key: "nin", label: "NIN" },
    {
      key: "phone",
      label: "Phone",
      render: (_v: any, row: any) => row.user?.phone ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "pending");
        const cls =
          s === "approved"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "pending"
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
    { key: "created_at", label: "Submitted" },
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
        <div className="p-6 text-destructive">Failed to load KYC records ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            KYC Verification
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total" value={formatNumber(stats.total ?? total)} icon="✓" />
          <KPICard title="Pending" value={formatNumber(stats.pending ?? 0)} icon="⏳" />
          <KPICard title="Approved" value={formatNumber(stats.approved ?? 0)} icon="✓" />
          <KPICard title="Rejected" value={formatNumber(stats.rejected ?? 0)} icon="✗" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by name, email, or NIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setPage(1)} className="input squircle-md">
              🔍 Search
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {kycRecords.length} of {total} KYC records
        </div>

        <AdminTable
          columns={columns}
          rows={kycRecords}
          customActions={[
            {
              label: "Approve",
              onClick: handleApprove,
              className: "text-[--color-lemon-green]",
              icon: "✓",
            },
            {
              label: "Reject",
              onClick: handleReject,
              className: "text-destructive",
              icon: "✗",
            },
          ]}
          emptyMessage="No KYC records found"
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