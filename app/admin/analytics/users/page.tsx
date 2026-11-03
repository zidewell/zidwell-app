// app/admin/analytics/users/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import AdminLayout from "@/app/components/admin-components/layout";
import KPICard from "@/app/components/admin-components/KPICard";
import Loader from "@/app/components/Loader";
import { Button } from "@/app/components/ui/button";
import fetcher from "@/app/lib/fetcher";
import { formatNumber } from "@/app/lib/dashboard-utils";

function pickColor(i: number) {
  const colors = [
    "#FDC020",
    "#00B64F",
    "#3B82F6",
    "#8B5CF6",
    "#EF4444",
    "#F97316",
    "#10B981",
    "#6366F1",
  ];
  return colors[i % colors.length];
}

function MiniBar({
  data,
  labelKey,
  valueKey,
}: {
  data: any[];
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <div className="space-y-2">
      {data.length === 0 && (
        <div className="text-sm text-(--text-secondary) py-4">No data</div>
      )}
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-24 text-xs font-medium text-(--text-primary) truncate"
              title={d[labelKey]}
            >
              {d[labelKey]}
            </div>
            <div className="flex-1 h-6 bg-(--bg-secondary) squircle-sm overflow-hidden">
              <div
                className="h-full squircle-sm transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pickColor(i),
                }}
              />
            </div>
            <div className="w-16 text-xs text-right text-(--text-secondary) tabular-nums">
              {formatNumber(v)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsUsersPage() {
  const [range, setRange] = useState("total");

  const apiUrl = useMemo(
    () => `/api/admin-apis/analytics/users?range=${range}`,
    [range]
  );

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 2000,
    keepPreviousData: true,
  });

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
          Failed to load users analytics ❌
        </div>
      </AdminLayout>
    );
  }

  const kpis = data?.kpis ?? {};
  const funnel = data?.funnel ?? [];
  const sources = data?.sources ?? [];
  const heardFrom = data?.heardFrom ?? [];
  const cities = data?.regions?.cities ?? [];
  const states = data?.regions?.states ?? [];
  const purposes = data?.purposes ?? [];
  const platforms = data?.platforms ?? [];
  const cohorts = data?.cohorts ?? [];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary)">
              Users Analytics
            </h2>
            <p className="text-sm text-(--text-secondary) mt-1">
              How users discover and activate on Zidwell
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/analytics/users/acquisition">
              <Button variant="outline">🔍 Deep Dive</Button>
            </Link>
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Range selector */}
        <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft p-4">
          <label
            htmlFor="range-filter"
            className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5"
          >
            Time Range
          </label>
          <select
            id="range-filter"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full sm:w-64 h-11 squircle-md border border-(--border-color) bg-(--bg-secondary) text-(--text-primary) text-sm px-3"
          >
            <option value="total">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="90days">Last 90 Days</option>
            <option value="180days">Last 180 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Users"
            value={formatNumber(kpis.total ?? 0)}
            icon="◉"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
          <KPICard
            title="New This Month"
            value={formatNumber(kpis.newThisMonth ?? 0)}
            icon="+"
            className="border-l-4 border-l-[--color-lemon-green]"
            subtitle={`Last month: ${formatNumber(kpis.newLastMonth ?? 0)}`}
          />
          <KPICard
            title="Activation Rate"
            value={`${kpis.activatedRate ?? 0}%`}
            icon="⚡"
            className="border-l-4 border-l-[--color-accent-yellow]"
            subtitle={`${formatNumber(kpis.activatedUsers ?? 0)} funded`}
          />
          <KPICard
            title="KYC Verified"
            value={`${kpis.kycVerifiedRate ?? 0}%`}
            icon="✓"
            className="border-l-4 border-l-[--color-lemon-green]"
            subtitle={`${formatNumber(kpis.kycVerified ?? 0)} users`}
          />
          <KPICard
            title="Retention (30d)"
            value={`${kpis.retention30d ?? 0}%`}
            icon="◆"
            className="border-l-4 border-l-[--color-accent-yellow]"
          />
        </div>

        {/* Funnel + Acquisition mix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Signup Funnel
            </h3>
            <div className="space-y-3">
              {funnel.map((stage: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-(--text-primary)">
                      {stage.stage}
                    </span>
                    <span className="text-(--text-secondary)">
                      {formatNumber(stage.count)} ({stage.rate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-(--bg-secondary) squircle-sm overflow-hidden">
                    <div
                      className="h-full squircle-sm"
                      style={{
                        width: `${stage.rate}%`,
                        backgroundColor: pickColor(i),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Acquisition Source
            </h3>
            <MiniBar data={sources.slice(0, 8)} labelKey="name" valueKey="count" />
          </div>
        </div>

        {/* Heard from + Cities + States */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              How Users Heard About Us
            </h3>
            <MiniBar data={heardFrom} labelKey="name" valueKey="count" />
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Top Cities
            </h3>
            <MiniBar data={cities} labelKey="name" valueKey="count" />
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Top States
            </h3>
            <MiniBar data={states} labelKey="name" valueKey="count" />
          </div>
        </div>

        {/* Purpose + Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Purpose
            </h3>
            <MiniBar data={purposes} labelKey="name" valueKey="count" />
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
              Platform
            </h3>
            <MiniBar data={platforms} labelKey="name" valueKey="count" />
          </div>
        </div>

        {/* Cohorts */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-(--text-secondary) mb-4">
            Retention Cohorts (by signup month)
          </h3>
          {cohorts.length === 0 ? (
            <div className="text-sm text-(--text-secondary) py-4">
              No cohort data yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border-color)">
                    <th className="text-left py-2 px-2 text-(--text-secondary) font-medium">
                      Month
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      Signups
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      D1
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      D7
                    </th>
                    <th className="text-right py-2 px-2 text-(--text-secondary) font-medium">
                      D30
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-(--border-color) last:border-0"
                    >
                      <td className="py-2 px-2 text-(--text-primary) font-medium">
                        {c.month}
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-primary)">
                        {formatNumber(c.signups)}
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-secondary)">
                        {c.d1}%
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-secondary)">
                        {c.d7}%
                      </td>
                      <td className="py-2 px-2 text-right text-(--text-secondary)">
                        {c.d30}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}