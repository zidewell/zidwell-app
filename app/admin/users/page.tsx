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
import { resolveFullName } from "@/lib/resolve-name"; 
import Swal from "sweetalert2";

type UserCategory = "all" | "verified" | "unverified" | "pending_kyc";

const CATEGORY_LABELS: Record<UserCategory, string> = {
  all: "All Users",
  verified: "Verified",
  unverified: "Unverified",
  pending_kyc: "Pending KYC",
};

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<UserCategory>("all");
  const [roleFilter, setRoleFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
      category,
    });
    if (appliedSearch) params.append("search", appliedSearch);
    if (roleFilter) params.append("role", roleFilter);
    return `/api/admin-apis/users?${params}`;
  }, [page, appliedSearch, category, roleFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, category, roleFilter]);

  const users = data?.users ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isBlocked ? "unblock" : "block",
          reason: isBlocked ? null : "Blocked from admin panel",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to update user", "error");
    }
  };

  const handleDelete = async (row: any) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: `Permanently delete ${row.email}? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const handleForceLogout = async (row: any) => {
    const result = await Swal.fire({
      title: "Force logout?",
      text: `Force ${row.email} to log out from all sessions?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Force Logout",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/users/${row.id}/force-logout`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      Swal.fire("Done", "User has been logged out.", "success");
    } catch {
      Swal.fire("Error", "Failed to force logout", "error");
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: "full_name",
      label: "Name",
      render: (_v, row) => {
        const name = resolveFullName(row);
        const hasName = name !== "—";
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{name}</span>
            <span className="text-xs text-(--text-secondary) truncate">
              {row.email ?? "—"}
            </span>
            {!hasName && (
              <span className="mt-1 inline-flex w-fit squircle-sm px-2 py-0.5 text-[10px] font-medium bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]">
                ⚠ Profile incomplete
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (v) => <span className="whitespace-nowrap">{v ?? "—"}</span>,
    },
    {
      key: "wallet_balance",
      label: "Wallet",
      render: (v) => (
        <span className="font-medium whitespace-nowrap">
          {formatCurrency(Number(v) || 0)}
        </span>
      ),
    },
    {
      key: "email_verified",
      label: "Email",
      render: (v: any) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
            ✓ Verified
          </span>
        ) : (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive whitespace-nowrap">
            ✗ Unverified
          </span>
        ),
    },
    {
      key: "kyc_status",
      label: "KYC",
      render: (v: any) => {
        const status = String(v ?? "pending");
        const cls =
          status === "verified"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : status === "pending"
              ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
              : "bg-(--bg-secondary) text-(--text-secondary)";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls} whitespace-nowrap`}>
            ● {status}
          </span>
        );
      },
    },
    {
      key: "is_blocked",
      label: "Status",
      render: (v) =>
        v ? (
          <span className="squircle-sm px-2 py-1 text-xs bg-destructive/15 text-destructive whitespace-nowrap">
            ✗ Blocked
          </span>
        ) : (
          <span className="squircle-sm px-2 py-1 text-xs bg-[--color-lemon-green]/15 text-[--color-lemon-green] whitespace-nowrap">
            ✓ Active
          </span>
        ),
    },
    { key: "created_at", label: "Joined" },
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
        <div className="p-6 text-destructive">Failed to load users ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Users
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        {/* ✅ Fixed grid: 1→2→4, generous gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <button
            onClick={() => setCategory("all")}
            className="text-left"
            aria-pressed={category === "all"}
          >
            <KPICard
              title="All Users"
              value={formatNumber(stats.total ?? total)}
              icon="◉"
              className={
                category === "all"
                  ? "border-l-4 border-l-[--color-accent-yellow] ring-2 ring-[--color-accent-yellow]/40"
                  : "border-l-4 border-l-[--color-accent-yellow]"
              }
            />
          </button>
          <button
            onClick={() => setCategory("verified")}
            className="text-left"
            aria-pressed={category === "verified"}
          >
            <KPICard
              title="Verified"
              value={formatNumber(stats.verified ?? 0)}
              icon="✓"
              className={
                category === "verified"
                  ? "border-l-4 border-l-[--color-lemon-green] ring-2 ring-[--color-lemon-green]/40"
                  : "border-l-4 border-l-[--color-lemon-green]"
              }
            />
          </button>
          <button
            onClick={() => setCategory("unverified")}
            className="text-left"
            aria-pressed={category === "unverified"}
          >
            <KPICard
              title="Unverified"
              value={formatNumber(stats.unverified ?? 0)}
              icon="✗"
              className={
                category === "unverified"
                  ? "border-l-4 border-l-destructive ring-2 ring-destructive/40"
                  : "border-l-4 border-l-destructive"
              }
            />
          </button>
          <button
            onClick={() => setCategory("pending_kyc")}
            className="text-left"
            aria-pressed={category === "pending_kyc"}
          >
            <KPICard
              title="Pending KYC"
              value={formatNumber(stats.pendingKyc ?? 0)}
              icon="⏳"
              className={
                category === "pending_kyc"
                  ? "border-l-4 border-l-[--color-accent-yellow] ring-2 ring-[--color-accent-yellow]/40"
                  : "border-l-4 border-l-[--color-accent-yellow]"
              }
            />
          </button>
        </div>

        <div className="text-xs text-(--text-secondary) leading-relaxed break-words">
          Showing:{" "}
          <span className="font-medium text-(--text-primary)">
            {CATEGORY_LABELS[category]}
          </span>
          {" — "}Unverified users have not confirmed their email. Pending KYC
          users have no bank account on file.
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
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as UserCategory)}
          >
            <option value="all">All Categories</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="pending_kyc">Pending KYC</option>
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
          onDelete={handleDelete}
          onForceLogout={handleForceLogout}
          onViewDetails={(row) => {
            window.location.href = `/admin/transactions/user/${row.id}`;
          }}
          emptyMessage="No users found"
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