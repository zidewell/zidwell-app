// app/admin/notifications/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import RichTextEditor from "@/app/components/admin-components/RichTextEditor";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";
import Swal from "sweetalert2";

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    target_audience: "all_users",
    channels: ["in_app"] as string[],
    is_urgent: false,
  });

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      includeStats: "true",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (statusFilter) params.append("status", statusFilter);
    return `/api/admin-apis/notifications?${params}`;
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

  const notifications = data?.notifications ?? data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;
  const stats = data?.stats ?? {};

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      Swal.fire("Missing fields", "Title and message are required.", "warning");
      return;
    }
    const result = await Swal.fire({
      title: "Send notification?",
      text: `This will send to ${form.target_audience.replace(/_/g, " ")}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send",
      confirmButtonColor: "#FDC020",
    });
    if (!result.isConfirmed) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin-apis/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setShowCompose(false);
      setForm({
        title: "",
        message: "",
        type: "info",
        target_audience: "all_users",
        channels: ["in_app"],
        is_urgent: false,
      });
      mutate();
    } catch {
      Swal.fire("Error", "Failed to send notification", "error");
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "target_audience", label: "Audience" },
    {
      key: "status",
      label: "Status",
      render: (v: any) => {
        const s = String(v ?? "draft");
        const cls =
          s === "sent"
            ? "bg-[--color-lemon-green]/15 text-[--color-lemon-green]"
            : s === "scheduled" || s === "sending"
            ? "bg-[--color-accent-yellow]/15 text-[--color-accent-yellow]"
            : s === "failed"
            ? "bg-destructive/15 text-destructive"
            : "bg-(--bg-secondary) text-(--text-secondary)";
        const icon = s === "sent" ? "✓" : s === "failed" ? "✗" : "⏳";
        return (
          <span className={`squircle-sm px-2 py-1 text-xs ${cls}`}>
            {icon} {s}
          </span>
        );
      },
    },
    { key: "created_at", label: "Created" },
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
        <div className="p-6 text-destructive">Failed to load notifications ❌</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
            Notifications
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
            <Button
              onClick={() => setShowCompose(true)}
              className="bg-[--color-accent-yellow] text-(--color-ink)"
            >
              ✎ Compose
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Total Sent" value={formatNumber(stats.total ?? total)} icon="◆" />
          <KPICard title="Delivered" value={formatNumber(stats.delivered ?? 0)} icon="✓" />
          <KPICard title="Scheduled" value={formatNumber(stats.scheduled ?? 0)} icon="⏳" />
          <KPICard title="Failed" value={formatNumber(stats.failed ?? 0)} icon="✗" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by title..."
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
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </Select>
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {notifications.length} of {total} notifications
        </div>

        <AdminTable columns={columns} rows={notifications} emptyMessage="No notifications found" />

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

        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-(--font-space-grotesk) text-(--text-primary)">
                  Compose Notification
                </h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-(--text-secondary) hover:text-(--text-primary)"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <Input
                placeholder="Notification title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <RichTextEditor
                value={form.message}
                onChange={(v) => setForm({ ...form, message: v })}
                placeholder="Write your notification message..."
                height={220}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="contract">Contract</option>
                  <option value="wallet">Wallet</option>
                  <option value="transaction">Transaction</option>
                </Select>

                <Select
                  value={form.target_audience}
                  onValueChange={(v) => setForm({ ...form, target_audience: v })}
                >
                  <option value="all_users">All Users</option>
                  <option value="premium_users">Premium Users</option>
                  <option value="new_users">New Users</option>
                  <option value="inactive_users">Inactive Users</option>
                </Select>

                <label className="flex items-center gap-2 text-sm text-(--text-primary)">
                  <input
                    type="checkbox"
                    checked={form.is_urgent}
                    onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
                  />
                  Mark as urgent
                </label>

                <div className="flex justify-end gap-2 pt-2 md:col-span-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="bg-[--color-accent-yellow] text-(--color-ink)"
                  >
                    {sending ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}