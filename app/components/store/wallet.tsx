// app/components/store/wallet.tsx
"use client";

import { useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoreWallet() {
  const { pages, loading } = useStore();

  const walletData = useMemo(() => {
    const totalBalance = pages.reduce((sum, p) => sum + p.pageBalance, 0);
    const totalRevenue = pages.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalPayments = pages.reduce((sum, p) => sum + p.totalPayments, 0);
    const pendingWithdrawals = Math.floor(totalBalance * 0.15);

    return {
      totalBalance,
      totalRevenue,
      totalPayments,
      pendingWithdrawals,
    };
  }, [pages]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 p-8 text-background">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-gold/10" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-x-8 translate-y-8 rounded-full bg-gold/5" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Wallet className="size-5" />
            <p className="text-sm font-medium opacity-80">Store Wallet Balance</p>
          </div>
          <p className="mt-4 font-display text-5xl font-bold">
            ₦{walletData.totalBalance.toLocaleString()}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity">
              Withdraw Funds
            </button>
            <button className="rounded-2xl border border-background/20 px-6 py-3 text-sm font-bold hover:bg-background/10 transition-colors">
              Transaction History
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpRight className="size-4 text-lemon-green" />
            <p className="text-sm">Total Revenue</p>
          </div>
          <p className="text-xl font-bold">₦{walletData.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="size-4 text-gold" />
            <p className="text-sm">Total Payments</p>
          </div>
          <p className="text-xl font-bold">{walletData.totalPayments}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-yellow-500" />
            <p className="text-sm">Pending Withdrawals</p>
          </div>
          <p className="text-xl font-bold">₦{walletData.pendingWithdrawals.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">Recent Transactions</h3>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
          </button>
        </div>
        <div className="space-y-3">
          {pages.slice(0, 5).map((page) => (
            <div key={page.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10">
                  {page.pageBalance > 0 ? (
                    <ArrowUpRight className="size-4 text-lemon-green" />
                  ) : (
                    <ArrowDownRight className="size-4 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{page.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {page.totalPayments} payments • {new Date(page.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                page.pageBalance > 0 ? "text-lemon-green" : "text-red-500"
              )}>
                {page.pageBalance > 0 ? "+" : ""}₦{page.pageBalance.toLocaleString()}
              </p>
            </div>
          ))}
          {pages.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}