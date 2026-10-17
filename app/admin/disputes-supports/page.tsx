// app/admin/disputes-supports/page.tsx
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

export default function DisputesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    if (priorityFilter) params.append("priority", priorityFilter);
    return `/api/admin-apis/disputes?${params}`;
  }, [page, debouncedSearch, statusFilter, priorityFilter]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter]);

  const tickets = data?.tickets ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const columns = [
    { key: "ticket_id", label: "Ticket ID" },
    { key: "subject", label: "Subject" },
    { key: "user_email", label: "User" },
    {
      key: "priority",
      label: "Priority",
      render: (v: any) => {
        const p = String(v ?? "medium");
        const cls =
          p === "urgent" || p === "high"
            ? "bg-destructive/15 text-destructive"
            : p === "medium"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>● {p}</span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "open");
        const cls =
          s === "resolved" || s === "closed"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "open" || s === "in_progress"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        const icon = s === "resolved" || s === "closed" ? "✓" : "⏳";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    { key: "created_at", label: "Opened" },
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
        <div className="p-6 text-destructive">Failed to load disputes ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Disputes &amp; Support
          </h2>
          <Button variant="outline" onClick={() => mutate()}>
            🔄 Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Tickets" value={formatNumber(stats.total ?? total)} icon="⚑" />
          <KPICard title="Open" value={formatNumber(stats.open ?? 0)} icon="●" />
          <KPICard title="In Progress" value={formatNumber(stats.inProgress ?? 0)} icon="⏳" />
          <KPICard title="Resolved" value={formatNumber(stats.resolved ?? 0)} icon="✓" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by ticket ID or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48 squircle-md"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_response">Awaiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input w-full md:w-48 squircle-md"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {tickets.length} of {total} tickets
        </div>

        <AdminTable
          columns={columns}
          rows={tickets}
          onRowClick={(row: any) => {
            window.location.href = `/admin/disputes-supports/${row.id}`;
          }}
          emptyMessage="No dispute tickets found"
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