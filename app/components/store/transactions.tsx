"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { Search, Filter, Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionsList() {
  const { pages, loading } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const transactions = useMemo(() => {
    const allTransactions: any[] = [];

    pages.forEach(page => {
      const count = Math.min(page.totalPayments || 0, 10);
      for (let i = 0; i < count; i++) {
        const date = new Date(page.createdAt);
        date.setDate(date.getDate() - i * 3);
        allTransactions.push({
          id: `${page.id}-${i}`,
          pageTitle: page.title,
          amount: Math.floor((page.price || 1000) * (0.5 + Math.random())),
          status: ["completed", "pending", "failed"][Math.floor(Math.random() * 3)],
          date: date.toISOString(),
          customer: `Customer ${i + 1}`,
          pageId: page.id,
        });
      }
    });

    let filtered = allTransactions;
    if (search) {
      filtered = filtered.filter(t =>
        t.pageTitle.toLowerCase().includes(search.toLowerCase()) ||
        t.customer.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter !== "all") {
      filtered = filtered.filter(t => t.status === filter);
    }

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return filtered;
  }, [pages, search, filter, sortBy, sortOrder]);

  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground">Average Transaction</p>
          <p className="text-2xl font-bold">
            ₦{transactions.length > 0 ? Math.round(totalRevenue / transactions.length).toLocaleString() : "0"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm hover:bg-muted transition-colors"
        >
          {sortOrder === "desc" ? "↓" : "↑"}
        </button>
        <button className="rounded-2xl bg-gold text-gold-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
          <Download className="size-4 inline mr-2" />
          Export
        </button>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">💳</p>
            <p>No transactions found</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold">{tx.pageTitle}</p>
                <p className="text-sm text-muted-foreground">{tx.customer}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">₦{tx.amount.toLocaleString()}</p>
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    tx.status === "completed" && "bg-lemon-green/10 text-lemon-green",
                    tx.status === "pending" && "bg-yellow-500/10 text-yellow-600",
                    tx.status === "failed" && "bg-red-500/10 text-red-500",
                  )}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
