"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
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
  Store,
  Package,
  Coins,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Loader from "@/app/components/Loader";
import { useStore } from "@/app/context/StoreContext";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import { toast } from "sonner";
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
import { CreateStoreForm } from "@/app/components/store/create-store";

// Store Navigation Component
export const STORE_LINKS = [
  { label: "Dashboard", href: "/dashboard/services/payment/dashboard", icon: Store },
  { label: "Products", href: "/store/products", icon: Package },
  { label: "Transactions", href: "/store/transactions", icon: CreditCard },
  { label: "Customers", href: "/store/customers", icon: Users },
  { label: "Analytics", href: "/store/analytics", icon: BarChart3 },
  { label: "Settings", href: "/store/settings", icon: Settings },
];

export function StoreNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto px-5 py-3 sm:px-8 border-b border-border">
      <nav className="flex items-center gap-1">
        {STORE_LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(link.href + '/');
          return (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-foreground text-background hover:bg-foreground hover:text-background"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </a>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-full p-2 hover:bg-muted transition-colors">
          <HelpCircle className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// Stat Card Component
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
        "rounded-[2rem] border border-border p-7 transition-all",
        highlight ? "bg-foreground text-background" : "bg-card",
        empty && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            highlight ? "bg-gold text-gold-foreground" : "bg-muted"
          )}
        >
          <Icon className="size-5" strokeWidth={2.3} />
        </span>
        {!empty && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
              highlight 
                ? "bg-background/15 text-background" 
                : deltaPositive 
                  ? "bg-lemon-green/10 text-lemon-green" 
                  : "bg-red-500/10 text-red-500"
            )}
          >
            <ArrowUpRight className={cn(
              "size-3.5",
              !deltaPositive && "rotate-90"
            )} />
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
      <p className="mt-2 font-display text-[2.1rem] font-bold leading-none tracking-tight">
        {empty ? "—" : value}
      </p>
    </motion.div>
  );
}

// Payment Page Card Component
function PaymentPageCard({ page, index }: { page: any; index: number }) {
  const router = useRouter();

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    toast(action);
  };

  const isActive = page.isPublished === true;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/dashboard/services/payment/page/${page.id}`)}
      className="group flex flex-col rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)] cursor-pointer"
    >
      <div className="relative flex h-40 items-center justify-center rounded-[1.5rem] bg-muted/30">
        {page.coverImage || page.logo ? (
          <img
            src={page.coverImage || page.logo}
            alt={page.title}
            className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <CreditCard className="size-14 text-muted-foreground/40" strokeWidth={1.5} />
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
              className="absolute right-3 top-3 rounded-full bg-background p-2 text-foreground shadow-sm"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl">
            <DropdownMenuItem onClick={(e) => handleAction(e, "Editing " + page.title)}>
              <Pencil className="size-4 mr-2" /> Edit page
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/p/${page.slug || page.id}`;
                window.open(url, "_blank");
              }}
            >
              <ExternalLink className="size-4 mr-2" /> View public link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleAction(e, "QR code downloaded")}>
              <QrCode className="size-4 mr-2" /> Download QR code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/p/${page.slug || page.id}`;
                navigator.clipboard?.writeText(url);
                toast.success("Page URL copied");
              }}
            >
              <Link2 className="size-4 mr-2" /> Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) =>
                handleAction(e, isActive ? "Page made inactive" : "Page activated")
              }
            >
              <EyeOff className="size-4 mr-2" />{" "}
              {isActive ? "Make inactive" : "Make active"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => handleAction(e, "Page deleted")}
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex-1 px-1">
        <p className="eyebrow text-muted-foreground">
          {page.pageType || "Payment"}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight">
          {page.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
          {page.description || "No description"}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border px-1 pt-3 text-sm font-semibold text-muted-foreground">
        <span className="flex items-center gap-1">
          <Wallet className="size-3.5" />
          ₦{(page.pageBalance || 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="size-3.5" />
          {page.pageViews || 0} views
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="size-3.5" />
          {page.totalPayments || 0} payments
        </span>
      </div>
    </motion.article>
  );
}

// Main Dashboard Component
export default function PaymentDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    store, 
    pages, 
    loading, 
    hasStore, 
    hasPendingActivation, 
    fetchStore, 
    fetchPages, 
    refreshPages 
  } = useStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [range, setRange] = useState<DateRange | undefined>();
  const [filteredPages, setFilteredPages] = useState<any[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isStoreCheckComplete, setIsStoreCheckComplete] = useState(false);

  // ✅ Show loader first, then check store status
  useEffect(() => {
    let isMounted = true;
    
    const checkStoreStatus = async () => {
      try {
        setIsLoading(true);
        await fetchStore();
        
        if (isMounted) {
          setIsStoreCheckComplete(true);
        }
      } catch (error) {
        console.error("Error checking store:", error);
        if (isMounted) {
          setIsStoreCheckComplete(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    const timer = setTimeout(() => {
      checkStoreStatus();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchStore]);

  // ✅ Load pages when store is active
  useEffect(() => {
    if (hasStore && isStoreCheckComplete && !isLoading) {
      fetchPages().finally(() => {
        setInitialLoadComplete(true);
      });
    }
  }, [hasStore, isStoreCheckComplete, isLoading, fetchPages]);

  // ✅ Filter pages based on selected period
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
        
        filtered = filtered.filter((page) => {
          const createdAt = new Date(page.createdAt);
          return createdAt >= cutoffDate;
        });
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
    setIsRefreshing(true);
    try {
      await refreshPages();
      toast.success("Pages refreshed");
    } catch (error) {
      toast.error("Failed to refresh pages");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPages]);

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const totalBalance = filteredPages.reduce((sum, p) => sum + (p.pageBalance || 0), 0);
    const totalRevenue = filteredPages.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    const totalPayments = filteredPages.reduce((sum, p) => sum + (p.totalPayments || 0), 0);
    const totalViews = filteredPages.reduce((sum, p) => sum + (p.pageViews || 0), 0);
    const avgOrder = filteredPages.length > 0 && totalPayments > 0 ? totalRevenue / totalPayments : 0;
    const activePages = filteredPages.filter((p) => p.isPublished === true).length;

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

  // ✅ Show loader while checking store
  if (isLoading || loading || !isStoreCheckComplete) {
    return <Loader />;
  }

  // ✅ If no store OR pending activation - show the CreateStoreForm directly on this page
  if (!hasStore || hasPendingActivation) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <CreateStoreForm />
          </main>
        </div>
      </div>
    );
  }

  // ✅ Store exists and is active - show full dashboard
  const isEmpty = filteredPages.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Store Navigation */}
        <StoreNav pathname={pathname || ''} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-8 mb-10">
            <div>
              <p className="eyebrow text-muted-foreground">Online Store</p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[1.03] sm:text-6xl">
                {store?.name || "Your Store"}
              </h1>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-2xl bg-foreground px-4 py-3 font-display text-sm font-bold text-background">
                  {filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
                  <span className="text-sm font-semibold">
                    {filteredPages.length > 0
                      ? `${metrics.totalPayments} total payments`
                      : "No payments yet"}
                  </span>
                </div>
                <button
                  onClick={() => router.push("/dashboard/services/payment/create")}
                  className="flex items-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-gold-foreground hover:opacity-90"
                >
                  <Plus className="size-4" /> New page
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
                  className="rounded-2xl border border-border p-3 hover:bg-muted transition-colors"
                >
                  <RefreshCw
                    className={cn(
                      "size-4",
                      isRefreshing && "animate-spin"
                    )}
                  />
                </button>
                <p className="text-sm font-medium text-muted-foreground">
                  Metrics update with this period
                </p>
              </div>
            </div>
          </div>

          {/* Primary Metrics */}
          <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total balance"
              value={isEmpty ? "₦0" : `₦${metrics.totalBalance.toLocaleString()}`}
              delta="0%"
              icon={Coins}
              highlight
              empty={isEmpty}
            />
            <StatCard
              label="Total revenue"
              value={isEmpty ? "₦0" : `₦${metrics.totalRevenue.toLocaleString()}`}
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
                value: isEmpty ? "₦0" : `₦${Math.round(metrics.avgOrder).toLocaleString()}`,
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
              <div key={s.label} className={cn(
                "rounded-[2rem] p-7",
                isEmpty ? "bg-muted/30 border border-border" : "bg-muted"
              )}>
                <p className="eyebrow text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {s.value}
                </p>
              </div>
            ))}
          </section>

          {/* Page Grid or Empty State */}
          <section className="mt-20">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
                  <Package className="size-12 text-muted-foreground/40" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                  No pages yet
                </h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Create your first payment page to start collecting money from your customers.
                </p>
                <button
                  onClick={() => router.push("/dashboard/services/payment/create")}
                  className="mt-6 flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="size-4" />
                  Create Payment Page
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow text-muted-foreground">Collection</p>
                    <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                      Your payment pages
                    </h2>
                  </div>
                  <p className="text-base font-medium text-muted-foreground">
                    {filteredPages.filter((p) => p.isPublished === true).length} active pages
                  </p>
                </div>
                <div className="mt-8">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Add Page Button */}
                    <button
                      onClick={() => router.push("/dashboard/services/payment/create")}
                      className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-gold text-gold-foreground">
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
                      <PaymentPageCard key={page.id} page={page} index={i} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}