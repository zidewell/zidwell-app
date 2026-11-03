// app/admin/analytics/users/acquisition/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import AdminTable from "@/app/components/admin-components/AdminTable";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatNumber } from "@/app/lib/dashboard-utils";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export default function AcquisitionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    return `/api/admin-apis/analytics/acquisition?${params}`;
  }, [page, debouncedSearch]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const campaigns = data?.campaigns ?? [];
  const referralLeaderboard = data?.referralLeaderboard ?? [];
  const signups = data?.signups ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const signupColumns = [
    {
      key: "source",
      label: "Source",
      render: (v: any) => (
        <span className="squircle-sm px-2 py-1 text-xs bg-(--bg-secondary) text-(--text-primary) whitespace-nowrap">
          {v ?? "—"}
        </span>
      ),
    },
    { key: "medium", label: "Medium" },
    { key: "campaign", label: "Campaign" },
    { key: "landing_page", label: "Landing Page" },
    {
      key: "platform",
      label: "Platform",
      render: (v: any) => v ?? "—",
    },
    {
      key: "user_id",
      label: "User",
      render: (v: any) =>
        v ? (
          <Link
            href={`/admin/subscribers/${v}`}
            className="text-[--color-accent-yellow] hover:underline font-mono text-xs"
          >
            {String(v).slice(0, 8)}...
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "created_at", label: "Date" },
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
        <div className="p-6 text-destructive">
          Failed to load acquisition data ❌
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Acquisition Deep Dive
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              UTM campaigns, referral leaders, and raw signup events
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics/users">
              <Button variant="outline">← Back</Button>
            </Link>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard
            title="Total Signups Tracked"
            value={formatNumber(total)}
            icon="◉"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="Active Campaigns"
            value={formatNumber(campaigns.length)}
            icon="◆"
            className="border-l-4 border-l-[--color-lemon-green]"
          />
          <KPICard
            title="Top Referrers"
            value={formatNumber(referralLeaderboard.filter((r: any) => r.count > 0).length)}
            icon="★"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        {/* Campaigns table */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Campaign Performance
          </h3>
          {campaigns.length === 0 ? (
            <div className="text-sm text-(--text-secondary) py-4">
              No campaign data yet. UTM parameters will appear here once signup
              events start coming in.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border-color)">
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      Source
                    </th>
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      Medium
                    </th>
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      Campaign
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      Signups
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      Landing Pages
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-(--border-color) last:border-0"
                    >
                      <td className="py-2 px-2 text-(--text-primary) font-medium">
                        {c.source}
                      </td>
                      <td className="py-2 px-2 text-(--text-secondary)">
                        {c.medium}
                      </td>
                      <td className="py-2 px-2 text-(--text-secondary)">
                        {c.campaign}
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-primary) font-medium tabular-nums">
                        {formatNumber(c.count)}
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-secondary) tabular-nums">
                        {c.unique_landing_pages}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Referral leaderboard */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Referral Leaderboard (Top 20)
          </h3>
          {referralLeaderboard.length === 0 ? (
            <div className="text-sm text-(--text-secondary) py-4">
              No referrers yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border-color)">
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium w-12">
                      #
                    </th>
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      Referral Code
                    </th>
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      User
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      Signups Referred
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referralLeaderboard.map((r: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-(--border-color) last:border-0"
                    >
                      <td className="py-2 px-2 text-(--text-secondary) tabular-nums">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 font-mono text-xs text-(--text-primary)">
                        {r.referral_code}
                      </td>
                      <td className="py-2 px-2 text-(--text-secondary)">
                        {r.email}
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-primary) font-medium tabular-nums">
                        {formatNumber(r.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Raw signups */}
        <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft p-4">
          <label
            htmlFor="signup-search"
            className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5"
          >
            Search Signups
          </label>
          <Input
            id="signup-search"
            placeholder="Search by source, medium, campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="text-sm text-(--text-secondary)">
          Showing {signups.length} of {total} signup events
        </div>

        <AdminTable
          columns={signupColumns}
          rows={signups}
          emptyMessage="No signup events recorded yet"
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