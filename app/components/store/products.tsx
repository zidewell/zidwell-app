"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, ExternalLink, QrCode, Link2, Trash2, EyeOff, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useStore } from "@/app/context/StoreContext";
import Loader from "@/app/components/Loader";
import { CreateStoreForm } from "@/app/components/store/create-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function compactNumber(n: number): string {
  const v = Number(n) || 0;
  if (Math.abs(v) < 1000) return v.toString();
  if (Math.abs(v) < 1_000_000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  if (Math.abs(v) < 1_000_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(v) < 1_000_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)}B`;
  return `${(v / 1_000_000_000_000).toFixed(1)}T`;
}

function formatPrice(n: number): string {
  const v = Number(n) || 0;
  const full = v.toLocaleString();
  if (full.length <= 12) return full;
  return compactNumber(v);
}

// ─── Product Card ───
function ProductCard({
  product,
  index,
  storeSlug,
  onRefresh,
}: {
  product: any;
  index: number;
  storeSlug?: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { updatePage } = useStore();

  const getFullUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/store/${storeSlug || ""}/${product.slug || product.id}`;
  };

  const isActive = product.isPublished === true;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/services/payment/edit/${product.id}`);
  };

  const handleViewPublic = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getFullUrl(), "_blank");
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(getFullUrl());
    toast.success("Product URL copied");
  };

  const handleDownloadQR = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("QR code download coming soon");
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      icon: "question",
      title: isActive ? "Deactivate product?" : "Activate product?",
      text: `"${product.title}" will ${isActive ? "no longer" : "now"} be visible to customers.`,
      showCancelButton: true,
      confirmButtonColor: isActive ? "#ef4444" : "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: isActive ? "Yes, Deactivate" : "Yes, Activate",
    });
    if (!result.isConfirmed) return;
    try {
      await updatePage(product.id, { isPublished: !isActive });
      toast.success(`Product ${!isActive ? "activated" : "deactivated"}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete product?",
      html: `<p>Are you sure you want to delete <b>${product.title}</b>?</p><p class="text-sm text-gray-600 mt-2">This action cannot be undone.</p>`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/payment-page/delete/${product.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      toast.success(`"${product.title}" deleted`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  return (
    <article
      onClick={() => router.push(`/dashboard/services/payment/page/${product.id}`)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)] cursor-pointer shadow-sm"
    >
      <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-muted/30">
        {product.coverImage || product.logo || product.productImages?.[0] ? (
          <img
            src={product.coverImage || product.logo || product.productImages[0]}
            alt={product.title}
            className="h-full w-full object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Package className="size-14 text-muted-foreground/40" strokeWidth={1.5} />
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
            isActive ? "bg-background text-foreground" : "bg-foreground text-background"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={`Actions for ${product.title}`}
              className="absolute right-3 top-3 rounded-full bg-background p-2 text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl bg-card border-border shadow-xl">
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
              <Pencil className="size-4 mr-2" /> Edit product
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
              className={cn("cursor-pointer", isActive ? "text-yellow-600" : "text-green-600")}
            >
              <EyeOff className="size-4 mr-2" /> {isActive ? "Make inactive" : "Make active"}
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
          {product.pageType || "Product"}
        </p>
        <h3
          className="mt-1 font-display text-lg font-bold leading-tight line-clamp-2 break-words"
          title={product.title}
        >
          {product.title}
        </h3>
        <p
          className="mt-2 font-display text-xl font-bold tabular-nums break-all"
          title={`₦${(product.price || 0).toLocaleString()}`}
        >
          ₦{formatPrice(product.price || 0)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border px-1 pt-3 text-sm font-semibold text-muted-foreground">
        <span className="truncate tabular-nums" title={`${product.totalPayments || 0} sales`}>
          {compactNumber(product.totalPayments || 0)} sales
        </span>
        <span className="truncate tabular-nums" title={`${product.pageViews || 0} views`}>
          {compactNumber(product.pageViews || 0)} views
        </span>
      </div>
    </article>
  );
}

// ─── Main Grid ───
export function ProductGrid() {
  const router = useRouter();
  const {
    store,
    pages,
    loading,
    hasStore,
    hasPendingActivation,
    isStoreCheckComplete,
    fetchStore,
    fetchPages,
    refreshPages,
  } = useStore();

  // ─── Explicit load sequence (mirrors PaymentDashboardPage) ───
  const [isCheckingStore, setIsCheckingStore] = useState(true);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const lastRefreshTime = useRef(0);
  const MIN_REFRESH_INTERVAL = 2000;

  // STEP 1: Ensure store is checked
  useEffect(() => {
    let mounted = true;
    const checkStore = async () => {
      try {
        // fetchStore() is idempotent — returns early if storeRef is set
        await fetchStore();
      } catch (err) {
        console.error("ProductGrid: fetchStore failed", err);
      } finally {
        if (mounted) setIsCheckingStore(false);
      }
    };
    checkStore();
    return () => {
      mounted = false;
    };
  }, [fetchStore]);

  // STEP 2: Fetch pages once store check is complete
  useEffect(() => {
    if (isCheckingStore) return;
    if (!isStoreCheckComplete) return;
    if (!hasStore) {
      setIsLoadingPages(false);
      setDataReady(true);
      return;
    }

    let mounted = true;
    const loadPages = async () => {
      setIsLoadingPages(true);
      try {
        // Force a fresh fetch so users always see their full catalog.
        // Without `true`, the cooldown in fetchPages() may skip the call
        // and leave stale/empty data on screen.
        await fetchPages(true);
      } catch (err) {
        console.error("ProductGrid: fetchPages failed", err);
      } finally {
        if (mounted) {
          setIsLoadingPages(false);
          setDataReady(true);
        }
      }
    };
    loadPages();
    return () => {
      mounted = false;
    };
  }, [isCheckingStore, isStoreCheckComplete, hasStore, fetchPages]);

  const products = useMemo(
    () =>
      pages.filter(
        (p) => p.pageType !== "link" && p.pageType !== "donation"
      ),
    [pages]
  );

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    lastRefreshTime.current = now;
    try {
      await refreshPages();
      toast.success("Products refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [refreshPages]);

  const storeSlug = store?.slug || "";
  const activeCount = products.filter((p) => p.isPublished).length;

  // ─── Gates ───
  if (isCheckingStore || loading || !isStoreCheckComplete || !dataReady) {
    return <Loader />;
  }
  if (!hasStore || hasPendingActivation) return <CreateStoreForm />;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <p className="text-base font-medium text-muted-foreground">
          {isLoadingPages
            ? "Loading products…"
            : `${activeCount} active · ${products.length} total`}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-2xl border border-border p-3 hover:bg-muted transition-colors bg-card shadow-sm"
          aria-label="Refresh products"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {isLoadingPages && products.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card p-4 animate-pulse"
            >
              <div className="h-40 rounded-[1.5rem] bg-muted/50" />
              <div className="mt-4 h-4 w-24 bg-muted/50 rounded" />
              <div className="mt-2 h-6 w-32 bg-muted/50 rounded" />
              <div className="mt-2 h-6 w-20 bg-muted/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => router.push("/dashboard/services/payment/create")}
            className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground bg-card shadow-sm"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Plus className="size-6" strokeWidth={2.6} />
            </span>
            <span className="font-display text-base font-bold">Add product</span>
            <span className="max-w-[180px] text-center text-sm">
              List a new item on your storefront
            </span>
          </button>
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              storeSlug={storeSlug}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </>
  );
}