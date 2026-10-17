// app/admin/users/page.tsx
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
import { Select } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatCurrency, formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";
import Swal from "sweetalert2";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    if (roleFilter) params.append("role", roleFilter);
    return `/api/admin-apis/users?${params}`;
  }, [page, debouncedSearch, statusFilter, roleFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter]);

  const users = data?.users ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns: AdminTableColumn[] = [
    {
      key: "full_name",
      label: "Name",
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.full_name ?? "—"}</span>
          <span className="text-xs text-(--text-secondary)">{row.email}</span>
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    {
      key: "wallet_balance",
      label: "Wallet",
      render: (v) => (
        <span className="font-medium">{formatCurrency(Number(v) || 0)}</span>
      ),
    },
    {
      key: "bvn_verification",
      label: "BVN",
      render: (v) => {
        const status = String(v ?? "not_submitted");
        const cls =
          status === "verified" || status === "approved"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : status === "pending"
              ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
              : "bg-(--bg-secondary) text-(--text-secondary)";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            ● {status}
          </span>
        );
      },
    },
    {
      key: "is_blocked",
      label: "Blocked",
      render: (v) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive">
            ✗ Blocked
          </span>
        ) : (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green]">
            ✓ Active
          </span>
        ),
    },
    { key: "created_at", label: "Joined" },
  ];

  const handleBlockToggle = async (row: any) => {
    const isBlocked = row.is_blocked;
    const result = await Swal.fire({
      title: isBlocked ? "Unblock user?" : "Block user?",
      text: isBlocked
        ? `Unblock ${row.email}?`
        : `Block ${row.email}? They will not be able to transact.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isBlocked ? "Unblock" : "Block",
      confirmButtonColor: isBlocked ? "#00B64F" : "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !isBlocked }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to update user", "error");
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

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-destructive">Failed to load users ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Users
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Users"
            value={formatNumber(stats.total ?? total)}
            icon="◉"
          />
          <KPICard
            title="Verified"
            value={formatNumber(stats.verified ?? 0)}
            icon="✓"
          />
          <KPICard
            title="Pending KYC"
            value={formatNumber(stats.pending ?? 0)}
            icon="⏳"
          />
          <KPICard
            title="Blocked"
            value={formatNumber(stats.blocked ?? 0)}
            icon="🚫"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="operations_admin">Operations</option>
            <option value="finance_admin">Finance</option>
            <option value="support_admin">Support</option>
            <option value="legal_admin">Legal</option>
            <option value="blog_admin">Blog</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {users.length} of {total} users
        </div>

        <AdminTable
          columns={columns}
          rows={users}
          onBlockToggle={handleBlockToggle}
          onRowClick={(row) => {
            window.location.href = `/admin/transactions/user/${row.id}`;
          }}
          emptyMessage="No users found"
        />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
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
