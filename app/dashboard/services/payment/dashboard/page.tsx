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
  Waves,
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
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

// Store Navigation Component
export const STORE_LINKS = [
  { label: "Overview", href: "/dashboard/services/payment/dashboard", icon: Store },
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
            highlight ? "bg-primary text-primary-foreground" : "bg-muted"
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
      <p className="mt-2 font-display text-[2.1rem] font-bold leading-none tracking-tight">
        {empty ? "—" : value}
      </p>
    </motion.div>
  );
}

// Payment Page Card Component with Working Toggle
function PaymentPageCard({ page, index, storeSlug, onRefresh }: { 
  page: any; 
  index: number; 
  storeSlug?: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { updatePage } = useStore();

  const getPageUrl = () => {
    return `/store/${storeSlug || ''}/${page.slug || page.id}`;
  };

  // ✅ Get full URL with origin
  const getFullPageUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = getPageUrl();
    return `${origin}${path}`;
  };

  const isActive = page.isPublished === true;

  // Strip HTML tags from description
  const stripHtml = (html: string) => {
    if (!html) return "No description";
    if (typeof window !== 'undefined') {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "No description";
    }
    return html.replace(/<[^>]*>/g, '').trim() || "No description";
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/services/payment/edit/${page.id}`);
  };

  // ✅ Toggle Active/Inactive
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
        toast.success(`Page ${newStatus ? 'activated' : 'deactivated'} successfully!`);
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

  // ✅ Copy full URL with origin
  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = getFullPageUrl();
    navigator.clipboard?.writeText(fullUrl);
    toast.success("Page URL copied to clipboard!");
  };

  const handleViewPublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = getFullPageUrl();
    window.open(fullUrl, "_blank");
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
      onClick={() => router.push(`/dashboard/services/payment/page/${page.id}`)}
      className="group flex flex-col rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)] cursor-pointer"
    >
      <div className="relative flex h-40 items-center justify-center rounded-[1.5rem] bg-muted/30">
        {page.coverImage ? (
          <img
            src={page.coverImage}
            alt={page.title}
            className="w-full h-full object-cover rounded-[1.5rem] group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : page.productImages && page.productImages.length > 0 ? (
          <img
            src={page.productImages[0]}
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
              className="absolute right-3 top-3 rounded-full bg-background p-2 text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="size-4 mr-2" /> Edit page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewPublic} className="cursor-pointer">
              <ExternalLink className="size-4 mr-2" /> View public link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadQR} className="cursor-pointer">
              <QrCode className="size-4 mr-2" /> Download QR code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyUrl} className="cursor-pointer">
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

      <div className="mt-4 flex-1 px-1">
        <p className="eyebrow text-muted-foreground">
          {page.pageType || "Payment"}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight">
          {page.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
          {stripHtml(page.description)}
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

// Greeting Component
function Greeting({ storeName, firstName }: { storeName?: string; firstName?: string }) {
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
  const storeSlug = storeName ? storeName.toLowerCase().replace(/\s+/g, '-') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Waves className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {greeting}, {displayName} {emoji}
          </h1>
          {storeName && (
            <p className="text-sm text-muted-foreground mt-1">
              Welcome to <span className="text-primary font-medium">{storeName}</span>
            </p>
          )}
        </div>
      </div>
     
    </motion.div>
  );
}

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
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
  const { userData } = useUserContextData();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [range, setRange] = useState<DateRange | undefined>();
  const [filteredPages, setFilteredPages] = useState<any[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isStoreCheckComplete, setIsStoreCheckComplete] = useState(false);

  // Show loader first, then check store status
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

  // Load pages when store is active
  useEffect(() => {
    if (hasStore && isStoreCheckComplete && !isLoading) {
      fetchPages().finally(() => {
        setInitialLoadComplete(true);
      });
    }
  }, [hasStore, isStoreCheckComplete, isLoading, fetchPages]);

  // Filter pages based on selected period
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

  const handlePageRefresh = useCallback(() => {
    refreshPages();
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

  // ✅ Show full page loader only during initial auth check
  if (isLoading || loading || !isStoreCheckComplete) {
    return <Loader />;
  }

  // If no store OR pending activation - show CreateStoreForm
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

  // Store exists and is active - show full dashboard
  const isEmpty = filteredPages.length === 0;

  // Get user's first name for greeting
  const firstName = userData?.full_name?.split(' ')[0] || userData?.first_name || '';
  const storeName = store?.name || '';
  const storeSlug = store?.slug || '';

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Store Navigation */}
        <StoreNav pathname={pathname || ''} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ✅ Show component loader while pages are loading */}
          {!initialLoadComplete && filteredPages.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader />
            </div>
          ) : (
            <>
              {/* Header with Greeting */}
              <div className="flex flex-wrap items-start justify-between gap-8 mb-10">
                <div>
                  <p className="eyebrow text-muted-foreground">Online Store</p>
                  <Greeting storeName={storeName} firstName={firstName} />
                  <div className="mt-7 flex items-center gap-3 w-full">
                    {/* ✅ Visit storefront - outline style */}
                    <a
                      href={`/store/${storeSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-transparent px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200"
                    >
                      <ExternalLink className="size-4" />
                      Visit storefront
                    </a>
                    {/* ✅ Add New product - solid primary style */}
                    <button
                      onClick={() => router.push("/dashboard/services/payment/create")}
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
                      className="mt-6 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
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
                          Your Store Products
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}