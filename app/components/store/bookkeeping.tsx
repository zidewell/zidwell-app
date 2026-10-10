// app/components/store/bookkeeping.tsx
"use client";

import { useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

export function BookkeepingDashboard() {
  const { pages, loading } = useStore();

  const metrics = useMemo(() => {
    const totalRevenue = pages.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalBalance = pages.reduce((sum, p) => sum + p.pageBalance, 0);
    const totalPayments = pages.reduce((sum, p) => sum + p.totalPayments, 0);
    const avgRevenue = pages.length > 0 ? totalRevenue / pages.length : 0;

    // Mock monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyData = months.map((month, i) => ({
      month,
      revenue: Math.floor(totalRevenue * (0.05 + Math.random() * 0.15)),
      expenses: Math.floor(totalRevenue * (0.02 + Math.random() * 0.05)),
    }));

    return {
      totalRevenue,
      totalBalance,
      totalPayments,
      avgRevenue,
      monthlyData,
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
        <div className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <button className="rounded-2xl bg-gold text-gold-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
          <Download className="size-4 inline mr-2" />
          Export Reports
        </button>
        <button className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm hover:bg-muted transition-colors">
          <Calendar className="size-4 inline mr-2" />
          This Month
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <TrendingUp className="size-4 text-lemon-green" />
          </div>
          <p className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <DollarSign className="size-4 text-gold" />
          </div>
          <p className="text-2xl font-bold">₦{metrics.totalBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <TrendingUp className="size-4 text-lemon-green" />
          </div>
          <p className="text-2xl font-bold">{metrics.totalPayments}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Average Revenue</p>
            <TrendingDown className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">₦{Math.round(metrics.avgRevenue).toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-2 h-48">
          {metrics.monthlyData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full rounded-lg bg-gold/30 hover:bg-gold/50 transition-colors"
                style={{ 
                  height: `${(data.revenue / Math.max(...metrics.monthlyData.map(d => d.revenue))) * 100}%` 
                }}
              />
              <p className="text-xs text-muted-foreground">{data.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions by Page */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold mb-4">Revenue by Page</h3>
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
              <div>
                <p className="font-semibold">{page.title}</p>
                <p className="text-sm text-muted-foreground">{page.totalPayments} payments</p>
              </div>
              <p className="font-bold">₦{page.totalRevenue.toLocaleString()}</p>
            </div>
          ))}
          {pages.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No pages found</p>
          )}
        </div>
      </div>
    </div>
  );
}