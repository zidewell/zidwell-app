// app/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  CreditCard,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  QrCode,
  Link2,
  Trash2,
  EyeOff,
  Package,
  Coins,
  RefreshCw,
  Waves,
  Plus,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import { useUserContextData } from "@/app/context/userData";
import { CreateStoreForm } from "@/app/components/store/create-store";
import { DateFilter } from "@/app/components/date-filter";
import type { DateRange } from "react-day-picker";
import { type PeriodKey } from "@/app/components/date-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { ZidwellShell } from "@/app/components/zidwell-shell";

// ─── STAT CARD ───
function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  highlight,
  deltaPositive = true,
  empty = false,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ElementType;
  highlight?: boolean;
  deltaPositive?: boolean;
  empty?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[2rem] border border-border p-7 transition-all bg-card shadow-sm min-w-0 overflow-hidden",
        highlight ? "bg-foreground text-background" : "bg-card",
        empty && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            highlight ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <Icon className="size-5" strokeWidth={2.3} />
        </span>
        {!empty && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
              highlight
                ? "bg-background/15 text-background"
                : deltaPositive
                ? "bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#2E7D32]/20 dark:text-[#66BB6A]"
                : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            )}
          >
            <ArrowUpRight
              className={cn("size-3.5", !deltaPositive && "rotate-90")}
            />
            {delta}
          </span>
        )}
      </div>
      <p
        className={cn(
          "eyebrow mt-8",
          highlight ? "text-background/60" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p
        className="mt-2 font-display text-[2.1rem] font-bold leading-none tracking-tight tabular-nums break-all"
        title={empty ? "—" : value}
      >
        {empty ? "—" : value}
      </p>
    </motion.div>
  );
}

// ─── PAYMENT PAGE CARD ───
function PaymentPageCard({
  page,
  index,
  storeSlug,
  onRefresh,
}: {
  page: any;
  index: number;
  storeSlug?: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { updatePage } = useStore();

  const getPageUrl = () =>
    `/store/${storeSlug || ""}/${page.slug || page.id}`;

  const getFullPageUrl = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${getPageUrl()}`;
  };

  const isActive = page.isPublished === true;

  const stripHtml = (html: string) => {
    if (!html) return "No description";
    if (typeof window !== "undefined") {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "No description";
    }
    return html.replace(/<[^>]*>/g, "").trim() || "No description";
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/services/payment/edit/${page.id}`);
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = !isActive;
      const result = await Swal.fire({
        icon: "question",
        title: newStatus ? "Activate Page?" : "Deactivate Page?",
        text: newStatus
          ? `Are you sure you want to activate "${page.title}"? It will become visible to customers.`
          : `Are you sure you want to deactivate "${page.title}"? It will no longer be visible to customers.`,
        showCancelButton: true,
        confirmButtonColor: newStatus ? "#22c55e" : "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: newStatus ? "Yes, Activate" : "Yes, Deactivate",
        cancelButtonText: "Cancel",
      });
      if (result.isConfirmed) {
        await updatePage(page.id, { isPublished: newStatus });
        toast.success(
          `Page ${newStatus ? "activated" : "deactivated"} successfully!`
        );
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error toggling page:", error);
      toast.error(error.message || "Failed to update page status");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Page?",
      html: `
        <div class="text-left">
          <p class="font-semibold">Are you sure you want to delete "${page.title}"?</p>
          <p class="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
          <ul class="text-sm text-gray-600 mt-2 list-disc pl-4">
            <li>All payment data will be permanently removed</li>
            <li>Customers will no longer be able to pay</li>
            <li>This action is irreversible</li>
          </ul>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete Page",
      cancelButtonText: "Cancel",
      width: 500,
    });
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/payment-page/delete/${page.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete page");
        }
        toast.success(`"${page.title}" deleted successfully!`);
        onRefresh();
      } catch (error: any) {
        console.error("Error deleting page:", error);
        toast.error(error.message || "Failed to delete page");
      }
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(getFullPageUrl());
    toast.success("Page URL copied to clipboard!");
  };

  const handleViewPublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getFullPageUrl(), "_blank");
  };

  const handleDownloadQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("QR code download will be available soon");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() =>
        router.push(`/dashboard/services/payment/page/${page.id}`)
      }
      className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)] cursor-pointer shadow-sm"
    >
      <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-muted/30">
        {page.coverImage ? (
          <img
            src={page.coverImage}
            alt={page.title}
            className="h-full w-full object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : page.productImages && page.productImages.length > 0 ? (
          <img
            src={page.productImages[0]}
            alt={page.title}
            className="h-full w-full object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CreditCard
            className="size-14 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
            isActive
              ? "bg-background text-foreground"
              : "bg-foreground text-background"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={`Actions for ${page.title}`}
              className="absolute right-3 top-3 rounded-full bg-background p-2 text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl bg-card border-border shadow-xl"
          >
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="size-4 mr-2" /> Edit page
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleViewPublic}
              className="cursor-pointer"
            >
              <ExternalLink className="size-4 mr-2" /> View public link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownloadQR}
              className="cursor-pointer"
            >
              <QrCode className="size-4 mr-2" /> Download QR code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCopyUrl}
              className="cursor-pointer"
            >
              <Link2 className="size-4 mr-2" /> Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleToggleActive}
              className={cn(
                "cursor-pointer",
                isActive ? "text-yellow-600" : "text-green-600"
              )}
            >
              <EyeOff className="size-4 mr-2" />{" "}
              {isActive ? "Make inactive" : "Make active"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex-1 min-w-0 px-1">
        <p className="eyebrow truncate text-muted-foreground">
          {page.pageType || "Payment"}
        </p>
        <h3
          className="mt-1 font-display text-lg font-bold leading-tight text-foreground line-clamp-2 break-words"
          title={page.title}
        >
          {page.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1 break-words">
          {stripHtml(page.description)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border px-1 pt-3 text-sm font-semibold text-muted-foreground">
        <span
          className="flex min-w-0 items-center gap-1 truncate tabular-nums"
          title={`${(page.pageBalance || 0).toLocaleString()} balance`}
        >
          <Wallet className="size-3.5 shrink-0" />
          <span className="truncate">
            ₦{(page.pageBalance || 0).toLocaleString()}
          </span>
        </span>
        <span
          className="flex min-w-0 items-center gap-1 truncate tabular-nums"
          title={`${page.pageViews || 0} views`}
        >
          <Eye className="size-3.5 shrink-0" />
          <span className="truncate">{page.pageViews || 0} views</span>
        </span>
        <span
          className="flex min-w-0 items-center gap-1 truncate tabular-nums"
          title={`${page.totalPayments || 0} payments`}
        >
          <CreditCard className="size-3.5 shrink-0" />
          <span className="truncate">
            {page.totalPayments || 0} payments
          </span>
        </span>
      </div>
    </motion.article>
  );
}

// ─── GREETING ───
function Greeting({
  storeName,
  firstName,
}: {
  storeName?: string;
  firstName?: string;
}) {
  const [greeting, setGreeting] = useState("Good morning");
  const [emoji, setEmoji] = useState("🌅");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
      setEmoji("🌅");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
      setEmoji("☀️");
    } else if (hour < 21) {
      setGreeting("Good evening");
      setEmoji("🌆");
    } else {
      setGreeting("Good night");
      setEmoji("🌙");
    }
  }, []);

  const displayName = firstName || "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Waves className="size-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground break-words">
            {greeting}, {displayName} {emoji}
          </h1>
          {storeName && (
            <p className="text-sm text-muted-foreground mt-1 break-words">
              Welcome to{" "}
              <span className="text-primary font-medium">{storeName}</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE COMPONENT ───
export default function PaymentPage() {
  const router = useRouter();
  const {
    store,
    pages,
    loading,
    hasStore,
    hasPendingActivation,
    fetchStore,
    fetchPages,
    refreshPages,
  } = useStore();
  const { userData } = useUserContextData();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [range, setRange] = useState<DateRange | undefined>();
  const [filteredPages, setFilteredPages] = useState<any[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const isRefreshingRef = useRef(false);
  const lastRefreshTime = useRef(0);
  const MIN_REFRESH_INTERVAL = 2000;

  // Single initialization effect
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        await fetchStore();
        if (!isMounted) return;

        if (store || hasStore) {
          await fetchPages();
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        if (isMounted) {
          setInitialLoadComplete(true);
          setDataReady(true);
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter pages
  useEffect(() => {
    if (pages.length === 0) {
      setFilteredPages([]);
      return;
    }
    let filtered = [...pages];
    if (period !== "all" && period !== "custom") {
      const days = parseInt(period);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filtered = filtered.filter(
          (page) => new Date(page.createdAt) >= cutoffDate
        );
      }
    } else if (period === "custom" && range?.from) {
      const from = new Date(range.from);
      const to = range.to ? new Date(range.to) : new Date();
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((page) => {
        const createdAt = new Date(page.createdAt);
        return createdAt >= from && createdAt <= to;
      });
    }
    setFilteredPages(filtered);
  }, [pages, period, range]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    lastRefreshTime.current = now;
    try {
      await refreshPages();
      toast.success("Pages refreshed");
    } catch {
      toast.error("Failed to refresh pages");
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [refreshPages]);

  const handlePageRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) return;
    lastRefreshTime.current = now;
    refreshPages();
  }, [refreshPages]);

  const metrics = useMemo(() => {
    const totalBalance = filteredPages.reduce(
      (sum, p) => sum + (p.pageBalance || 0),
      0
    );
    const totalRevenue = filteredPages.reduce(
      (sum, p) => sum + (p.totalRevenue || 0),
      0
    );
    const totalPayments = filteredPages.reduce(
      (sum, p) => sum + (p.totalPayments || 0),
      0
    );
    const totalViews = filteredPages.reduce(
      (sum, p) => sum + (p.pageViews || 0),
      0
    );
    const avgOrder =
      filteredPages.length > 0 && totalPayments > 0
        ? totalRevenue / totalPayments
        : 0;
    const activePages = filteredPages.filter(
      (p) => p.isPublished === true
    ).length;

    return {
      totalBalance,
      totalRevenue,
      totalPayments,
      totalViews,
      avgOrder,
      pageCount: filteredPages.length,
      activePages,
    };
  }, [filteredPages]);

  // Loading state — keep the shell visible so the nav stays sticky
  if (isLoading || !initialLoadComplete || !dataReady) {
    return (
      <ZidwellShell>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
          <p className="text-muted-foreground">Loading your store...</p>
        </div>
      </ZidwellShell>
    );
  }

  // No store
  if (!hasStore && !store) {
    return (
      <ZidwellShell>
        <CreateStoreForm />
      </ZidwellShell>
    );
  }

  // Pending activation
  if (hasPendingActivation) {
    return (
      <ZidwellShell>
        <CreateStoreForm />
      </ZidwellShell>
    );
  }

  const isEmpty = filteredPages.length === 0;
  const firstName =
    userData?.full_name?.split(" ")[0] || userData?.first_name || "";
  const storeName = store?.name || "";
  const storeSlug = store?.slug || "";

  return (
    <ZidwellShell>
      {/* Header with Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-8 mb-10">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">Online Store</p>
          <Greeting storeName={storeName} firstName={firstName} />
          <div className="mt-7 flex flex-wrap items-center gap-3 w-full">
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-transparent px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200"
            >
              <ExternalLink className="size-4" />
              Visit storefront
            </a>
            <button
              onClick={() =>
                router.push("/dashboard/services/payment/create")
              }
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-primary/20"
            >
              <Plus className="size-4" /> Add New product
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DateFilter
            value={period}
            onChange={setPeriod}
            range={range}
            onRangeChange={setRange}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-2xl border border-border p-3 hover:bg-muted transition-colors bg-card shadow-sm"
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </button>
            <p className="text-sm font-medium text-muted-foreground">
              Click to refresh
            </p>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total balance"
          value={
            isEmpty
              ? "₦0"
              : `₦${metrics.totalBalance.toLocaleString()}`
          }
          delta="0%"
          icon={Coins}
          highlight
          empty={isEmpty}
        />
        <StatCard
          label="Total revenue"
          value={
            isEmpty
              ? "₦0"
              : `₦${metrics.totalRevenue.toLocaleString()}`
          }
          delta="0%"
          icon={TrendingUp}
          empty={isEmpty}
        />
        <StatCard
          label="Total payments"
          value={isEmpty ? "0" : metrics.totalPayments.toLocaleString()}
          delta="0%"
          icon={CreditCard}
          empty={isEmpty}
        />
        <StatCard
          label="Page views"
          value={isEmpty ? "0" : metrics.totalViews.toLocaleString()}
          delta="0%"
          icon={Eye}
          empty={isEmpty}
        />
      </section>

      {/* Secondary Metrics */}
      <section className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Average order value",
            value: isEmpty
              ? "₦0"
              : `₦${Math.round(metrics.avgOrder).toLocaleString()}`,
          },
          {
            label: "Conversion rate",
            value: isEmpty ? "0%" : "3.2%",
          },
          {
            label: "Active pages",
            value: isEmpty ? "0" : metrics.activePages.toLocaleString(),
          },
          {
            label: "Total pages",
            value: isEmpty ? "0" : metrics.pageCount.toLocaleString(),
          },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-[2rem] p-7 bg-card border border-border shadow-sm min-w-0 overflow-hidden",
              isEmpty ? "bg-muted/30 border border-border" : "bg-card"
            )}
          >
            <p className="eyebrow text-muted-foreground">{s.label}</p>
            <p
              className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums break-all"
              title={s.value}
            >
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Page Grid or Empty State */}
      <section className="mt-20">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-3xl border border-border shadow-sm">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
              <Package className="size-12 text-muted-foreground/40" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
              No pages yet
            </h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Create your first payment page to start collecting money
              from your customers.
            </p>
            <button
              onClick={() =>
                router.push("/dashboard/services/payment/create")
              }
              className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Create Payment Page
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-muted-foreground">Collection</p>
                <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl text-foreground break-words">
                  Your Store Products
                </h2>
              </div>
              <p className="text-base font-medium text-muted-foreground">
                {
                  filteredPages.filter((p) => p.isPublished === true)
                    .length
                }{" "}
                active pages
              </p>
            </div>
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() =>
                    router.push("/dashboard/services/payment/create")
                  }
                  className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground bg-card shadow-sm"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Plus className="size-6" strokeWidth={2.6} />
                  </span>
                  <span className="font-display text-base font-bold">
                    Add page
                  </span>
                  <span className="max-w-[180px] text-center text-sm">
                    Create a new payment page
                  </span>
                </button>
                {filteredPages.map((page, i) => (
                  <PaymentPageCard
                    key={page.id}
                    page={page}
                    index={i}
                    storeSlug={storeSlug}
                    onRefresh={handlePageRefresh}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </ZidwellShell>
  );
}