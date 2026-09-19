"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  Monitor,
  Smartphone,
  Shield,
  Package,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  MessageSquare,
  Sun,
  Moon,
  Calendar,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { LinkConfig } from "@/app/hooks/useStore";
import { useTheme } from "@/app/components/ThemeProvider";

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
export type PreviewPageType =
  | "link"
  | "physical"
  | "digital"
  | "school"
  | "donation"
  | "services"
  | "real_estate"
  | "stock"
  | "savings"
  | "crypto";

export interface PreviewData {
  title: string;
  description: string;
  productImage: string | null;
  productImages?: string[];
  price: number;
  priceType: "fixed" | "installment";
  installmentCount?: number;
  installmentAmount?: number;
  installmentPeriod?: string;
  amountMode: "fixed" | "variable";
  storeName: string;
  storeSlug: string;
  config?: Partial<LinkConfig>;
  pageType?: PreviewPageType;
  // Extras
  suggestedAmounts?: number[];
  minimumDonation?: number;
  variants?: Array<{ name: string; price: number; stock?: number | string }>;
  entities?: Array<{
    id: string;
    name: string;
    metadata?: { className?: string };
    remainingBalance?: number;
    isFullyPaid?: boolean;
    isPartiallyPaid?: boolean;
    paidAmount?: number;
    totalAmount?: number;
  }>;
  stock?: number | null;
  allowMultiple?: boolean;
  requiresShipping?: boolean;
  emailDelivery?: boolean;
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
  minimumAmount?: string;
  expectedReturn?: string;
  tenure?: string;
}

interface CustomerPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: PreviewData;
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatHtml = (html: string) =>
  html
    .replace(/<p>/g, '<p class="mb-3">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-1 my-2">')
    .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-1 my-2">')
    .replace(/<li>/g, '<li class="mb-1">');

const TYPE_LABELS: Record<PreviewPageType, string> = {
  link: "Payment Link",
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
};

// ────────────────────────────────────────────────────────────
// PREVIEW FRAME (browser chrome)
// ────────────────────────────────────────────────────────────
function PreviewFrame({
  data,
  device,
}: {
  data: PreviewData;
  device: "desktop" | "mobile";
}) {
  const url =
    data.storeSlug && data.title
      ? `/store/${data.storeSlug}/${slugify(data.title)}`
      : "/store/your-store/your-page";

  return (
    <div
      className={`mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all ${
        device === "mobile" ? "w-[375px] max-w-full" : "w-full max-w-[1200px]"
      }`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-2 flex-1 truncate rounded-md bg-background px-3 py-1 text-xs text-foreground/50">
          {url}
        </div>
      </div>

      {/* Page content */}
      <div className="max-h-[70vh] overflow-y-auto">
        <StorePreviewContent data={data} device={device} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// STORE PREVIEW CONTENT
// ────────────────────────────────────────────────────────────
function StorePreviewContent({
  data,
  device,
}: {
  data: PreviewData;
  device: "desktop" | "mobile";
}) {
  const isMobile = device === "mobile";
  const isInstallment =
    data.priceType === "installment" &&
    data.amountMode === "fixed" &&
    (data.installmentCount || 0) > 1;

  const totalPrice = Number(data.price) || 0;
  const instCount = Math.max(1, Number(data.installmentCount) || 1);
  const perInstallment =
    data.installmentAmount && data.installmentAmount > 0
      ? data.installmentAmount
      : totalPrice / instCount;

  const typeLabel = data.pageType ? TYPE_LABELS[data.pageType] : "Product";

  const isDonation = data.pageType === "donation";
  const isSchool = data.pageType === "school";
  const isPhysical = data.pageType === "physical";
  const isDigital = data.pageType === "digital";
  const isServices = data.pageType === "services";
  const isInvestment =
    data.pageType === "real_estate" ||
    data.pageType === "stock" ||
    data.pageType === "savings" ||
    data.pageType === "crypto";

  const galleryImages =
    data.productImages && data.productImages.length > 0
      ? data.productImages
      : data.productImage
        ? [data.productImage]
        : [];

  const [currentImage, setCurrentImage] = useState(0);
  const currentImg = galleryImages[currentImage];

  const stockNum =
    data.stock != null && String(data.stock).trim() !== ""
      ? Number(data.stock)
      : null;
  const hasStock = stockNum !== null && Number.isFinite(stockNum);
  const isOutOfStock = hasStock && stockNum! <= 0;

  const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  // Period label
  const periodLabel =
    data.installmentPeriod === "weekly"
      ? "week"
      : data.installmentPeriod === "bi-weekly"
        ? "2 weeks"
        : "month";

  return (
    <div className="min-h-[500px] bg-background text-foreground">
      {/* Header */}
      <div
        className={`mx-auto flex h-16 items-center justify-between ${
          isMobile ? "px-4" : "max-w-[1200px] px-8"
        }`}
      >
        <span className="text-sm font-semibold tracking-widest uppercase">
          {data.storeName || "YOUR STORE"}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground/60">
          Go to store
        </span>
      </div>

      {/* Main grid */}
      <section
        className={`mx-auto grid gap-8 pb-16 pt-4 ${
          isMobile
            ? "grid-cols-1 px-4"
            : "max-w-[1200px] grid-cols-[minmax(300px,1fr)_minmax(360px,1.5fr)] gap-10 px-8"
        }`}
      >
        {/* Image gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
            {currentImg ? (
              <img
                src={currentImg}
                alt={data.title || "Product"}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-foreground/20">
                <Package className="h-20 w-20" />
              </div>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentImage(i)}
                  className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === currentImage
                      ? "border-[#FDC020]"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="w-fit rounded-full border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            {typeLabel}
          </span>

          <h1
            className={`mt-4 text-pretty font-semibold leading-tight tracking-tight ${
              isMobile ? "text-2xl" : "text-3xl lg:text-[40px]"
            }`}
          >
            {data.title || "Untitled"}
          </h1>

          <p className="mt-3 text-sm text-foreground/50">
            {data.storeName || "Your Store"}
          </p>

          {/* Stock badge */}
          {(isPhysical || isDigital || isServices) && hasStock && (
            <div className="mt-4">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Out of stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
                  <Package className="h-3.5 w-3.5" />
                  {stockNum!.toLocaleString()}{" "}
                  {stockNum === 1 ? "unit" : "units"} available
                </span>
              )}
            </div>
          )}

          {/* ─── DONATION ─── */}
          {isDonation && (
            <div className="mt-6 space-y-4">
              {data.suggestedAmounts && data.suggestedAmounts.length > 0 && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Suggested amounts
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {data.suggestedAmounts.map((amt) => (
                      <span
                        key={amt}
                        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground/70"
                      >
                        {formatNaira(amt)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Amount (min {formatNaira(data.minimumDonation || 100)})
                </Label>
                <Input
                  type="number"
                  placeholder={`${data.minimumDonation || 100}`}
                  disabled
                />
              </div>
            </div>
          )}

          {/* ─── SCHOOL ─── */}
          {isSchool && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-foreground/60" />
                <h3 className="text-sm font-semibold">Students</h3>
                <span className="ml-auto text-xs text-foreground/50">
                  {data.entities?.length || 0} student(s)
                </span>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {(data.entities || []).slice(0, 5).map((entity, i) => (
                  <div
                    key={entity.id || i}
                    className={`rounded-lg border p-3 ${
                      entity.isFullyPaid
                        ? "border-green-500 bg-green-500/10"
                        : entity.isPartiallyPaid
                          ? "border-[#FDC020] bg-[#FDC020]/5"
                          : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {entity.name || `Student ${i + 1}`}
                        </p>
                        {entity.metadata?.className && (
                          <p className="mt-0.5 text-xs text-foreground/50">
                            Class {entity.metadata.className}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {formatNaira(
                            entity.remainingBalance ??
                              entity.totalAmount ??
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!data.entities || data.entities.length === 0) && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-foreground/40">
                    Student list will appear here
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── PRICE (non-school, non-donation, fixed mode) ─── */}
          {!isSchool &&
            !isDonation &&
            data.amountMode === "fixed" &&
            totalPrice > 0 && (
              <div className="mt-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-[#191919] dark:text-[#FDC020]">
                    {formatNaira(isInstallment ? perInstallment : totalPrice)}
                  </span>
                  {isInstallment && (
                    <span className="text-sm text-foreground/50">
                      per {periodLabel} · {instCount} payments
                    </span>
                  )}
                </div>

                {isInstallment && (
                  <p className="mt-2 text-xs text-foreground/50">
                    Total:{" "}
                    <strong className="text-foreground/80">
                      {formatNaira(totalPrice)}
                    </strong>{" "}
                    · Pay over {instCount} {periodLabel}s
                  </p>
                )}
              </div>
            )}

          {/* ─── INSTALLMENT CARD ─── */}
          {isInstallment && !isSchool && !isDonation && (
            <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-foreground/60" />
                <p className="text-sm font-semibold">Installment Plan</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Payment amount</span>
                  <span className="font-medium">
                    {formatNaira(perInstallment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Frequency</span>
                  <span className="font-medium capitalize">
                    {data.installmentPeriod || "monthly"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">
                    Number of payments
                  </span>
                  <span className="font-medium">{instCount}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">
                    {formatNaira(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── VARIABLE amount ─── */}
          {!isSchool && !isDonation && data.amountMode === "variable" && (
            <div className="mt-5">
              <span className="text-2xl font-semibold text-foreground/70">
                Enter amount
              </span>
              <p className="mt-1 text-sm text-foreground/50">
                Customer chooses how much to pay
              </p>
            </div>
          )}

          {/* ─── PHYSICAL variants ─── */}
          {isPhysical && data.variants && data.variants.length > 0 && (
            <div className="mt-6">
              <Label className="mb-2 block text-sm font-medium">
                Select variant
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {data.variants.map((v, idx) => {
                  const variantPrice = Number(v.price) || 0;
                  const displayVariantPrice = isInstallment
                    ? variantPrice / instCount
                    : variantPrice;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border p-3 text-center"
                    >
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="mt-1 text-sm text-foreground/60">
                        {formatNaira(displayVariantPrice)}
                        {isInstallment && (
                          <span className="ml-1 text-xs text-foreground/40">
                            / {periodLabel}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── DIGITAL notice ─── */}
          {isDigital && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-foreground/70">
                {data.emailDelivery
                  ? "Download link will be sent to your email"
                  : "Access will be granted after payment"}
              </p>
            </div>
          )}

          {/* ─── PHYSICAL shipping notice ─── */}
          {isPhysical && data.requiresShipping && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-foreground/70">
                Delivery address required at checkout
              </p>
            </div>
          )}

          {/* ─── SERVICES booking notice ─── */}
          {isServices && data.bookingEnabled && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#FDC020]/40 bg-[#FDC020]/5 p-3">
              <Clock className="h-3.5 w-3.5 text-[#FDC020] shrink-0" />
              <p className="text-xs text-foreground/80">
                Booking required — customer will pick a date & time
              </p>
            </div>
          )}

          {/* ─── SERVICES customer note ─── */}
          {isServices && data.customerNoteEnabled && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <MessageSquare className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
              <p className="text-xs text-foreground/70">
                Customer can leave a note at checkout
              </p>
            </div>
          )}

          {/* ─── INVESTMENT details ─── */}
          {isInvestment && (
            <div className="mt-6 rounded-xl border border-[#FDC020]/30 bg-[#FDC020]/5 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#FDC020]" />
                <p className="text-sm font-bold">Investment Details</p>
              </div>
              {data.minimumAmount && (
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/60">Minimum</span>
                  <span className="font-medium">
                    {formatNaira(Number(data.minimumAmount))}
                  </span>
                </div>
              )}
              {data.expectedReturn && (
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/60">Expected return</span>
                  <span className="font-medium">{data.expectedReturn}</span>
                </div>
              )}
              {data.tenure && (
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/60">Tenure</span>
                  <span className="font-medium">{data.tenure}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── DESCRIPTION ─── */}
          {data.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="mb-4 text-sm font-semibold">
                <span className="inline-block border-b-2 border-[#FDC020] pb-2">
                  Details
                </span>
              </h2>
              <div
                className="max-h-40 overflow-hidden text-sm leading-7 text-foreground/70"
                dangerouslySetInnerHTML={{
                  __html: formatHtml(data.description),
                }}
              />
            </div>
          )}

          {/* ─── CTA ─── */}
          <button
            type="button"
            disabled={isOutOfStock}
            className="mt-8 w-full rounded-lg py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: data.config?.buttonColor || "#FDC020",
              color: "#191919",
            }}
          >
            {isOutOfStock
              ? "Out of stock"
              : isDonation
                ? "Donate now"
                : isInstallment
                  ? `Pay ${formatNaira(perInstallment)} now`
                  : data.config?.buttonText || "Pay Now"}
          </button>

          {/* Secured badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground/40">
            <Shield className="h-3.5 w-3.5" />
            Secured checkout
          </div>
        </div>
      </section>

      {/* Powered by */}
      <div className="pointer-events-none fixed bottom-4 left-4 rounded-full border border-border bg-background px-4 py-2 text-xs text-foreground/50">
        Powered by <span className="font-medium text-foreground">Zidwell</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN MODAL (with dark mode toggle)
// ────────────────────────────────────────────────────────────
export function CustomerPreview({
  isOpen,
  onClose,
  data,
}: CustomerPreviewProps) {
  const { theme, setTheme } = useTheme();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Lock scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black/70 backdrop-blur-sm"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[var(--color-accent-yellow)]" />
              <span className="text-sm font-semibold">Customer Preview</span>
              <span className="rounded-full bg-[var(--color-accent-yellow)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent-yellow)]">
                Live
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-muted"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </>
                )}
              </button>

              {/* Device toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    device === "desktop"
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                      : "text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    device === "mobile"
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                      : "text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-foreground/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <PreviewFrame data={data} device={device} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}