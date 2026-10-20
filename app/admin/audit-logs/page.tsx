// app/admin/audit-logs/page.tsx
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

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (actionFilter) params.append("action", actionFilter);
    if (resourceFilter) params.append("resourceType", resourceFilter);
    return `/api/admin-apis/audit-logs?${params}`;
  }, [page, debouncedSearch, actionFilter, resourceFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter, resourceFilter]);

  const logs = data?.logs ?? data?.data ?? [];
  const total = data?.total ?? data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns = [
    { key: "user_email", label: "Admin" },
    {
      key: "action",
      label: "Action",
      render: (v: any) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-primary)">
          {String(v ?? "—")}
        </span>
      ),
    },
    { key: "resource_type", label: "Resource" },
    { key: "resource_id", label: "Resource ID" },
    { key: "description", label: "Description" },
    { key: "created_at", label: "Timestamp" },
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
        <div className="p-6 text-destructive">Failed to load audit logs ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Audit Logs
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Events" value={formatNumber(stats.total ?? total)} icon="▤" />
          <KPICard title="Today" value={formatNumber(stats.today ?? 0)} icon="●" />
          <KPICard title="This Week" value={formatNumber(stats.week ?? 0)} icon="◆" />
          <KPICard title="Unique Admins" value={formatNumber(stats.uniqueAdmins ?? 0)} icon="★" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by description or admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setPage(1)} className="input squircle-md">
              🔍 Search
            </Button>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <option value="">All Resources</option>
            <option value="user">User</option>
            <option value="wallet">Wallet</option>
            <option value="transaction">Transaction</option>
            <option value="contract">Contract</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="kyc">KYC</option>
            <option value="notification">Notification</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {logs.length} of {total} audit logs
        </div>

        <AdminTable columns={columns} rows={logs} emptyMessage="No audit logs found" />

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