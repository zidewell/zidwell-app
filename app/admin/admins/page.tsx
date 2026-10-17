// app/admin/admins/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";
import Swal from "sweetalert2";

export default function AdminsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (roleFilter) params.append("role", roleFilter);
    return `/api/admin-apis/admins?${params}`;
  }, [page, debouncedSearch, roleFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const admins = data?.admins ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const handleDelete = async (row: any) => {
    const result = await Swal.fire({
      title: "Remove admin?",
      text: `Remove ${row.email} from admin panel?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin-apis/admins/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      Swal.fire("Error", "Failed to remove admin", "error");
    }
  };

  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (_v: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.full_name ?? "—"}</span>
          <span className="text-xs text-(--text-secondary)">{row.email}</span>
        </div>
      ),
    },
    {
      key: "admin_role",
      label: "Role",
      render: (v: any) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]">
          ★ {String(v ?? "—").replace(/_/g, " ")}
        </span>
      ),
    },
    { key: "last_login", label: "Last Login" },
    { key: "created_at", label: "Added" },
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
        <div className="p-6 text-destructive">Failed to load admins ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Admin Management
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Admins" value={formatNumber(stats.total ?? total)} icon="★" />
          <KPICard title="Super Admins" value={formatNumber(stats.superAdmins ?? 0)} icon="◆" />
          <KPICard title="Active Today" value={formatNumber(stats.activeToday ?? 0)} icon="●" />
          <KPICard title="All Roles" value={formatNumber(stats.roles ?? 0)} icon="◈" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full md:w-48 squircle-md"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="operations_admin">Operations</option>
            <option value="finance_admin">Finance</option>
            <option value="support_admin">Support</option>
            <option value="legal_admin">Legal</option>
            <option value="blog_admin">Blog</option>
          </select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {admins.length} of {total} admins
        </div>

        <AdminTable
          columns={columns}
          rows={admins}
          onDelete={handleDelete}
          onViewLoginHistory={(row: any) => {
            window.location.href = `/api/admin-apis/admins/${row.id}/login-activity`;
          }}
          emptyMessage="No admins found"
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