// app/components/store/analytics.tsx
"use client";

import { useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { TrendingUp, Users, Eye, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function AnalyticsDashboard() {
  const { pages, loading } = useStore();

  const analytics = useMemo(() => {
    const totalRevenue = pages.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalPayments = pages.reduce((sum, p) => sum + p.totalPayments, 0);
    const totalViews = pages.reduce((sum, p) => sum + p.pageViews, 0);
    const avgConversion = pages.length > 0 ? (totalPayments / totalViews) * 100 : 0;
    const avgOrderValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    const activePages = pages.filter(p => p.isPublished).length;

    // Mock growth data
    const growthRate = 23.5;
    const viewsGrowth = 15.2;
    const revenueGrowth = 18.7;
    const conversionGrowth = 4.1;

    return {
      totalRevenue,
      totalPayments,
      totalViews,
      avgConversion,
      avgOrderValue,
      activePages,
      totalPages: pages.length,
      growthRate,
      viewsGrowth,
      revenueGrowth,
      conversionGrowth,
    };
  }, [pages]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₦{analytics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lemon-green/10">
              <TrendingUp className="size-5 text-lemon-green" />
            </div>
          </div>
          <p className="mt-2 text-xs text-lemon-green flex items-center gap-1">
            <ArrowUpRight className="size-3" />
            {analytics.revenueGrowth}% from last month
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10">
              <Eye className="size-5 text-gold" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gold flex items-center gap-1">
            <ArrowUpRight className="size-3" />
            {analytics.viewsGrowth}% from last month
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{analytics.avgConversion.toFixed(1)}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/10">
              <CreditCard className="size-5 text-yellow-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-yellow-500 flex items-center gap-1">
            <ArrowUpRight className="size-3" />
            {analytics.conversionGrowth}% from last month
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Pages</p>
              <p className="text-2xl font-bold">{analytics.activePages}/{analytics.totalPages}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <Users className="size-5 text-blue-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {analytics.activePages > 0 ? `${Math.round((analytics.activePages / analytics.totalPages) * 100)}% active` : "No active pages"}
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-2">Average Order Value</h3>
          <p className="text-4xl font-bold text-gold">₦{Math.round(analytics.avgOrderValue).toLocaleString()}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {analytics.totalPayments} total payments
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold mb-2">Growth Rate</h3>
          <p className="text-4xl font-bold text-lemon-green">+{analytics.growthRate}%</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Overall store growth this period
          </p>
        </div>
      </div>

      {/* Page Performance */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold mb-4">Page Performance</h3>
        <div className="space-y-3">
          {pages.slice(0, 5).map((page) => {
            const conversionRate = page.pageViews > 0 ? (page.totalPayments / page.pageViews) * 100 : 0;
            return (
              <div key={page.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold">{page.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span>👁 {page.pageViews} views</span>
                    <span>💳 {page.totalPayments} payments</span>
                    <span>📊 {conversionRate.toFixed(1)}% conversion</span>
                  </div>
                </div>
                <p className="font-bold">₦{page.totalRevenue.toLocaleString()}</p>
              </div>
            );
          })}
          {pages.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No pages to analyze</p>
          )}
        </div>
      </div>
    </div>
  );
}