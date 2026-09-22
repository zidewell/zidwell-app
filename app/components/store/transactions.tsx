"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, ChevronDown, CreditCard, Eye, Wallet, X } from "lucide-react";
import Loader from "@/app/components/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentMethod: string | null;
  paymentType: string | null;
  orderReference: string | null;
  nombaTransactionId: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  studentName: string | null;
  selectedStudents: string[];
  pageTitle: string;
  pageSlug: string;
  pageType: string;
  pageId: string;
  metadata: any;
};

function compactNumber(n: number): string {
  const v = Number(n) || 0;
  if (Math.abs(v) < 1000) return v.toString();
  if (Math.abs(v) < 1_000_000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  if (Math.abs(v) < 1_000_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(v) < 1_000_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)}B`;
  return `${(v / 1_000_000_000_000).toFixed(1)}T`;
}

function formatNaira(n: number): string {
  const v = Number(n) || 0;
  const full = v.toLocaleString();
  if (full.length <= 12) return `₦${full}`;
  return `₦${compactNumber(v)}`;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-lemon-green/10 text-lemon-green",
  pending: "bg-yellow-500/10 text-yellow-600",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-blue-500/10 text-blue-500",
};

export function TransactionsList() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    totalRevenue: 0,
    averageTransaction: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", "200");

      const res = await fetch(`/api/store/transactions?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load transactions");
      }

      setTransactions(data.transactions || []);
      setMetrics(data.metrics || {
        totalTransactions: 0,
        completedTransactions: 0,
        totalRevenue: 0,
        averageTransaction: 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      if (sortBy === "date") {
        const at = new Date(a.paidAt || a.createdAt).getTime();
        const bt = new Date(b.paidAt || b.createdAt).getTime();
        return sortOrder === "desc" ? bt - at : at - bt;
      }
      return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
    });
    return copy;
  }, [transactions, sortBy, sortOrder]);

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.info("Nothing to export");
      return;
    }
    const headers = [
      "Date",
      "Customer",
      "Email",
      "Product",
      "Amount",
      "Fee",
      "Net",
      "Status",
      "Method",
      "Reference",
    ];
    const rows = sorted.map((t) => [
      new Date(t.paidAt || t.createdAt).toISOString(),
      t.customerName,
      t.customerEmail || "",
      t.pageTitle,
      t.amount.toFixed(2),
      t.fee.toFixed(2),
      t.netAmount.toFixed(2),
      t.status,
      t.paymentMethod || "",
      t.orderReference || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-12 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-card border border-border p-4 min-w-0">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold tabular-nums break-all">
            {compactNumber(metrics.totalTransactions)}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 min-w-0">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p
            className="text-2xl font-bold tabular-nums break-all"
            title={`₦${metrics.totalRevenue.toLocaleString()}`}
          >
            {formatNaira(metrics.totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 min-w-0">
          <p className="text-sm text-muted-foreground">Average Transaction</p>
          <p
            className="text-2xl font-bold tabular-nums break-all"
            title={`₦${metrics.averageTransaction.toLocaleString()}`}
          >
            {formatNaira(metrics.averageTransaction)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer, email or reference..."
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
          <option value="refunded">Refunded</option>
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
        <button
          onClick={handleExport}
          className="rounded-2xl bg-gold text-gold-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Download className="size-4 inline mr-2" />
          Export
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {error ? (
          <div className="text-center py-12 text-red-500">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadTransactions}
              className="mt-3 text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="size-12 mx-auto mb-3 opacity-40" strokeWidth={1.5} />
            <p className="font-semibold">No transactions yet</p>
            <p className="text-sm mt-1">
              {search || filter !== "all"
                ? "Try changing your filters"
                : "Payments will appear here once customers buy from your store"}
            </p>
          </div>
        ) : (
          sorted.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              className="w-full flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors text-left min-w-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" title={tx.pageTitle}>
                  {tx.pageTitle}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {tx.customerName}
                  {tx.customerEmail ? ` · ${tx.customerEmail}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {relativeDate(tx.paidAt || tx.createdAt)}
                  {tx.orderReference ? ` · ${tx.orderReference}` : ""}
                  {tx.paymentType === "installment" && tx.installmentNumber
                    ? ` · Installment ${tx.installmentNumber}/${tx.totalInstallments}`
                    : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold tabular-nums">{formatNaira(tx.amount)}</p>
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    STATUS_STYLES[tx.status] || "bg-muted text-muted-foreground"
                  )}
                >
                  {tx.status}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail drawer */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="eyebrow text-muted-foreground">Transaction</p>
                <h3 className="font-display text-xl font-bold mt-1">
                  {selectedTx.pageTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Status">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    STATUS_STYLES[selectedTx.status] || "bg-muted"
                  )}
                >
                  {selectedTx.status}
                </span>
              </Row>
              <Row label="Amount">{formatNaira(selectedTx.amount)}</Row>
              <Row label="Fee">{formatNaira(selectedTx.fee)}</Row>
              <Row label="Net">{formatNaira(selectedTx.netAmount)}</Row>
              <Row label="Customer">{selectedTx.customerName}</Row>
              {selectedTx.customerEmail && (
                <Row label="Email">{selectedTx.customerEmail}</Row>
              )}
              {selectedTx.customerPhone && (
                <Row label="Phone">{selectedTx.customerPhone}</Row>
              )}
              {selectedTx.orderReference && (
                <Row label="Reference">
                  <span className="font-mono text-xs break-all">
                    {selectedTx.orderReference}
                  </span>
                </Row>
              )}
              {selectedTx.nombaTransactionId && (
                <Row label="Nomba TX">
                  <span className="font-mono text-xs break-all">
                    {selectedTx.nombaTransactionId}
                  </span>
                </Row>
              )}
              {selectedTx.paymentType === "installment" &&
                selectedTx.installmentNumber && (
                  <Row label="Installment">
                    {selectedTx.installmentNumber} of{" "}
                    {selectedTx.totalInstallments}
                  </Row>
                )}
              <Row label="Method">{selectedTx.paymentMethod || "—"}</Row>
              {selectedTx.paidAt && (
                <Row label="Paid at">
                  {new Date(selectedTx.paidAt).toLocaleString()}
                </Row>
              )}
              <Row label="Created">
                {new Date(selectedTx.createdAt).toLocaleString()}
              </Row>

              {selectedTx.selectedStudents.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Students</p>
                  <ul className="list-disc pl-5">
                    {selectedTx.selectedStudents.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTx.metadata?.shippingAddress && (
                <div>
                  <p className="text-muted-foreground mb-1">Ship to</p>
                  <p>
                    {selectedTx.metadata.shippingAddress.street},{" "}
                    {selectedTx.metadata.shippingAddress.city},{" "}
                    {selectedTx.metadata.shippingAddress.state}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right min-w-0 break-words">{children}</span>
    </div>
  );
}