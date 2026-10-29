"use client";

import { useRef, useState, useEffect, useId, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  X,
  Plus,
  Trash2,
  GripVertical,
  Link2,
  CheckCircle,
  Copy,
  Loader2,
  AlertCircle,
  Package,
  Shield,
  Calendar,
  Info,
  Eye,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { useStore, CustomField, LinkConfig } from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import confetti from "canvas-confetti";
import { useTheme } from "@/app/components/ThemeProvider";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";
import { CustomerPreview } from "@/app/components/payment-page-components/CustomerPreview";

// ============================================================
// CONSTANTS
// ============================================================
const PRODUCT_IMAGE_SPECS = {
  width: 1350,
  height: 1080,
  ratio: "5:4",
  description: "1350 x 1080 pixels (5:4 ratio) - Instagram style",
  maxSize: 10 * 1024 * 1024,
  formats: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
};

const ZIDWELL_FEE_RATE = 0.035;

// ✅ FIX: one source of truth for the fee-payer union + its option list
type FeePayer = "customers" | "merchant(me)" | "split between both parties";

const FEE_PAYER_OPTIONS: { value: FeePayer; label: string }[] = [
  { value: "customers", label: "Customers pay fee" },
  { value: "merchant(me)", label: "Merchant (me) pays fee" },
  { value: "split between both parties", label: "Split between both parties" },
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const defaultConfig: LinkConfig = {
  currency: "NGN",
  amountMode: "fixed",
  active: true,
  brandColor: "#FDC020",
  buttonColor: "#FDC020",
  buttonText: "Pay Now",
  successMessage: "Payment successful! Thank you.",
  thankYouMessage:
    "We've received your payment and a receipt has been sent to your email.",
  collectName: true,
  collectEmail: true,
  collectPhone: true,
  nameRequired: true,
  emailRequired: true,
  phoneRequired: false,
  customFields: [],
  qrColor: "#191919",
  qrBackground: "#F5F5F5",
  qrFrame: "rounded",
};

// ============================================================
// PRICING SUMMARY CARD
// ============================================================
function LinkPricingSummaryCard({
  priceType,
  price,
  installmentCount,
  installmentPeriod,
  installmentAmount,
  feePayer,
}: {
  priceType: "fixed" | "installment";
  price: number;
  installmentCount: string;
  installmentPeriod: string;
  installmentAmount: number;
  feePayer?: string;
}) {
  if (price <= 0) return null;

  const halfFeeRate = ZIDWELL_FEE_RATE / 2;
  const isSplit = feePayer === "split between both parties";
  const feeRateApplied = isSplit ? halfFeeRate : ZIDWELL_FEE_RATE;
  const buyerTotal = isSplit
    ? price + price * halfFeeRate
    : feePayer === "customers"
      ? price + price * ZIDWELL_FEE_RATE
      : price;
  const youReceiveTotal = isSplit
    ? price - price * halfFeeRate
    : feePayer === "merchant(me)"
      ? price - price * ZIDWELL_FEE_RATE
      : price;
  const perInstallmentBuyer = isSplit
    ? installmentAmount + installmentAmount * halfFeeRate
    : feePayer === "customers"
      ? installmentAmount + installmentAmount * ZIDWELL_FEE_RATE
      : installmentAmount;
  const perInstallmentYouReceive = isSplit
    ? installmentAmount - installmentAmount * halfFeeRate
    : feePayer === "merchant(me)"
      ? installmentAmount - installmentAmount * ZIDWELL_FEE_RATE
      : installmentAmount;

  const isInstallment =
    priceType === "installment" && Number(installmentCount) > 1;

  return (
    <div className="rounded-2xl border border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-(--color-accent-yellow)/10 border-b border-(--color-accent-yellow)/20">
        <Info className="h-4 w-4 text-(--color-accent-yellow)" />
        <h4 className="text-sm font-bold text-(--text-primary)">
          {isInstallment ? "Installment Plan Summary" : "Payment Summary"}
        </h4>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">
            What the buyer pays
          </p>
          <div className="space-y-1.5">
            {isInstallment && (
              <div className="flex justify-between text-sm">
                <span className="text-(--text-secondary)">
                  Per installment ({installmentCount}× {installmentPeriod})
                </span>
                <span className="font-bold text-(--text-primary)">
                  {formatNaira(perInstallmentBuyer)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-(--text-secondary)">
                {isInstallment ? "Total across all installments" : "Amount"}
              </span>
              <span className="font-bold text-(--text-primary)">
                {formatNaira(buyerTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-(--color-accent-yellow)/20" />

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary) mb-2">
            What you receive
          </p>
          <div className="space-y-1.5">
            {isInstallment && (
              <div className="flex justify-between text-sm">
                <span className="text-(--text-secondary)">Per installment</span>
                <span className="font-semibold text-(--color-lemon-green)">
                  {formatNaira(perInstallmentYouReceive)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-(--text-secondary)">
                {isInstallment
                  ? "Total across all installments"
                  : "Total payout"}
              </span>
              <span className="font-bold text-(--color-lemon-green)">
                {formatNaira(youReceiveTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
const CreatePaymentLink = () => {
  const router = useRouter();
  const { createPage, store, loading, hasStore, validateSlug } = useStore();
  const { userData } = useUserContextData();
  const { theme } = useTheme();
  const generatedId = useId();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [price, setPrice] = useState("");

  // ─── INSTALLMENT STATE ───
  const [priceType, setPriceType] = useState<"fixed" | "installment">("fixed");
  const [installmentCount, setInstallmentCount] = useState("3");
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");
  const [installmentAmount, setInstallmentAmount] = useState(0);

  const [config, setConfig] = useState<LinkConfig>(defaultConfig);
  const [isMounted, setIsMounted] = useState(false);

  // ✅ FIX: use the shared FeePayer type
  const [feePayer, setFeePayer] = useState<FeePayer>("merchant(me)");

  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);

  // ─── WhatsApp Contact Me ───
  const [whatsappContactEnabled, setWhatsappContactEnabled] = useState(false);
  const [whatsappContactNumber, setWhatsappContactNumber] = useState("");

  // ─── PREVIEW STATE ───
  const [showPreview, setShowPreview] = useState(false);

  // Slug validation state
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    isChecking: boolean;
    message: string;
    isTaken: boolean;
    isOwnStore: boolean;
  }>({
    isValid: true,
    isChecking: false,
    message: "",
    isTaken: false,
    isOwnStore: false,
  });
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof LinkConfig>(k: K, v: LinkConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  // ─── AUTO-RESET INSTALLMENT WHEN SWITCHING TO VARIABLE AMOUNT ───
  useEffect(() => {
    if (config.amountMode === "variable" && priceType === "installment") {
      setPriceType("fixed");
    }
  }, [config.amountMode, priceType]);

  // ─── COMPUTE INSTALLMENT AMOUNT ───
  useEffect(() => {
    if (priceType === "installment") {
      const total = Number(price) || 0;
      const count = Number(installmentCount) || 1;
      setInstallmentAmount(total > 0 && count > 0 ? total / count : 0);
    } else {
      setInstallmentAmount(0);
    }
  }, [price, installmentCount, priceType]);

  // Validate slug with debounce
  const validateSlugWithDebounce = useCallback(
    async (slugToValidate: string) => {
      if (!slugToValidate || slugToValidate.length < 1) {
        setSlugValidation({
          isValid: false,
          isChecking: false,
          message: "Slug is required",
          isTaken: false,
          isOwnStore: false,
        });
        return;
      }

      if (slugToValidate.length > 50) {
        setSlugValidation({
          isValid: false,
          isChecking: false,
          message: "Slug is too long. Maximum 50 characters allowed.",
          isTaken: false,
          isOwnStore: false,
        });
        return;
      }

      setSlugValidation((prev) => ({ ...prev, isChecking: true }));

      try {
        const result = await validateSlug(slugToValidate);
        setSlugValidation({
          isValid: result.valid,
          isChecking: false,
          message: result.message,
          isTaken: result.isTaken,
          isOwnStore: result.isOwnStore,
        });
      } catch (error) {
        console.error("Error validating slug:", error);
        setSlugValidation({
          isValid: false,
          isChecking: false,
          message: "Failed to validate slug",
          isTaken: false,
          isOwnStore: false,
        });
      }
    },
    [validateSlug],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !hasStore) {
      router.push("/dashboard/services/payment/dashboard");
    }
  }, [loading, hasStore, router]);

  // Update slug and validate when title changes (with debounce)
  useEffect(() => {
    if (title) {
      const newSlug = slugify(title);
      setSlug(newSlug);

      if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
      slugTimeoutRef.current = setTimeout(() => {
        validateSlugWithDebounce(newSlug);
      }, 800);
    } else {
      setSlug("");
      setSlugValidation({
        isValid: true,
        isChecking: false,
        message: "",
        isTaken: false,
        isOwnStore: false,
      });
      if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
    }
  }, [title, validateSlugWithDebounce]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      alert(
        `File "${file.name}" is not supported. Please upload JPG, PNG, WEBP, or HEIC images.`,
      );
      return;
    }

    if (file.size > PRODUCT_IMAGE_SPECS.maxSize) {
      alert(
        `File "${file.name}" exceeds 10MB limit. Please compress your image.`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProductImage(result);
      setProductPreview(result);
    };
    reader.readAsDataURL(file);

    if (imageRef.current) imageRef.current.value = "";
  };

  const addCustomField = () => {
    const f: CustomField = {
      id: crypto.randomUUID(),
      label: "New field",
      type: "text",
      required: false,
    };
    set("customFields", [...config.customFields, f]);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    set(
      "customFields",
      config.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };

  const removeField = (id: string) =>
    set(
      "customFields",
      config.customFields.filter((f) => f.id !== id),
    );

  const isSlugInvalid = !slugValidation.isValid || slugValidation.isTaken;
  const isSlugAvailable = slugValidation.isValid && !slugValidation.isTaken;

  const canCreate = Boolean(
    title.trim() &&
    !slugValidation.isChecking &&
    isSlugAvailable &&
    (config.amountMode === "variable" ||
      (Number(price) > 0 &&
        (priceType === "fixed" ||
          (priceType === "installment" &&
            Number(installmentCount) >= 2 &&
            Number(installmentCount) <= 24)))),
  );

  const generateFinalSlug = () => slug || slugify(title);

  const getPageUrl = () => {
    const storeSlug = store?.slug || "";
    if (!storeSlug) return "#";
    return `/store/${storeSlug}/${createdSlug}`.replace(/\/+/g, "/");
  };

  const pageUrl = getPageUrl();

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    window.location.reload();
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsCreating(true);

    try {
      const finalSlug = generateFinalSlug();

      const validationResult = await validateSlug(finalSlug);
      if (
        !validationResult.valid ||
        (validationResult.isTaken && !validationResult.isOwnStore)
      ) {
        setSlugValidation({
          isValid: validationResult.valid,
          isChecking: false,
          message: validationResult.message,
          isTaken: validationResult.isTaken,
          isOwnStore: validationResult.isOwnStore,
        });
        setIsCreating(false);
        return;
      }

      let uploadedImageUrl = null;
      if (productImage) {
        const uploadResponse = await fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: productImage, type: "products" }),
        });
        const uploadData = await uploadResponse.json();
        uploadedImageUrl = uploadData.url;
      }

      const isInstallment =
        priceType === "installment" &&
        config.amountMode === "fixed" &&
        Number(installmentCount) > 1 &&
        Number(price) > 0;

      const linkConfig: any = {
        currency: config.currency,
        amountMode: config.amountMode,
        active: config.active,
        buttonText: config.buttonText,
        successMessage: config.successMessage,
        thankYouMessage: config.thankYouMessage,
        redirectUrl: config.redirectUrl,
        altRedirectUrl: config.altRedirectUrl,
        referenceCode: config.referenceCode,
        customFields: config.customFields,
        createdAt: new Date().toISOString(),
      };

      const metadata: any = {
        pageType: "link",
        storeSlug: store?.slug,
        linkConfig,
      };

      // ─── WhatsApp Contact Me ───
      if (whatsappContactEnabled && whatsappContactNumber.trim()) {
        metadata.whatsappContactEnabled = true;
        metadata.whatsappContactNumber = whatsappContactNumber.trim();
      }

      // ─── Transaction Fee Payer ───
      metadata.feePayer = feePayer || "merchant(me)";

      if (isInstallment) {
        const totalAmount = Number(price) || 0;
        const count = Number(installmentCount);
        metadata.installmentCount = count;
        metadata.installmentAmount =
          count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = totalAmount;
        metadata.installmentState = {};
      }

      const pageData = {
        title: title,
        slug: finalSlug,
        description: description,
        coverImage: uploadedImageUrl || null,
        logo: null,
        productImages: uploadedImageUrl ? [uploadedImageUrl] : [],
        priceType: isInstallment
          ? "installment"
          : config.amountMode === "variable"
            ? "open"
            : "fixed",
        price: config.amountMode === "variable" ? 0 : Number(price) || 0,
        installmentCount: isInstallment ? Number(installmentCount) : null,
        feeMode: "bearer",
        pageType: "link",
        metadata: metadata,
      };

      const result = await createPage(pageData);

      if (!result || !result.slug) {
        throw new Error("Failed to create payment link - no slug returned");
      }

      setCreatedSlug(result.slug);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#FDC020", "#191919", "#00B64F"],
      });
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error creating payment link:", err);
      alert(err.message || "Failed to create payment link. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-yellow)]" />
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="min-h-screen bg-(--bg-primary)">
        <div className="max-w-3xl mx-auto py-20 px-4 text-center">
          <Package className="h-16 w-16 mx-auto text-(--text-secondary) mb-4" />
          <h3 className="text-xl font-bold text-(--text-primary)">
            No Store Found
          </h3>
          <p className="text-(--text-secondary) mt-2">
            Please create a store first before creating a payment link.
          </p>
          <Button
            onClick={() => router.push("/dashboard/services/payment/dashboard")}
            className="mt-4 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="max-w-3xl mx-auto">
      {/* ─── HEADER ─── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-32"
      >
        {/* Product Image */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Product Image
            <span className="text-(--text-secondary) ml-2 font-normal">
              (Optional)
            </span>
          </Label>

          <input
            type="file"
            ref={imageRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />

          {productPreview ? (
            <div className="relative group">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-(--bg-secondary) border-2 border-(--border-color) max-h-[240px]">
                <img
                  src={productPreview}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => {
                  setProductImage(null);
                  setProductPreview(null);
                }}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
                {PRODUCT_IMAGE_SPECS.description}
              </div>
            </div>
          ) : (
            <div
              onClick={() => imageRef.current?.click()}
              className="aspect-[4/3] rounded-xl border-2 border-dashed border-(--border-color) bg-(--bg-secondary)/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-(--color-accent-yellow) transition-colors group max-h-[240px]"
            >
              <Package className="h-12 w-12 text-(--text-secondary) group-hover:text-(--color-accent-yellow) transition-colors" />
              <span className="text-sm text-(--text-secondary) group-hover:text-(--color-accent-yellow) transition-colors">
                Click to upload product image
              </span>
              <span className="text-xs text-(--text-secondary)">
                {PRODUCT_IMAGE_SPECS.description}
              </span>
              <span className="text-xs text-(--text-secondary)">
                JPG, PNG, WEBP, HEIC • Max 10MB
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Link Title *
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Premium Coaching Session"
            className="h-12 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
        </div>

        {/* URL Preview */}
        {title && (
          <div className="bg-(--bg-secondary)/50 rounded-lg p-4 border border-(--border-color)">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-(--color-accent-yellow)">
                Your Payment Link URL:
              </Label>
            </div>
            <div className="flex items-center gap-2 bg-(--bg-primary) p-3 rounded-lg border border-(--border-color)">
              <Link2 className="h-4 w-4 text-(--color-accent-yellow) shrink-0" />
              <code className="text-sm font-mono text-(--text-primary) break-all">
                {store?.slug
                  ? `/store/${store.slug}/${slug || generateFinalSlug()}`
                  : "Please select a store first"}
              </code>
              {slugValidation.isChecking && (
                <Loader2 className="h-4 w-4 animate-spin text-(--color-accent-yellow) ml-2" />
              )}
            </div>

            {slug && !slugValidation.isChecking && (
              <div className="mt-2 text-xs flex items-start gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {isSlugInvalid ? (
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-500" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-600 dark:text-gray-400" />
                )}
                <span
                  className={`flex-1 ${
                    isSlugInvalid
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {slugValidation.message}
                  {slugValidation.isTaken &&
                    !slugValidation.isOwnStore &&
                    " This slug is already taken. Please change the title."}
                  {slugValidation.isTaken &&
                    slugValidation.isOwnStore &&
                    " This slug is already used by one of your pages."}
                </span>
              </div>
            )}

            <p className="text-xs text-(--text-secondary) mt-2">
              💡 Your URL is based on the title you enter (max 50 characters)
            </p>
            {!store?.slug && (
              <p className="text-xs text-(--color-accent-yellow) mt-2">
                ⚠️ You need to create a store before creating payment links.
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Description
            <span className="text-(--text-secondary) ml-2 font-normal">
              (Rich text supported)
            </span>
          </Label>
          <RichTextArea
            value={description}
            onChange={setDescription}
            placeholder="Describe what this payment is for. You can format text, add lists, and more..."
            minHeight="200px"
          />
          <p className="text-xs text-(--text-secondary) mt-2">
            ✨ Use the toolbar to bold, italicize, add lists, and more
          </p>
        </div>

        {/* Currency and Amount Mode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
              Currency
            </Label>
            <select
              value={config.currency}
              onChange={(e) =>
                set("currency", e.target.value as "NGN" | "USD" | "GBP" | "EUR")
              }
              className="h-12 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-3 focus:border-(--color-accent-yellow) focus:ring-0 focus:outline-none"
            >
              <option value="NGN">₦ NGN</option>
              <option value="USD">$ USD</option>
              <option value="GBP">£ GBP</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
              Amount Mode
            </Label>
            <div className="flex gap-2">
              <button
                onClick={() => set("amountMode", "fixed")}
                className={`flex-1 h-12 rounded-xl text-sm font-medium border-2 transition-all ${
                  config.amountMode === "fixed"
                    ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                    : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                }`}
              >
                Fixed
              </button>
              <button
                onClick={() => set("amountMode", "variable")}
                className={`flex-1 h-12 rounded-xl text-sm font-medium border-2 transition-all ${
                  config.amountMode === "variable"
                    ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                    : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                }`}
              >
                Variable
              </button>
            </div>
          </div>
        </div>

        {/* AMOUNT + INSTALLMENTS */}
        {config.amountMode === "fixed" && (
          <>
            <div>
              <Label className="text-sm font-semibold mb-3 block text-(--text-primary)">
                Payment Options
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(["fixed", "installment"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPriceType(val)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      priceType === val
                        ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                        : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                    }`}
                  >
                    {val === "fixed" ? "One-time Payment" : "Installments"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                {priceType === "installment" ? "Total Amount *" : "Amount *"}
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className="h-12 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
              />
            </div>

            {priceType === "installment" && (
              <div className="space-y-4 p-4 rounded-2xl border border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-(--color-accent-yellow)" />
                  <Label className="text-sm font-bold text-(--text-primary)">
                    Installment Plan
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block text-(--text-secondary)">
                      Number of Installments
                    </Label>
                    <Input
                      type="number"
                      min={2}
                      max={24}
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value)}
                      className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1 block text-(--text-secondary)">
                      Frequency
                    </Label>
                    <select
                      value={installmentPeriod}
                      onChange={(e) => setInstallmentPeriod(e.target.value)}
                      className="h-10 w-full rounded-xl border border-(--border-color) bg-(--bg-primary) px-3 text-sm"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <LinkPricingSummaryCard
              priceType={priceType}
              price={Number(price) || 0}
              installmentCount={installmentCount}
              installmentPeriod={installmentPeriod}
              installmentAmount={installmentAmount}
              feePayer={feePayer}
            />
          </>
        )}

        {/* Reference Code */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Reference Code (optional)
          </Label>
          <Input
            value={config.referenceCode || ""}
            onChange={(e) => set("referenceCode", e.target.value)}
            placeholder="INV-2026-001"
            className="h-12 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
        </div>

        {/* Link Active */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color)">
          <div>
            <Label className="text-sm font-semibold text-(--text-primary)">
              Link Active
            </Label>
            <p className="text-xs text-(--text-secondary)">
              Toggle to enable/disable this link
            </p>
          </div>
          <Switch
            checked={config.active}
            onCheckedChange={(v) => set("active", v)}
            className="data-[state=checked]:bg-(--color-accent-yellow)"
          />
        </div>

        {/* Button Text */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Button Text
          </Label>
          <div className="flex gap-2 flex-wrap mb-2">
            {[
              "Pay Now",
              "Donate",
              "Book Now",
              "Register",
              "Subscribe",
              "Buy Ticket",
            ].map((t) => (
              <button
                key={t}
                onClick={() => set("buttonText", t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  config.buttonText === t
                    ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                    : "border-(--border-color) bg-(--bg-primary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Input
            value={config.buttonText}
            onChange={(e) => set("buttonText", e.target.value)}
            className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
        </div>

        {/* Success Message */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Success Message
          </Label>
          <Input
            value={config.successMessage}
            onChange={(e) => set("successMessage", e.target.value)}
            className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
        </div>

        {/* Thank You Message */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Thank-You Page Message
            <span className="text-(--text-secondary) ml-2 font-normal">
              (Rich text supported)
            </span>
          </Label>
          <RichTextArea
            value={config.thankYouMessage}
            onChange={(v) => set("thankYouMessage", v)}
            placeholder="Thank you message shown after payment..."
            minHeight="120px"
          />
        </div>

        {/* Redirect URL */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
            Redirect URL
          </Label>
          <Input
            value={config.redirectUrl || ""}
            onChange={(e) => set("redirectUrl", e.target.value)}
            placeholder="https://yoursite.com/thank-you"
            className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
        </div>

        {/* Custom Fields */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-(--text-primary)">
              Additional Custom Fields
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addCustomField}
              className="border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
            </Button>
          </div>
          <p className="text-xs text-(--text-secondary) mb-3">
            Add extra fields to collect additional information from your
            customers (beyond the default Name, Email, Phone).
          </p>
          <div className="space-y-3">
            {config.customFields.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-(--bg-secondary) border border-(--border-color) space-y-2"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-(--text-secondary)" />
                  <Input
                    value={f.label}
                    onChange={(e) =>
                      updateField(f.id, { label: e.target.value })
                    }
                    placeholder="Field label"
                    className="h-10 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
                  />
                  <select
                    value={f.type}
                    onChange={(e) =>
                      updateField(f.id, {
                        type: e.target.value as
                          | "text"
                          | "number"
                          | "date"
                          | "dropdown"
                          | "checkbox"
                          | "paragraph",
                      })
                    }
                    className="h-10 rounded-xl border border-(--border-color) bg-(--bg-primary) px-2 text-sm text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="paragraph">Paragraph</option>
                  </select>
                  <button
                    onClick={() => removeField(f.id)}
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-(--destructive) hover:bg-(--destructive)/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {f.type === "dropdown" && (
                  <Input
                    value={(f.options || []).join(", ")}
                    onChange={(e) =>
                      updateField(f.id, {
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                    className="h-10 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:border-(--color-accent-yellow) focus:ring-0"
                  />
                )}
                <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) =>
                      updateField(f.id, { required: e.target.checked })
                    }
                    className="rounded border-(--border-color) accent-(--color-accent-yellow)"
                  />
                  Required
                </label>
              </div>
            ))}
            {config.customFields.length === 0 && (
              <p className="text-xs text-(--text-secondary) text-center py-4">
                No custom fields added. Add fields like Passport Number, Booking
                Date, etc.
              </p>
            )}
          </div>
        </div>

        {/* ─── WhatsApp Contact Me ─── */}
        <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
          <h3 className="font-bold text-sm mb-4 text-(--color-accent-yellow)">
            WhatsApp Contact
          </h3>
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm font-semibold text-(--text-primary)">
                WhatsApp Contact Me
              </Label>
              <p className="text-xs text-(--text-secondary)">
                Enable to allow buyers to contact you via WhatsApp
              </p>
            </div>
            <Switch
              checked={whatsappContactEnabled}
              onCheckedChange={setWhatsappContactEnabled}
              className="data-[state=checked]:bg-(--color-accent-yellow)"
            />
          </div>
          {whatsappContactEnabled && (
            <div>
              <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                WhatsApp Number
              </Label>
              <Input
                placeholder="e.g. 2348012345678"
                value={whatsappContactNumber}
                onChange={(e) => setWhatsappContactNumber(e.target.value)}
                className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
              />
              <p className="text-xs text-(--text-secondary) mt-1">
                Enter your WhatsApp number with country code (e.g. 2348012345678
                for Nigeria)
              </p>
            </div>
          )}
        </div>

        {/* Transaction Fee Option */}
        <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
          <h3 className="font-bold text-sm mb-4 text-(--color-accent-yellow)">
            Transaction Fee (3.5%)
          </h3>
          <div className="space-y-2">
            {FEE_PAYER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-(--border-color) bg-(--bg-primary) cursor-pointer hover:border-(--color-accent-yellow)/50 transition-colors"
              >
                <input
                  type="radio"
                  name="feePayer"
                  value={opt.value}
                  checked={feePayer === opt.value}
                  // ✅ FIX: cast to FeePayer union so TS accepts the assignment
                  onChange={(e) => setFeePayer(e.target.value as FeePayer)}
                  className="h-4 w-4 text-(--color-accent-yellow) border-(--border-color) focus:ring-(--color-accent-yellow)"
                />
                <span className="text-sm text-(--text-primary)">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 -mx-4 md:-mx-6 lg:-mx-8 mt-8 bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="py-6 px-5 border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Preview</span>
            </Button>

            <Button
              variant="default"
              size="lg"
              className="flex-1 py-6 text-base bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
              onClick={handleCreate}
              disabled={!canCreate || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Payment Link"
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── CUSTOMER PREVIEW MODAL ─── */}
      <CustomerPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        data={{
          title: title || "Untitled Payment Link",
          description,
          productImage: productPreview,
          price: Number(price) || 0,
          priceType,
          installmentCount: Number(installmentCount) || 1,
          installmentAmount,
          installmentPeriod,
          amountMode: config.amountMode,
          storeName: store?.name || "Your Store",
          storeSlug: store?.slug || "",
          config,
          pageType: "link",
          whatsappContactEnabled: whatsappContactEnabled,
          whatsappContactNumber: whatsappContactNumber,
        }}
      />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={handleCloseSuccess}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-(--bg-primary) rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg w-full text-center shadow-2xl border border-(--border-color) mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                🎉
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-(--text-primary) mb-2">
                Payment Link Created!
              </h2>
              <p className="text-sm sm:text-base text-(--text-secondary) mb-4 sm:mb-6">
                Your payment link is now live and ready to collect payments.
              </p>

              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-(--border-color)">
                <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
                  Your Payment Link:
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-(--bg-primary) rounded-lg p-2 sm:p-3 border border-(--border-color)">
                    <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                    <code className="text-xs sm:text-sm font-mono text-(--text-primary) break-all flex-1 text-left">
                      {pageUrl}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(pageUrl)}
                    className="relative p-2 sm:p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 hover:bg-[var(--color-accent-yellow)]/20 transition-colors group shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-lemon-green)]" />
                    ) : (
                      <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-accent-yellow)]" />
                    )}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {copied ? "Copied!" : "Copy link"}
                    </span>
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-[var(--color-lemon-green)] mt-2 text-center animate-pulse">
                    ✓ Link copied to clipboard!
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                  onClick={() => {
                    setShowSuccess(false);
                    router.push("/dashboard/services/payment/dashboard");
                  }}
                >
                  Go to Dashboard
                </Button>
              </div>

              <button
                onClick={handleCloseSuccess}
                className="mt-4 text-xs sm:text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePaymentLink;