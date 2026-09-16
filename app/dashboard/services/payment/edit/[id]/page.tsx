// app/dashboard/services/payment/edit/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  ImagePlus,
  AlertCircle,
  Eye,
  Plus,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { useStore, Student, FeeItem, Variant } from "@/app/hooks/useStore";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

const typeLabels: Record<string, string> = {
  school: "School Fees",
  donation: "Donation",
  physical: "Physical Product",
  digital: "Digital Product",
  services: "Service",
  real_estate: "Real Estate Investment",
  stock: "Stock Investment",
  savings: "Savings / Ajo",
  crypto: "Crypto Investment",
  link: "Payment Link",
};

const IMAGE_SPECS = "1350 x 1080 (5:4) — max 10MB";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ZIDWELL_FEE_RATE = 0.03;

async function uploadImageIfNeeded(
  image: string,
  type: string,
): Promise<string | null> {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (!image.startsWith("data:image")) {
    return null;
  }

  try {
    const res = await fetch("/api/payment-page/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, type }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

// ============================================================
// HELPERS
// ============================================================
function formatNaira(amount: number) {
  return `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ============================================================
// UNIFIED PRICING SUMMARY CARD
// Variant-aware when the page is physical with priced variants.
// ============================================================
function PricingSummaryCard({
  priceType,
  price,
  installmentCount,
  installmentPeriod,
  installmentAmount,
  variants,
  isPhysicalWithVariants,
}: {
  priceType: "fixed" | "installment";
  price: number;
  installmentCount: string;
  installmentPeriod: string;
  installmentAmount: number;
  variants?: { name: string; price: number }[];
  isPhysicalWithVariants?: boolean;
}) {
  if (price <= 0 && !isPhysicalWithVariants) return null;

  const isInstallment =
    priceType === "installment" && Number(installmentCount) > 1;
  const count = Math.max(1, Number(installmentCount) || 1);

  // ─────────────────────────────────────────────────────────────
  // VARIANT-AWARE MODE
  // Physical products with variants: show per-variant per-payment
  // amounts. The single "per installment" number is meaningless
  // because it depends on which variant the buyer picks.
  // ─────────────────────────────────────────────────────────────
  if (isPhysicalWithVariants && variants && variants.length > 0) {
    const pricedVariants = variants.filter((v) => Number(v.price) > 0);
    if (pricedVariants.length === 0) return null;

    return (
      <div className="rounded-2xl border border-[#FDC020]/30 bg-[#FDC020]/5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#FDC020]/10 border-b border-[#FDC020]/20">
          <Info className="h-4 w-4 text-[#FDC020]" />
          <h4 className="text-sm font-bold text-foreground">
            {isInstallment ? "Installment Plan Summary" : "Payment Summary"}
          </h4>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {pricedVariants.map((v, i) => {
              const variantTotal = Number(v.price) || 0;
              const variantFee = variantTotal * ZIDWELL_FEE_RATE;
              const variantNet = variantTotal - variantFee;

              const perPaymentBuyer = isInstallment
                ? variantTotal / count
                : variantTotal;
              const perPaymentFee = isInstallment
                ? perPaymentBuyer * ZIDWELL_FEE_RATE
                : variantFee;
              const perPaymentNet = perPaymentBuyer - perPaymentFee;

              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <p className="text-xs font-bold text-foreground mb-2">
                    {v.name || `Variant ${i + 1}`}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">
                        {isInstallment ? "Per payment (buyer)" : "Buyer pays"}
                      </p>
                      <p className="font-bold text-foreground">
                        {formatNaira(perPaymentBuyer)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">
                        {isInstallment ? "Per payment (you)" : "You receive"}
                      </p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatNaira(perPaymentNet)}
                      </p>
                    </div>
                  </div>

                  {isInstallment && (
                    <div className="mt-2 pt-2 border-t border-border text-xs flex justify-between">
                      <span className="text-muted-foreground">
                        Total across {count} payments
                      </span>
                      <span className="font-bold text-foreground">
                        {formatNaira(variantTotal)}{" "}
                        <span className="text-muted-foreground font-normal">
                          (you get {formatNaira(variantNet)})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-[#FDC020]/20">
            ✓ Buyers pay the price of the variant they pick. The 3% fee is
            deducted from your payout — you never charge the buyer extra.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DEFAULT MODE (non-variant pages)
  // ─────────────────────────────────────────────────────────────
  const fee = price * ZIDWELL_FEE_RATE;
  const youReceiveTotal = price - fee;
  const perInstallmentFee = isInstallment
    ? installmentAmount * ZIDWELL_FEE_RATE
    : 0;
  const youReceivePerInstallment = isInstallment
    ? installmentAmount - perInstallmentFee
    : 0;

  return (
    <div className="rounded-2xl border border-[#FDC020]/30 bg-[#FDC020]/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#FDC020]/10 border-b border-[#FDC020]/20">
        <Info className="h-4 w-4 text-[#FDC020]" />
        <h4 className="text-sm font-bold text-foreground">
          {isInstallment ? "Installment Plan Summary" : "Payment Summary"}
        </h4>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            What the buyer pays
          </p>
          <div className="space-y-1.5">
            {isInstallment && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Per installment ({installmentCount}× {installmentPeriod})
                </span>
                <span className="font-bold text-foreground">
                  {formatNaira(installmentAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isInstallment ? "Total across all installments" : "Amount"}
              </span>
              <span className="font-bold text-foreground">
                {formatNaira(price)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#FDC020]/20" />

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            What you receive
          </p>
          <div className="space-y-1.5">
            {isInstallment && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Per installment</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatNaira(youReceivePerInstallment)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isInstallment
                  ? "Total across all installments"
                  : "Total payout"}
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatNaira(youReceiveTotal)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-[#FDC020]/20">
          ✓ The buyer pays exactly the amount shown. The 3% fee is deducted from
          your payout — you never charge the buyer extra.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const EditPaymentPage = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { updatePage, getPageDetails } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);

  // ─── Form state ───
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"fixed" | "installment">("fixed");
  const [installmentCount, setInstallmentCount] = useState("3");
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");

  // ─── School fields ───
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  // ─── Digital fields ───
  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessLink, setAccessLink] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);

  // ─── Physical fields ───
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);

  // ─── Services fields ───
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [customerNoteEnabled, setCustomerNoteEnabled] = useState(true);

  // ─── Stock ───
  const [stock, setStock] = useState<number | null>(null);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const productRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = async () => {
    try {
      const pageData = await getPageDetails(id);
      if (!pageData) return;

      setPage(pageData);
      setTitle(pageData.title || "");
      setDescription(pageData.description || "");
      setProductImages(pageData.productImages || []);
      setPrice(pageData.price?.toString() || "");
      setPriceType(
        pageData.priceType === "installment" ? "installment" : "fixed",
      );
      setInstallmentCount(pageData.installmentCount?.toString() || "3");

      const meta = pageData.metadata || {};

      // School
      setStudents(meta.students || []);
      setSchoolClass(meta.className || "");
      setFeeBreakdown(meta.feeBreakdown || []);
      setRequiredFields(meta.requiredFields || []);

      // Installment
      if (meta.installmentPeriod) setInstallmentPeriod(meta.installmentPeriod);
      if (meta.installmentAmount)
        setInstallmentAmount(Number(meta.installmentAmount));

      // Digital
      if (meta.downloadUrl !== undefined)
        setDownloadUrl(meta.downloadUrl || "");
      if (meta.accessLink !== undefined) setAccessLink(meta.accessLink || "");
      if (meta.emailDelivery !== undefined)
        setEmailDelivery(meta.emailDelivery !== false);

      // Physical
      if (meta.requiresShipping !== undefined) {
        setRequiresShipping(meta.requiresShipping !== false);
      }
      if (Array.isArray(meta.variants)) {
        // Strip dashboard-only fields to keep state clean
        setVariants(
          meta.variants.map((v: any) => ({
            name: v.name || "",
            price: Number(v.price) || 0,
            sku: v.sku || "",
            stock:
              v.stock === null || v.stock === undefined || v.stock === ""
                ? undefined
                : Number(v.stock),
          })),
        );
      }

      // Services
      if (meta.bookingEnabled !== undefined) {
        setBookingEnabled(meta.bookingEnabled === true);
      }
      if (meta.customerNoteEnabled !== undefined) {
        setCustomerNoteEnabled(meta.customerNoteEnabled !== false);
      }

      // Stock
      if (meta.stock !== undefined && meta.stock !== null) {
        setStock(Number(meta.stock));
      }
      if (meta.allowMultiple !== undefined) {
        setAllowMultiple(meta.allowMultiple !== false);
      }
    } catch (error: any) {
      console.error("Error loading page:", error);
      await Swal.fire({
        icon: "error",
        title: "Failed to Load",
        text: error.message || "Could not load the page data.",
        confirmButtonColor: "#FDC020",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const total = Number(price) || 0;
    const count = Number(installmentCount) || 1;
    if (total > 0 && count > 0) {
      setInstallmentAmount(Math.round((total / count) * 100) / 100);
    } else {
      setInstallmentAmount(0);
    }
  }, [price, installmentCount]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const processFile = (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        if (file.size > MAX_IMAGE_BYTES) {
          Swal.fire({
            icon: "warning",
            title: "File Too Large",
            text: `"${file.name}" exceeds 10MB. Please compress it.`,
            confirmButtonColor: "#FDC020",
          });
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string) || null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    };

    Promise.all(Array.from(files).map(processFile)).then((results) => {
      const valid = results.filter((r): r is string => r !== null);
      if (valid.length > 0) {
        setProductImages((prev) => [...prev, ...valid]);
      }
    });

    e.target.value = "";
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────────────────────────────
  // VARIANT HELPERS
  // ─────────────────────────────────────────────────────────────────────
  const isPhysical = page?.pageType === "physical";
  const hasVariants = variants.length > 0;

  // Only a POSITIVE number is a real stock cap
  const variantStockValues = variants
    .map((v) => {
      const raw = v?.stock;
      const parsed = raw != null && raw !== "" ? Number(raw) : NaN;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    })
    .filter((n): n is number => n !== null);

  const variantSum = variantStockValues.reduce((s, n) => s + n, 0);

  const hasRealPageStock = stock !== null && Number(stock) > 0;
  const allVariantsCounted = variantStockValues.length === variants.length;
  const someVariantsCounted = variantStockValues.length > 0;

  const overAllocated =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum > Number(stock);

  const mixedAllocation =
    hasVariants &&
    hasRealPageStock &&
    someVariantsCounted &&
    !allVariantsCounted;

  const underAllocated =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum < Number(stock);

  const allocationBalanced =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum === Number(stock);

  // ✅ Every variant priced → page amount is dead data
  const everyVariantPriced =
    isPhysical &&
    hasVariants &&
    variants.every((v) => {
      const p = Number(v?.price);
      return Number.isFinite(p) && p > 0;
    });

  // ─── Auto-sync page price to sum of variant prices when all priced ───
  useEffect(() => {
    if (!isPhysical || variants.length === 0) return;
    const allPriced = variants.every((v) => Number(v?.price) > 0);
    if (!allPriced) return;

    const total = variants.reduce((sum, v) => sum + (Number(v?.price) || 0), 0);

    setPrice((prev) => {
      const current = Number(prev);
      if (Number.isFinite(current) && current === total) return prev;
      return String(total);
    });
  }, [isPhysical, variants]);

  const addVariant = () => {
    const isFirstVariant = variants.length === 0;
    const suggestedStock =
      isFirstVariant && hasRealPageStock ? Number(stock) : undefined;

    setVariants([
      ...variants,
      {
        name: "",
        price: Number(price) || 0,
        sku: "",
        stock: suggestedStock as any,
      },
    ]);
  };

  const updateVariant = (i: number, patch: Partial<Variant>) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], ...patch };
    setVariants(updated);
  };

  const removeVariant = (i: number) => {
    setVariants(variants.filter((_, idx) => idx !== i));
  };

  const hasPriceDrift = (v: Variant): boolean => {
    const variantPrice = Number(v.price) || 0;
    const basePrice = Number(price) || 0;
    if (variantPrice <= 0 || basePrice <= 0) return false;
    const ratio = variantPrice / basePrice;
    return ratio < 0.2 || ratio > 5;
  };

  const priceDisplayValue = (v: Variant): string | number => {
    const p = v?.price;
    if (p === 0 || p === null || p === undefined) return "";
    const n = Number(p);
    return Number.isFinite(n) && n !== 0 ? n : "";
  };

  const stockDisplayValue = (v: Variant): string | number => {
    const s = v?.stock;
    if (s === 0 || s === null || s === undefined || s === "") return "";
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : "";
  };

  // ─────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter a page title before saving.",
        confirmButtonColor: "#FDC020",
      });
      return;
    }

    // Physical variant validation
    if (page?.pageType === "physical" && variants.length > 0) {
      const blankName = variants.some((v) => !v.name || !v.name.trim());
      if (blankName) {
        await Swal.fire({
          icon: "warning",
          title: "Variant Name Required",
          text: "Every variant needs a name.",
          confirmButtonColor: "#FDC020",
        });
        return;
      }
      if (overAllocated) {
        await Swal.fire({
          icon: "warning",
          title: "Variant Stock Exceeds Page Stock",
          text: `Variants total ${variantSum}, but page stock is ${stock}. Reduce variant stocks or raise page stock.`,
          confirmButtonColor: "#FDC020",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const uploadedProductImages: string[] = [];
      for (const img of productImages) {
        const url = await uploadImageIfNeeded(img, "products");
        if (url) uploadedProductImages.push(url);
      }

      const existingMeta = page?.metadata || {};
      const metadata: any = {
        ...existingMeta,
      };

      // School
      if (page?.pageType === "school") {
        metadata.students = students;
        metadata.className = schoolClass;
        metadata.feeBreakdown = feeBreakdown;
        metadata.requiredFields = requiredFields;
      }

      // Digital
      if (page?.pageType === "digital") {
        metadata.downloadUrl = downloadUrl || null;
        metadata.accessLink = accessLink || null;
        metadata.emailDelivery = emailDelivery;
      }

      // Physical
      if (page?.pageType === "physical") {
        metadata.requiresShipping = requiresShipping;
        // Save variants (strip out any dashboard-only fields)
        metadata.variants = variants.map((v) => {
          const { priceOverridden, ...rest } = v as any;
          // Store stock as a number OR null. Never NaN, never "".
          const cleanedStock =
            rest.stock === null || rest.stock === undefined || rest.stock === ""
              ? null
              : Number(rest.stock);
          return {
            name: rest.name || "",
            price: Number(rest.price) || 0,
            sku: rest.sku || "",
            stock: cleanedStock,
          };
        });
      }

      // Services
      if (page?.pageType === "services") {
        metadata.bookingEnabled = bookingEnabled;
        metadata.customerNoteEnabled = customerNoteEnabled;
      }

      // Stock (physical, digital, services, investments)
      if (
        [
          "physical",
          "digital",
          "services",
          "real_estate",
          "stock",
          "savings",
          "crypto",
        ].includes(page?.pageType || "")
      ) {
        metadata.stock = stock;
        metadata.allowMultiple = allowMultiple;
      }

      // Installment
      if (priceType === "installment") {
        const count = Number(installmentCount) || 1;
        const total = Number(price) || 0;
        metadata.installmentCount = count;
        metadata.installmentAmount =
          count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = total;
      } else if (priceType === "fixed") {
        delete metadata.installmentCount;
        delete metadata.installmentAmount;
        delete metadata.installmentPeriod;
        delete metadata.totalAmount;
      }

      const updateData = {
        title: title.trim(),
        description,
        productImages: uploadedProductImages,
        priceType,
        price: Number(price) || 0,
        installmentCount:
          priceType === "installment" ? Number(installmentCount) : undefined,
        metadata,
      };

      await updatePage(id, updateData);

      await Swal.fire({
        icon: "success",
        title: "Page Updated",
        text: "Your changes have been saved successfully.",
        confirmButtonColor: "#FDC020",
        confirmButtonText: "Done",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      router.push(`/dashboard/services/payment/page/${id}`);
    } catch (error: any) {
      console.error("Error updating page:", error);
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#FDC020",
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FDC020]" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Page not found</h1>
          <Button
            onClick={() => router.push("/dashboard/services/payment/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isSchool = page.pageType === "school";
  const isDonation = page.pageType === "donation";
  const isDigital = page.pageType === "digital";
  const isServices = page.pageType === "services";
  const showStock = [
    "physical",
    "digital",
    "services",
    "real_estate",
    "stock",
    "savings",
    "crypto",
  ].includes(page.pageType);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-32"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Edit {typeLabels[page.pageType] || "Page"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {page.slug}
                  </p>
                </div>
                <a
                  href={`/store/${page.metadata?.storeSlug || ""}/${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" /> View
                </a>
              </div>

              {/* ─── Title ─── */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Page Title *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter page title"
                  className="h-12"
                />
              </div>

              {/* ─── Description ─── */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Description
                </Label>
                <RichTextArea
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your page"
                  minHeight="200px"
                />
              </div>

              {/* ─── Product Images ─── */}
              {!isDonation && !isSchool && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Product Images
                  </Label>
                  <input
                    type="file"
                    ref={productRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <div className="flex gap-3 flex-wrap mb-3">
                    {productImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative h-20 w-20 rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`Product ${i + 1}`}
                        />
                        <button
                          onClick={() => removeProductImage(i)}
                          type="button"
                          className="absolute top-0 right-0 p-0.5 bg-red-500 rounded-full text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => productRef.current?.click()}
                      type="button"
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-[#FDC020] transition-colors"
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{IMAGE_SPECS}</p>
                </div>
              )}

              {/* ─── School Specific Fields ─── */}
              {isSchool && (
                <SchoolFields
                  students={students}
                  setStudents={setStudents}
                  className={schoolClass}
                  setClassName={setSchoolClass}
                  feeBreakdown={feeBreakdown}
                  setFeeBreakdown={setFeeBreakdown}
                  requiredFields={requiredFields}
                  setRequiredFields={setRequiredFields}
                />
              )}

              {/* ─── Digital Specific Fields ─── */}
              {isDigital && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Delivery</h3>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Download URL
                    </Label>
                    <Input
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to the file buyers get after payment
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Access Link (alternative)
                    </Label>
                    <Input
                      value={accessLink}
                      onChange={(e) => setAccessLink(e.target.value)}
                      placeholder="https://your-course.com/access"
                      className="h-11"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailDelivery}
                      onChange={(e) => setEmailDelivery(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Send the download link via email after payment
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Physical Specific Fields ─── */}
              {isPhysical && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Shipping</h3>

                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <Label className="text-sm font-medium">
                        Requires Shipping
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Collect the buyer's delivery address at checkout
                      </p>
                    </div>
                    <Switch
                      checked={requiresShipping}
                      onCheckedChange={setRequiresShipping}
                      className="data-[state=checked]:bg-[#FDC020]"
                    />
                  </div>
                </div>
              )}

              {/* ─── Physical Variants ─── */}
              {isPhysical && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold">Product Variants</h3>
                      <span className="text-xs text-muted-foreground">
                        (optional — e.g. Size, Color)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      If you have variants (like S/M/L), each variant gets its
                      own stock. Otherwise the product itself is the single item
                      for sale.
                    </p>
                  </div>

                  {/* Inventory Summary Card */}
                  {hasVariants && (
                    <div
                      className={`rounded-xl border p-4 ${
                        overAllocated
                          ? "border-red-500/40 bg-red-500/5"
                          : allocationBalanced
                            ? "border-green-500/40 bg-green-500/5"
                            : underAllocated || mixedAllocation
                              ? "border-yellow-500/40 bg-yellow-500/5"
                              : "border-border bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        {overAllocated ? (
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        ) : allocationBalanced ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-bold">Inventory Summary</p>

                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">
                                Page stock
                              </p>
                              <p className="font-bold">
                                {hasRealPageStock ? Number(stock) : "Unlimited"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Total across variants
                              </p>
                              <p className="font-bold">
                                {allVariantsCounted
                                  ? variantSum
                                  : mixedAllocation
                                    ? `${variantSum} + unlimited`
                                    : "Unlimited"}
                              </p>
                            </div>
                          </div>

                          {overAllocated && (
                            <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-400">
                              Your variants add up to{" "}
                              <strong>{variantSum}</strong>, but you only have{" "}
                              <strong>{Number(stock)}</strong> in stock. Reduce
                              the variant stocks or raise the page stock.
                            </p>
                          )}

                          {underAllocated && (
                            <p className="mt-3 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                              Variants add up to <strong>{variantSum}</strong>,
                              but you set <strong>{Number(stock)}</strong> in
                              page stock.{" "}
                              <strong>
                                {Number(stock) - variantSum} unit
                                {Number(stock) - variantSum === 1 ? "" : "s"}
                              </strong>{" "}
                              aren't assigned to any variant.
                            </p>
                          )}

                          {mixedAllocation && (
                            <p className="mt-3 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                              Some variants have a fixed stock and others are
                              unlimited. Buyers will see caps on the fixed ones.
                            </p>
                          )}

                          {allocationBalanced && (
                            <p className="mt-3 text-xs font-medium text-green-700 dark:text-green-400">
                              {variantSum} unit
                              {variantSum === 1 ? "" : "s"} allocated across{" "}
                              {variants.length} variant
                              {variants.length === 1 ? "" : "s"}. Looks good.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {variants.map((v, vi) => {
                      const driftWarning = hasPriceDrift(v);

                      return (
                        <div
                          key={vi}
                          className="p-4 rounded-xl border border-border bg-muted/30 space-y-3"
                        >
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Variant name (e.g. Size: L)"
                              value={v.name || ""}
                              onChange={(e) =>
                                updateVariant(vi, { name: e.target.value })
                              }
                              className="flex-1 h-10 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariant(vi)}
                              className="h-8 w-8 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20"
                              aria-label="Remove variant"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              min={0}
                              inputMode="decimal"
                              placeholder={
                                Number(price) > 0
                                  ? `Price (e.g. ₦${price})`
                                  : "Price"
                              }
                              value={priceDisplayValue(v)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updateVariant(vi, { price: 0 });
                                } else {
                                  const parsed = parseFloat(raw);
                                  updateVariant(vi, {
                                    price: Number.isFinite(parsed) ? parsed : 0,
                                  });
                                }
                              }}
                              className="h-10 text-sm"
                            />

                            <Input
                              placeholder="SKU"
                              value={v.sku || ""}
                              onChange={(e) =>
                                updateVariant(vi, { sku: e.target.value })
                              }
                              className="h-10 text-sm"
                            />

                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              placeholder="Stock (empty = ∞)"
                              value={stockDisplayValue(v)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updateVariant(vi, {
                                    stock: undefined as any,
                                  });
                                } else {
                                  const parsed = parseInt(raw, 10);
                                  updateVariant(vi, {
                                    stock: Number.isFinite(parsed)
                                      ? Math.max(1, parsed)
                                      : (undefined as any),
                                  });
                                }
                              }}
                              className="h-10 text-sm"
                            />
                          </div>

                          {driftWarning && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                This variant is ₦
                                {Number(v.price || 0).toLocaleString()} but the
                                page price is ₦{Number(price).toLocaleString()}.
                                Make sure that's what you want.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addVariant}
                      className="border-border"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Services Specific Fields ─── */}
              {isServices && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Service options</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingEnabled}
                      onChange={(e) => setBookingEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Let customers pick a date & time
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerNoteEnabled}
                      onChange={(e) => setCustomerNoteEnabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Allow customers to leave a note about their request
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Stock ─── */}
              {showStock && (
                <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold">Inventory</h3>

                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                      Available Quantity
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={stock === null ? "" : stock}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStock(
                            val === "" ? null : Math.max(0, parseInt(val) || 0),
                          );
                        }}
                        placeholder="Leave empty for unlimited"
                        className="h-11"
                      />
                      {stock !== null && (
                        <button
                          type="button"
                          onClick={() => setStock(null)}
                          className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap"
                        >
                          Unlimited
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      Allow buying multiple units at once
                    </span>
                  </label>
                </div>
              )}

              {/* ─── Pricing ─── */}
              {!isDonation && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">
                      Pricing
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPriceType("fixed")}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          priceType === "fixed"
                            ? "border-[#FDC020] bg-[#FDC020]/10"
                            : "border-border hover:border-[#FDC020]/50"
                        }`}
                      >
                        Fixed Price
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceType("installment")}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          priceType === "installment"
                            ? "border-[#FDC020] bg-[#FDC020]/10"
                            : "border-border hover:border-[#FDC020]/50"
                        }`}
                      >
                        Installment
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold mb-2 block">
                        {everyVariantPriced
                          ? "Page Amount (₦) — not used"
                          : priceType === "installment"
                            ? "Total Amount (₦)"
                            : "Amount (₦)"}
                      </Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className={`h-12 ${
                          everyVariantPriced
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={isSchool || everyVariantPriced}
                      />
                      {isSchool && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount is calculated from the fee breakdown
                        </p>
                      )}
                      {everyVariantPriced && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Every variant has its own price — buyers pay the price
                          of the variant they pick. This field is not used for
                          checkout.
                        </p>
                      )}
                    </div>
                    {priceType === "installment" && (
                      <>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">
                            Installments
                          </Label>
                          <Input
                            type="number"
                            value={installmentCount}
                            onChange={(e) =>
                              setInstallmentCount(e.target.value)
                            }
                            min={2}
                            max={24}
                            className="h-12"
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-sm font-semibold mb-2 block">
                            Period
                          </Label>
                          <select
                            value={installmentPeriod}
                            onChange={(e) =>
                              setInstallmentPeriod(e.target.value)
                            }
                            className="h-12 w-full rounded-xl border border-border bg-background px-3"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <PricingSummaryCard
                    priceType={priceType}
                    price={Number(price) || 0}
                    installmentCount={installmentCount}
                    installmentPeriod={installmentPeriod}
                    installmentAmount={installmentAmount}
                    variants={variants.map((v) => ({
                      name: v.name || "",
                      price: Number(v.price) || 0,
                    }))}
                    isPhysicalWithVariants={isPhysical && hasVariants}
                  />

                  {priceType === "installment" &&
                    page?.metadata?.installmentState &&
                    Object.keys(page.metadata.installmentState).length > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Existing payments on this plan
                          </p>
                          <p className="text-xs text-yellow-700/80 dark:text-yellow-400/70 mt-0.5">
                            Buyers have already made payments. Changing the plan
                            structure won't reset their balance. The account
                            table remains the source of truth.
                          </p>
                        </div>
                      </div>
                    )}
                </>
              )}
            </motion.div>
          </div>
        </main>

        {/* ─── Sticky Save Button ─── */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card/90 backdrop-blur-lg border-t border-border p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-[#FDC020] text-[#191919] hover:bg-[#e6a800] disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentPage;
