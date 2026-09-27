"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  CreditCard,
  X,
  Layers,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DisplayStatus =
  | "completed"
  | "ongoing"
  | "pending"
  | "cancelled"
  | "failed"
  | "refunded";

type Transaction = {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;

  status: string;
  displayStatus: DisplayStatus;
  displayLabel: string;

  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;

  paymentMethod: string | null;
  paymentType: string;
  isInstallment: boolean;
  orderReference: string | null;
  nombaTransactionId: string | null;

  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string;

  installmentNumber: number | null;
  totalInstallments: number | null;
  installmentStatus: string | null;
  nextInstallmentDue: string | null;
  planTotalAmount: number | null;
  planProgress: { current: number; total: number; percent: number } | null;

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
  if (Math.abs(v) < 1_000_000)
    return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  if (Math.abs(v) < 1_000_000_000)
    return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(v) < 1_000_000_000_000)
    return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)}B`;
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
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const STATUS_STYLES: Record<
  DisplayStatus,
  { chip: string; icon: React.ElementType }
> = {
  completed: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  ongoing: {
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  pending: {
    chip: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
    icon: Clock,
  },
  cancelled: {
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    icon: Ban,
  },
  failed: {
    chip: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  refunded: {
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: RotateCcw,
  },
};

function StatusChip({
  status,
  label,
}: {
  status: DisplayStatus;
  label: string;
}) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        s.chip
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    fullCompleted: 0,
    installmentCompleted: 0,
    ongoingInstallments: 0,
    cancelledTransactions: 0,
    totalRevenue: 0,
    fullRevenue: 0,
    installmentRevenue: 0,
    averageTransaction: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "full" | "installment"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", "200");

      const res = await fetch(
        `/api/store/transactions?${params.toString()}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load transactions");
      }

      setTransactions(data.transactions || []);
      setMetrics(
        data.metrics || {
          totalTransactions: 0,
          completedTransactions: 0,
          fullCompleted: 0,
          installmentCompleted: 0,
          ongoingInstallments: 0,
          cancelledTransactions: 0,
          totalRevenue: 0,
          fullRevenue: 0,
          installmentRevenue: 0,
          averageTransaction: 0,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, debouncedSearch]);

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
      return sortOrder === "desc"
        ? b.amount - a.amount
        : a.amount - b.amount;
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
      "Type",
      "Status",
      "Installment",
      "Plan total",
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
      t.paymentType,
      t.displayLabel,
      t.isInstallment && t.installmentNumber
        ? `${t.installmentNumber}/${t.totalInstallments}`
        : "",
      t.planTotalAmount != null ? t.planTotalAmount.toFixed(2) : "",
      t.paymentMethod || "",
      t.orderReference || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted/50 rounded-2xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-12 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric
          label="Total Transactions"
          value={compactNumber(metrics.totalTransactions)}
        />
        <Metric
          label="Total Revenue"
          value={formatNaira(metrics.totalRevenue)}
          title={`₦${metrics.totalRevenue.toLocaleString()}`}
        />
        <Metric
          label="Full payments"
          value={`${compactNumber(metrics.fullCompleted)} · ${formatNaira(
            metrics.fullRevenue
          )}`}
          title={`${metrics.fullCompleted} completed · ₦${metrics.fullRevenue.toLocaleString()}`}
        />
        <Metric
          label="Installments"
          value={`${compactNumber(
            metrics.installmentCompleted
          )} · ${formatNaira(metrics.installmentRevenue)}`}
          title={`${metrics.installmentCompleted} installments · ₦${metrics.installmentRevenue.toLocaleString()}`}
        />
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
          <option value="ongoing">Ongoing (installment)</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(
              e.target.value as "all" | "full" | "installment"
            )
          }
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Types</option>
          <option value="full">One-time</option>
          <option value="installment">Installment</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "date" | "amount")
          }
          className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
        <button
          onClick={() =>
            setSortOrder(sortOrder === "desc" ? "asc" : "desc")
          }
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
            <CreditCard
              className="size-12 mx-auto mb-3 opacity-40"
              strokeWidth={1.5}
            />
            <p className="font-semibold">No transactions found</p>
            <p className="text-sm mt-1">
              {search || filter !== "all" || typeFilter !== "all"
                ? "Try changing your filters"
                : "Payments will appear here once customers buy from your store"}
            </p>
          </div>
        ) : (
          sorted.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              className="w-full flex items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors text-left min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="font-semibold truncate"
                    title={tx.pageTitle}
                  >
                    {tx.pageTitle}
                  </p>
                  {tx.isInstallment && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                      <Layers className="size-3" />
                      Installment
                      {tx.planProgress
                        ? ` ${tx.planProgress.current}/${tx.planProgress.total}`
                        : ""}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {tx.customerName}
                  {tx.customerEmail ? ` · ${tx.customerEmail}` : ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {relativeDate(tx.paidAt || tx.createdAt)}
                  {tx.orderReference ? ` · ${tx.orderReference}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold tabular-nums">
                  {formatNaira(tx.amount)}
                </p>
                <StatusChip
                  status={tx.displayStatus}
                  label={tx.displayLabel}
                />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Drawer */}
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
                <p className="eyebrow text-muted-foreground">
                  {selectedTx.isInstallment
                    ? "Installment payment"
                    : "One-time payment"}
                </p>
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
                <StatusChip
                  status={selectedTx.displayStatus}
                  label={selectedTx.displayLabel}
                />
              </Row>
              <Row label="Amount">
                {formatNaira(selectedTx.amount)}
              </Row>
              <Row label="Fee">{formatNaira(selectedTx.fee)}</Row>
              <Row label="Net">{formatNaira(selectedTx.netAmount)}</Row>

              {selectedTx.isInstallment && (
                <>
                  <Row label="Plan total">
                    {formatNaira(selectedTx.planTotalAmount || 0)}
                  </Row>
                  {selectedTx.planProgress && (
                    <Row label="Progress">
                      Installment {selectedTx.planProgress.current} of{" "}
                      {selectedTx.planProgress.total} (
                      {selectedTx.planProgress.percent}%)
                    </Row>
                  )}
                  {selectedTx.nextInstallmentDue &&
                    selectedTx.displayStatus === "ongoing" && (
                      <Row label="Next due">
                        {new Date(
                          selectedTx.nextInstallmentDue
                        ).toLocaleDateString()}
                      </Row>
                    )}
                </>
              )}

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
              <Row label="Method">
                {selectedTx.paymentMethod || "—"}
              </Row>
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

function Metric({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className="text-xl font-bold tabular-nums break-all"
        title={title}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right min-w-0 break-words">{children}</span>
    </div>
  );
}