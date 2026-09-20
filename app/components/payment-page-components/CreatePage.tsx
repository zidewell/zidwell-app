"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  X,
  ImagePlus,
  Link2,
  Loader2,
  Calendar,
  Info,
  CheckCircle,
  Copy,
  AlertCircle,
  Eye, // ← still used for the trigger button
  Package,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  useStore,
  PageType,
  Student,
  FeeItem,
  Variant,
  isInvestmentType,
} from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import confetti from "canvas-confetti";
import PageTypeSelector from "@/app/components/payment-page-components/pageTypeSelector";
import SchoolFields from "@/app/components/payment-page-components/SchoolFields";
import DonationFields from "@/app/components/payment-page-components/DonationFields";
import PhysicalFields from "@/app/components/payment-page-components/PhysicalFields";
import DigitalFields from "@/app/components/payment-page-components/DigitalFields";
import ServicesFields from "@/app/components/payment-page-components/ServicesFields";
import InvestmentFields from "@/app/components/payment-page-components/InvestmentFields";
import TrustSignals from "@/app/components/payment-page-components/TrustSignals";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";
import { CustomerPreview } from "@/app/components/payment-page-components/CustomerPreview"; // ← ADDED

// ============================================================
// CONSTANTS
// ============================================================
const typeLabels: Record<PageType, string> = {
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

const PRODUCT_IMAGE_SPECS = {
  width: 1350,
  height: 1080,
  ratio: "5:4",
  description: "1350 x 1080 pixels (5:4 ratio) - Instagram style",
  maxSize: 10 * 1024 * 1024,
  formats: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
};

const ZIDWELL_FEE_RATE = 0.035;

const getPlaceholderText = (
  pageType: PageType | null,
  field: "title" | "description",
): string => {
  if (!pageType)
    return field === "title"
      ? "Enter page title"
      : "Describe your product or service...";

  const placeholders: Record<PageType, { title: string; description: string }> =
    {
      school: {
        title: "Harmony International School - Term Fees 2025",
        description: "Quality education for every child...",
      },
      donation: {
        title: "Help Build a School in Africa",
        description: "Your donation helps provide quality education...",
      },
      physical: {
        title: "Premium Leather Backpack",
        description: "Handcrafted genuine leather backpack...",
      },
      digital: {
        title: "Pastry Baking Course",
        description: "Master the art of pastry baking...",
      },
      services: {
        title: "Professional Web Design Service",
        description: "Custom website design tailored to your business...",
      },
      real_estate: {
        title: "Luxury 4-Bedroom Villa",
        description: "Modern luxury villa with swimming pool...",
      },
      stock: {
        title: "Tech Growth Investment Fund",
        description: "Invest in Africa's fastest-growing tech startups...",
      },
      savings: {
        title: "High-Yield Savings Plan",
        description: "Save towards your financial goals...",
      },
      crypto: {
        title: "Bitcoin Investment Package",
        description:
          "Start your crypto journey with our secure investment packages...",
      },
      link: {
        title: "Premium Service Payment",
        description: "Secure payment link for your premium service...",
      },
    };

  return (
    placeholders[pageType]?.[field] ||
    (field === "title"
      ? `Enter ${typeLabels[pageType]} title`
      : `Describe your ${typeLabels[pageType].toLowerCase()}...`)
  );
};

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [
      "var(--color-accent-yellow)",
      "var(--color-ink)",
      "var(--bg-secondary)",
      "var(--color-accent-yellow)",
    ],
  });
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.3 },
      startVelocity: 25,
    });
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6, x: 0.7 },
      startVelocity: 25,
    });
  }, 150);
};

const copyToClipboard = async (
  text: string,
  setCopied: (value: boolean) => void,
) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ============================================================
// UNIFIED PRICING SUMMARY CARD
// ============================================================
function PricingSummaryCard({
  priceType,
  price,
  installmentCount,
  installmentPeriod,
  installmentAmount,
  variants,
  isPhysicalWithVariants,
  feePayer,
}: {
  priceType: "fixed" | "installment";
  price: number;
  installmentCount: string;
  installmentPeriod: string;
  installmentAmount: number;
  variants?: { name: string; price: number }[];
  isPhysicalWithVariants?: boolean;
  feePayer?: string;
}) {
  if (price <= 0 && !isPhysicalWithVariants) return null;

  const isInstallment =
    priceType === "installment" && Number(installmentCount) > 1;
  const count = Math.max(1, Number(installmentCount) || 1);

  if (isPhysicalWithVariants && variants && variants.length > 0) {
    const pricedVariants = variants.filter((v) => Number(v.price) > 0);
    if (pricedVariants.length === 0) return null;

    const fmt = (n: number) =>
      `₦${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const halfFeeRate = ZIDWELL_FEE_RATE / 2;
    const isSplitVariant = feePayer === "split between both parties";
    const variantFeeRateApplied = isSplitVariant
      ? halfFeeRate
      : ZIDWELL_FEE_RATE;

    return (
      <div className="rounded-2xl border border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-(--color-accent-yellow)/10 border-b border-(--color-accent-yellow)/20">
          <Info className="h-4 w-4 text-(--color-accent-yellow)" />
          <h4 className="text-sm font-bold text-(--text-primary)">
            {isInstallment ? "Installment Plan Summary" : "Payment Summary"}
          </h4>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {pricedVariants.map((v, i) => {
              const variantTotal = Number(v.price) || 0;
              const variantFee = variantTotal * variantFeeRateApplied;
              const variantNet = variantTotal - variantFee;

              const buyerVariantTotal = isSplitVariant ? variantTotal + variantTotal * halfFeeRate : feePayer === "customers" ? variantTotal + variantTotal * ZIDWELL_FEE_RATE : variantTotal;
              const perPaymentBuyer = isInstallment
                ? buyerVariantTotal / count
                : buyerVariantTotal;
              const perPaymentFee = isInstallment
                ? perPaymentBuyer * ZIDWELL_FEE_RATE
                : variantFee;
              const perPaymentNet = perPaymentBuyer - perPaymentFee;

              return (
                <div
                  key={i}
                  className="rounded-xl border border-(--border-color) bg-(--bg-primary) p-3"
                >
                  <p className="text-xs font-bold text-(--text-primary) mb-2">
                    {v.name || `Variant ${i + 1}`}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-(--text-secondary) mb-0.5">
                        {isInstallment ? "Per payment (buyer)" : "Buyer pays"}
                      </p>
                      <p className="font-bold text-(--text-primary)">
                        {fmt(perPaymentBuyer)}
                      </p>
                    </div>
                    <div>
                      <p className="text-(--text-secondary) mb-0.5">
                        {isInstallment ? "Per payment (you)" : "You receive"}
                      </p>
                      <p className="font-bold text-(--color-lemon-green)">
                        {fmt(perPaymentNet)}
                      </p>
                    </div>
                  </div>

                  {isInstallment && (
                    <div className="mt-2 pt-2 border-t border-(--border-color) text-xs flex justify-between">
                      <span className="text-(--text-secondary)">
                        Total across {count} payments
                      </span>
                      <span className="font-bold text-(--text-primary)">
                        {fmt(variantTotal)}{" "}
                        <span className="text-(--text-secondary) font-normal">
                          (you get {fmt(variantNet)})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-(--text-secondary) leading-relaxed pt-2 border-t border-(--color-accent-yellow)/20">
            ✓ Buyers pay the price of the variant they pick. The 3.5% fee is
            deducted from your payout — you never charge the buyer extra.
          </p>
        </div>
      </div>
    );
  }

  const halfFeeRate = ZIDWELL_FEE_RATE / 2;
  const isSplit = feePayer === "split between both parties";
  const feeRateApplied = isSplit ? halfFeeRate : ZIDWELL_FEE_RATE;

  const fee = price * feeRateApplied;
  const buyerTotal = isSplit
    ? price + fee
    : feePayer === "customers"
      ? price + price * ZIDWELL_FEE_RATE
      : price;
  const youReceiveTotal = isSplit
    ? price - fee
    : feePayer === "merchant(me)"
      ? price - fee
      : price;
  const perInstallmentFee = isInstallment
    ? installmentAmount * feeRateApplied
    : 0;
  const youReceivePerInstallment = isInstallment
    ? installmentAmount - perInstallmentFee
    : 0;

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
                  {formatNaira(
                    isSplit
                      ? installmentAmount + installmentAmount * halfFeeRate
                      : feePayer === "customers"
                        ? installmentAmount +
                          installmentAmount * ZIDWELL_FEE_RATE
                        : installmentAmount,
                  )}
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
                  {formatNaira(youReceivePerInstallment)}
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

        <p className="text-[11px] text-(--text-secondary) leading-relaxed pt-2 border-t border-(--color-accent-yellow)/20">
          ✓ Transaction fee: 3.5%.{" "}
          {feePayer === "customers"
            ? "Buyer pays fee (added to total)."
            : feePayer === "split between both parties"
              ? "Fee split 50/50 between buyer and seller."
              : "Merchant pays fee (deducted from payout)."}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CreatePage() {
  const router = useRouter();
  const { createPage, addPage, store, loading, validateSlug } = useStore();
  const { userData } = useUserContextData();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [pageType, setPageType] = useState<PageType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dynamicId, setDynamicId] = useState(() =>
    Math.floor(100 + Math.random() * 900).toString(),
  );
  const [showPreview, setShowPreview] = useState(false);

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

  const [generatedSlug, setGeneratedSlug] = useState("");
  const [titleValidation, setTitleValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: "" });
  const [productImagesBase64, setProductImagesBase64] = useState<string[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priceType: "fixed" as "fixed" | "installment",
    price: "",
    installmentCount: "3",
    feeMode: "bearer" as "bearer" | "customer",
    feePayer: "merchant(me)" as
      "customers" | "merchant(me)" | "split between both parties",
  });

  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [installmentPeriod, setInstallmentPeriod] = useState("monthly");

  const [students, setStudents] = useState<Student[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [feeBreakdown, setFeeBreakdown] = useState<FeeItem[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>([
    5000, 10000, 20000,
  ]);
  const [showDonorList, setShowDonorList] = useState(false);
  const [allowDonorMessage, setAllowDonorMessage] = useState(true);
  const [requireDonorName, setRequireDonorName] = useState(true);
  const [minimumDonation, setMinimumDonation] = useState(100);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [requiresShipping, setRequiresShipping] = useState(true);

  const [stock, setStock] = useState<number | null>(null);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [accessLink, setAccessLink] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);

  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [customerNoteEnabled, setCustomerNoteEnabled] = useState(true);

  const [minimumAmount, setMinimumAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [tenure, setTenure] = useState("");
  const [charges, setCharges] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<
    "one-time" | "recurring"
  >("one-time");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [riskExplanation, setRiskExplanation] = useState("");

  // ─── WhatsApp Contact Me ───
  const [whatsappContactEnabled, setWhatsappContactEnabled] = useState(false);
  const [whatsappContactNumber, setWhatsappContactNumber] = useState("");

  const [cacCertificate, setCacCertificate] = useState("");
  const [taxClearance, setTaxClearance] = useState("");
  const [explainerVideo, setExplainerVideo] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([]);
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const productRef = useRef<HTMLInputElement>(null);

  const isPhysical = pageType === "physical";
  const hasVariants = isPhysical && variants.length > 0;

  const everyVariantPriced =
    hasVariants &&
    variants.every((v) => {
      const p = Number(v?.price);
      return Number.isFinite(p) && p > 0;
    });

  const someVariantMissingPrice = hasVariants && !everyVariantPriced;

  const pageAmountLocked = isPhysical && everyVariantPriced;

  useEffect(() => {
    if (!pageAmountLocked) return;

    const prices = variants
      .map((v) => Number(v?.price) || 0)
      .filter((p) => p > 0);
    if (prices.length === 0) return;

    const total = prices.reduce((sum, p) => sum + p, 0);

    setForm((f) => {
      const current = Number(f.price);
      if (Number.isFinite(current) && current === total) return f;
      return { ...f, price: String(total) };
    });
  }, [pageAmountLocked, variants]);

  useEffect(() => {
    if (form.priceType === "installment") {
      const totalAmount = Number(form.price) || 0;
      const count = Number(form.installmentCount) || 1;
      setInstallmentAmount(
        totalAmount > 0 && count > 0 ? totalAmount / count : 0,
      );
    }
  }, [form.price, form.installmentCount, form.priceType]);

  useEffect(() => {
    if (pageType === "school") {
      const total = feeBreakdown.reduce(
        (sum, item) => sum + (item.amount || 0),
        0,
      );
      if (total > 0) setForm((f) => ({ ...f, price: total.toString() }));
    }
  }, [feeBreakdown, pageType]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  useEffect(() => {
    if (form.title) {
      const titleSlug = slugify(form.title);
      let prefix = "";
      if (pageType === "school" && schoolClass)
        prefix = slugify(schoolClass) + "-";
      const newSlug = `${prefix}${titleSlug}`;
      setGeneratedSlug(newSlug);

      if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
      slugTimeoutRef.current = setTimeout(() => {
        validateSlugWithDebounce(newSlug);
      }, 800);
    } else {
      setGeneratedSlug("");
      setSlugValidation({
        isValid: true,
        isChecking: false,
        message: "",
        isTaken: false,
        isOwnStore: false,
      });
      if (slugTimeoutRef.current) clearTimeout(slugTimeoutRef.current);
    }
  }, [form.title, schoolClass, pageType]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ];
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
        setProductImagesBase64((prev) => [...prev, result]);
        setProductPreviews((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    if (productRef.current) productRef.current.value = "";
  };

  const removeProductImage = (index: number) => {
    setProductImagesBase64(productImagesBase64.filter((_, i) => i !== index));
    setProductPreviews(productPreviews.filter((_, i) => i !== index));
  };

  const isInvestment = pageType ? isInvestmentType(pageType) : false;

  const isSlugAvailable = slugValidation.isValid && !slugValidation.isTaken;
  const isSlugInvalid = !slugValidation.isValid || slugValidation.isTaken;

  const isVariantStockValid = (): boolean => {
    if (!isPhysical || variants.length === 0) return true;

    const parsedPageStock =
      stock != null && String(stock).trim() !== "" ? Number(stock) : null;
    const hasRealPageStock =
      parsedPageStock !== null &&
      Number.isFinite(parsedPageStock) &&
      parsedPageStock > 0;

    if (!hasRealPageStock) return true;

    const variantStockValues = variants
      .map((v) => {
        const raw = v?.stock as unknown;
        if (raw == null) return null;
        const trimmed = String(raw).trim();
        if (trimmed === "") return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      })
      .filter((n): n is number => n !== null);

    const allVariantsCounted = variantStockValues.length === variants.length;
    const variantSum = variantStockValues.reduce((s, n) => s + n, 0);

    if (allVariantsCounted && variantSum > parsedPageStock!) {
      return false;
    }
    return true;
  };

  const canCreate = () => {
    if (!form.title.trim() || !pageType) return false;
    if (!titleValidation.isValid) return false;
    if (slugValidation.isChecking) return false;
    if (!isSlugAvailable) return false;

    if (pageType === "school") {
      const hasValidStudents =
        students.length > 0 &&
        students.some((s) => s.name && s.name.trim() !== "");
      if (!hasValidStudents) return false;
      const hasValidFeeItems =
        feeBreakdown.length > 0 && feeBreakdown.some((item) => item.amount > 0);
      if (!hasValidFeeItems) return false;
    }

    if (form.priceType === "installment") {
      const count = Number(form.installmentCount);
      if (count < 2 || count > 24) return false;
      if (Number(form.price) <= 0) return false;
    }

    if (isInvestment) {
      if (!minimumAmount || !tenure.trim()) return false;
      if (termsAndConditions.length < 100) return false;
      if (!riskExplanation.trim()) return false;
    }

    if (!isVariantStockValid()) return false;

    return true;
  };

  const getPageUrl = () => {
    const storeSlug = store?.slug || "";
    if (!storeSlug) return "#";
    return `/store/${storeSlug}/${createdSlug}`;
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    window.location.reload();
  };

  const handleCreate = async () => {
    if (pageType === "link") {
      router.push("/dashboard/services/payment/create-link");
      return;
    }

    if (!canCreate() || !pageType) return;
    setIsCreating(true);

    try {
      const productUploadPromises = productImagesBase64.map((img) =>
        fetch(`/api/payment-page/upload-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: img, type: "products" }),
        })
          .then((res) => res.json())
          .then((data) => data.url),
      );

      const uploadedProducts = await Promise.all(productUploadPromises);
      let finalCoverImage =
        uploadedProducts.length > 0 ? uploadedProducts[0] : null;

      const metadata: any = { storeSlug: store?.slug };

      if (form.priceType === "installment") {
        const totalAmount = Number(form.price) || 0;
        const count = Number(form.installmentCount);
        metadata.installmentCount = count;
        metadata.installmentAmount =
          count > 0 ? Math.round((totalAmount / count) * 100) / 100 : 0;
        metadata.installmentPeriod = installmentPeriod;
        metadata.totalAmount = totalAmount;
        metadata.installmentState = {};
      }

      if (pageType === "school") {
        metadata.students = students;
        metadata.className = schoolClass;
        metadata.requiredFields = requiredFields;
        metadata.feeBreakdown = feeBreakdown;
      } else if (pageType === "donation") {
        metadata.suggestedAmounts = suggestedAmounts;
        metadata.showDonorList = showDonorList;
        metadata.allowDonorMessage = allowDonorMessage;
        metadata.requireDonorName = requireDonorName;
        metadata.minimumDonation = minimumDonation;
      } else if (pageType === "physical") {
        metadata.variants = variants.map((v) => {
          const { priceOverridden, ...rest } = v as any;
          return rest;
        });
        metadata.requiresShipping = requiresShipping;
        metadata.stock = stock;
        metadata.allowMultiple = allowMultiple;
      } else if (pageType === "digital") {
        metadata.downloadUrl = downloadUrl;
        metadata.accessLink = accessLink;
        metadata.emailDelivery = emailDelivery;
        metadata.stock = stock;
        metadata.allowMultiple = allowMultiple;
      } else if (pageType === "services") {
        metadata.bookingEnabled = bookingEnabled;
        metadata.customerNoteEnabled = customerNoteEnabled;
        metadata.stock = stock;
        metadata.allowMultiple = allowMultiple;
      } else if (isInvestmentType(pageType)) {
        if (isInvestment) {
          metadata.minimumAmount = Number(minimumAmount);
          metadata.expectedReturn = expectedReturn;
          metadata.tenure = tenure;
          metadata.charges = charges;
          metadata.paymentFrequency = paymentFrequency;
          metadata.termsAndConditions = termsAndConditions;
          metadata.riskExplanation = riskExplanation;
          metadata.cacCertificate = cacCertificate;
          metadata.taxClearance = taxClearance;
          metadata.explainerVideo = explainerVideo;
          metadata.socialLinks = socialLinks;
          metadata.website = website;
          metadata.contactInfo = contactInfo;
          metadata.stock = stock;
          metadata.allowMultiple = allowMultiple;
        }
      }

      // ─── WhatsApp Contact Me ───
      if (whatsappContactEnabled && whatsappContactNumber.trim()) {
        metadata.whatsappContactEnabled = true;
        metadata.whatsappContactNumber = whatsappContactNumber.trim();
      }

      // ─── Transaction Fee Payer ───
      metadata.feePayer = form.feePayer || "merchant(me)";

      const finalSlug = generatedSlug || slugify(form.title);

      const validationResult = await validateSlug(finalSlug);
      if (!validationResult.valid || validationResult.isTaken) {
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

      let finalPrice = form.price;
      if (pageType === "school") {
        finalPrice = feeBreakdown
          .reduce((sum, item) => sum + (item.amount || 0), 0)
          .toString();
      }

      const pageData = {
        title: form.title,
        slug: finalSlug,
        description: form.description,
        coverImage: finalCoverImage,
        logo: null,
        productImages: uploadedProducts.filter((url) => url !== null),
        priceType: pageType === "donation" ? "open" : form.priceType,
        price: pageType === "donation" ? 0 : Number(finalPrice),
        installmentCount:
          form.priceType === "installment"
            ? Number(form.installmentCount)
            : undefined,
        feeMode: form.feePayer === "customers" ? "customer" : "bearer",
        pageType: pageType,
        metadata: metadata,
      };

      const result = await createPage(pageData);
      if (!result) throw new Error("No response from server");

      let pageSlug = null;
      if (typeof result === "object") {
        pageSlug = result.slug || result.page?.slug || result.data?.slug;
      }

      if (!pageSlug) throw new Error("Server didn't return a valid slug");

      setCreatedSlug(pageSlug);
      if (result.page) addPage(result.page);

      triggerConfetti();
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Create page error:", err);
      alert(err.message || "Failed to create page. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const pageUrl = getPageUrl();
  const getFullPageUrl = () => {
    if (typeof window !== "undefined" && pageUrl && pageUrl !== "#") {
      return `${window.location.origin}${pageUrl}`;
    }
    return pageUrl;
  };

  const fullPageUrl = getFullPageUrl();
  const copyPageUrl = () => copyToClipboard(fullPageUrl, setCopied);

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
      </div>
    );
  }

  if (!pageType) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <PageTypeSelector onSelect={setPageType} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (pageType === "link") {
    router.push("/dashboard/services/payment/create-link");
    return null;
  }

  const numericPrice = Number(form.price) || 0;

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setPageType(null)}
              className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--color-accent-yellow) mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Change Type
            </button>

            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-32"
              >
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="border-[#e1bf46] text-[#e1bf46] hover:bg-[#e1bf46]/10"
                  >
                    <Eye className="h-4 w-4 mr-2" /> Preview Page
                  </Button>
                </div>

                {/* Product Images */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                    Product Images{" "}
                    <span className="text-(--text-secondary) ml-2 font-normal">
                      (Required for product pages)
                    </span>
                  </Label>
                  <input
                    type="file"
                    ref={productRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  <div className="flex flex-wrap gap-3">
                    {productPreviews.map((img, i) => (
                      <div
                        key={i}
                        className="relative h-32 w-32 rounded-xl overflow-hidden group border-2 border-gray-700 hover:border-[#e1bf46] transition-all"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`Product ${i + 1}`}
                        />
                        <button
                          onClick={() => removeProductImage(i)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => productRef.current?.click()}
                      className="h-32 w-32 rounded-xl border-2 border-dashed border-(--border-color) bg-(--bg-secondary)/50 flex flex-col items-center justify-center hover:border-(--color-accent-yellow) transition-colors gap-2"
                    >
                      <ImagePlus className="h-8 w-8 text-(--text-secondary)" />
                      <span className="text-xs text-(--text-secondary) text-center px-2">
                        Add Images
                      </span>
                    </button>
                  </div>
                  {productPreviews.length === 0 && (
                    <div className="mt-2 text-xs text-yellow-500">
                      ⚠️ Adding product images helps customers see what they're
                      buying
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                    Page Title *
                  </Label>
                  <Input
                    placeholder={getPlaceholderText(pageType, "title")}
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="h-12 text-base border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
                  />
                  <p className="text-xs text-(--text-secondary) mt-1">
                    Example: {getPlaceholderText(pageType, "title")}
                  </p>
                </div>

                {/* URL Preview */}
                {form.title && (
                  <div className="bg-(--bg-secondary)/50 rounded-lg p-4 border border-(--border-color)">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold text-(--color-accent-yellow)">
                        Your Page URL:
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 bg-(--bg-primary) p-3 rounded-lg border border-(--border-color)">
                      <Link2 className="h-4 w-4 text-(--color-accent-yellow) shrink-0" />
                      <code className="text-sm font-mono text-(--text-primary) break-all">
                        {store?.slug
                          ? `/store/${store.slug}/${
                              generatedSlug || slugify(form.title)
                            }`
                          : "Loading store..."}
                      </code>
                      {slugValidation.isChecking && (
                        <Loader2 className="h-4 w-4 animate-spin text-(--color-accent-yellow) ml-2" />
                      )}
                    </div>

                    {!slugValidation.isChecking && slugValidation.message && (
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
                          {slugValidation.isTaken}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                    Description{" "}
                    <span className="text-(--text-secondary) ml-2 font-normal">
                      (Rich text supported)
                    </span>
                  </Label>
                  <RichTextArea
                    value={form.description}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, description: value }))
                    }
                    placeholder={getPlaceholderText(pageType, "description")}
                    minHeight="200px"
                  />
                </div>

                {/* Type-Specific Fields */}
                <div className="p-5 rounded-2xl border border-(--border-color) bg-(--bg-secondary)">
                  <h3 className="font-bold text-sm mb-4 text-(--color-accent-yellow)">
                    {typeLabels[pageType]} Settings
                  </h3>

                  {pageType === "school" && (
                    <div>
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
                      {students.length === 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                Students Required
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-300">
                                Please add at least one student to create a
                                school fees page.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {pageType === "donation" && (
                    <DonationFields
                      suggestedAmounts={suggestedAmounts}
                      setSuggestedAmounts={setSuggestedAmounts}
                      showDonorList={showDonorList}
                      setShowDonorList={setShowDonorList}
                      allowDonorMessage={allowDonorMessage}
                      setAllowDonorMessage={setAllowDonorMessage}
                      requireDonorName={requireDonorName}
                      setRequireDonorName={setRequireDonorName}
                      minimumDonation={minimumDonation}
                      setMinimumDonation={setMinimumDonation}
                    />
                  )}

                  {pageType === "physical" && (
                    <PhysicalFields
                      variants={variants}
                      setVariants={setVariants}
                      requiresShipping={requiresShipping}
                      setRequiresShipping={setRequiresShipping}
                      stock={stock}
                      setStock={setStock}
                      allowMultiple={allowMultiple}
                      setAllowMultiple={setAllowMultiple}
                      pagePrice={Number(form.price) || 0}
                    />
                  )}

                  {pageType === "digital" && (
                    <DigitalFields
                      downloadUrl={downloadUrl}
                      setDownloadUrl={setDownloadUrl}
                      accessLink={accessLink}
                      setAccessLink={setAccessLink}
                      emailDelivery={emailDelivery}
                      setEmailDelivery={setEmailDelivery}
                      stock={stock}
                      setStock={setStock}
                      allowMultiple={allowMultiple}
                      setAllowMultiple={setAllowMultiple}
                    />
                  )}

                  {pageType === "services" && (
                    <ServicesFields
                      bookingEnabled={bookingEnabled}
                      setBookingEnabled={setBookingEnabled}
                      customerNoteEnabled={customerNoteEnabled}
                      setCustomerNoteEnabled={setCustomerNoteEnabled}
                      stock={stock}
                      setStock={setStock}
                      allowMultiple={allowMultiple}
                      setAllowMultiple={setAllowMultiple}
                    />
                  )}

                  {isInvestment && (
                    <InvestmentFields
                      minimumAmount={minimumAmount}
                      setMinimumAmount={setMinimumAmount}
                      expectedReturn={expectedReturn}
                      setExpectedReturn={setExpectedReturn}
                      tenure={tenure}
                      setTenure={setTenure}
                      charges={charges}
                      setCharges={setCharges}
                      paymentFrequency={paymentFrequency}
                      setPaymentFrequency={setPaymentFrequency}
                      termsAndConditions={termsAndConditions}
                      setTermsAndConditions={setTermsAndConditions}
                      riskExplanation={riskExplanation}
                      setRiskExplanation={setRiskExplanation}
                      stock={stock}
                      setStock={setStock}
                      allowMultiple={allowMultiple}
                      setAllowMultiple={setAllowMultiple}
                    />
                  )}
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
                        onChange={(e) =>
                          setWhatsappContactNumber(e.target.value)
                        }
                        className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
                      />
                      <p className="text-xs text-(--text-secondary) mt-1">
                        Enter your WhatsApp number with country code (e.g.
                        2348012345678 for Nigeria)
                      </p>
                    </div>
                  )}
                </div>

                {/* Trust Signals */}
                {isInvestment && (
                  <TrustSignals
                    cacCertificate={cacCertificate}
                    setCacCertificate={setCacCertificate}
                    taxClearance={taxClearance}
                    setTaxClearance={setTaxClearance}
                    explainerVideo={explainerVideo}
                    setExplainerVideo={setExplainerVideo}
                    socialLinks={socialLinks}
                    setSocialLinks={setSocialLinks}
                    website={website}
                    setWebsite={setWebsite}
                    contactInfo={contactInfo}
                    setContactInfo={setContactInfo}
                  />
                )}

                {/* PRICING */}
                {pageType !== "donation" && (
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
                            onClick={() =>
                              setForm((f) => ({ ...f, priceType: val }))
                            }
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              form.priceType === val
                                ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                                : "border-(--border-color) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                            }`}
                          >
                            {val === "fixed"
                              ? "One-time Payment"
                              : "Installments"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction Fee Option */}
                    <div className="mt-4">
                      <Label className="text-sm font-semibold mb-3 block text-(--text-primary)">
                        Transaction Fee (3.5%)
                      </Label>
                      <div className="space-y-2">
                        {[
                          { value: "customers", label: "Customers pay fee" },
                          {
                            value: "merchant(me)",
                            label: "Merchant (me) pays fee",
                          },
                          {
                            value: "split between both parties",
                            label: "Split between both parties",
                          },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-3 p-3 rounded-xl border border-(--border-color) bg-(--bg-secondary) cursor-pointer hover:border-(--color-accent-yellow)/50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="feePayer"
                              value={opt.value}
                              checked={form.feePayer === opt.value}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  feePayer: e.target.value as any,
                                }))
                              }
                              className="h-4 w-4 text-(--color-accent-yellow) border-(--border-color) focus:ring-(--color-accent-yellow)"
                            />
                            <span className="text-sm text-(--text-primary)">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                        {pageType === "school"
                          ? "Total Amount (₦)"
                          : pageAmountLocked
                            ? "Page Amount (₦) — not used"
                            : form.priceType === "installment"
                              ? "Total Amount (₦)"
                              : "Amount (₦)"}
                      </Label>

                      <Input
                        type="number"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) =>
                          pageType !== "school" &&
                          !pageAmountLocked &&
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        className={`h-12 text-base border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0 ${
                          pageAmountLocked
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={pageType === "school" || pageAmountLocked}
                      />

                      {pageType === "school" && (
                        <p className="text-xs text-(--text-secondary) mt-1">
                          Amount is calculated from your fee breakdown above
                        </p>
                      )}

                      {pageAmountLocked && (
                        <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
                          <Info className="h-3.5 w-3.5 text-(--color-accent-yellow) shrink-0 mt-0.5" />
                          <p className="text-xs text-(--text-secondary)">
                            Every variant has its own price, so this field isn't
                            used for checkout. Buyers pay the price of the
                            variant they pick. Shown for reference:{" "}
                            <strong className="text-(--text-primary)">
                              ₦{Number(form.price).toLocaleString()}
                            </strong>{" "}
                            (total of all variant prices).
                          </p>
                        </div>
                      )}

                      {someVariantMissingPrice && (
                        <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            Some variants don't have a price. Buyers who pick
                            those will pay this page amount instead.
                          </p>
                        </div>
                      )}
                    </div>

                    {form.priceType === "installment" && (
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
                              value={form.installmentCount}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  installmentCount: e.target.value,
                                }))
                              }
                              className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold mb-1 block text-(--text-secondary)">
                              Frequency
                            </Label>
                            <select
                              value={installmentPeriod}
                              onChange={(e) =>
                                setInstallmentPeriod(e.target.value)
                              }
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

                    <PricingSummaryCard
                      priceType={form.priceType}
                      price={numericPrice}
                      installmentCount={form.installmentCount}
                      installmentPeriod={installmentPeriod}
                      installmentAmount={installmentAmount}
                      variants={variants.map((v) => ({
                        name: v.name || "",
                        price: Number(v.price) || 0,
                      }))}
                      isPhysicalWithVariants={isPhysical && hasVariants}
                      feePayer={form.feePayer}
                    />
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </main>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0  bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-3xl mx-auto">
            {isPhysical &&
              variants.length > 0 &&
              (() => {
                const parsedPageStock =
                  stock != null && String(stock).trim() !== ""
                    ? Number(stock)
                    : null;
                const hasRealPageStock =
                  parsedPageStock !== null &&
                  Number.isFinite(parsedPageStock) &&
                  parsedPageStock > 0;

                const variantStockValues = variants
                  .map((v) => {
                    const raw = v?.stock as unknown;
                    if (raw == null) return null;
                    const trimmed = String(raw).trim();
                    if (trimmed === "") return null;
                    const parsed = Number(trimmed);
                    return Number.isFinite(parsed) && parsed > 0
                      ? parsed
                      : null;
                  })
                  .filter((n): n is number => n !== null);

                const allVariantsCounted =
                  variantStockValues.length === variants.length;
                const variantSum = variantStockValues.reduce(
                  (s, n) => s + n,
                  0,
                );

                if (
                  hasRealPageStock &&
                  allVariantsCounted &&
                  variantSum > parsedPageStock!
                ) {
                  return (
                    <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-red-700 dark:text-red-400">
                        Variant stock ({variantSum}) exceeds page stock (
                        {parsedPageStock}). Fix your inventory before creating
                        this page.
                      </p>
                    </div>
                  );
                }

                return null;
              })()}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowPreview(true)}
                className="py-6 px-5 border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
              >
                <Eye className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Preview</span>
              </Button>

              <Button
                variant="default"
                size="lg"
                className="flex-1 py-6 text-base bg-[#FDC020] text-[#191919] hover:bg-[#e6a800]"
                onClick={handleCreate}
                disabled={!canCreate() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  `Create ${typeLabels[pageType]} Page`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
              className="bg-(--bg-primary) rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl border border-(--border-color) mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                🎉
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-(--text-primary) mb-2">
                Payment Page Created!
              </h2>
              <p className="text-sm sm:text-base text-(--text-secondary) mb-4 sm:mb-6">
                Your page is now live and ready to collect payments.
              </p>

              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-(--border-color)">
                <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
                  Your Payment Link:
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-(--bg-primary) rounded-lg p-2 sm:p-3 border border-(--border-color)">
                    <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                    <code className="text-xs sm:text-sm font-mono text-(--text-primary) break-all flex-1 text-left">
                      {fullPageUrl}
                    </code>
                  </div>
                  <button
                    onClick={copyPageUrl}
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
                  variant="outline"
                  className="flex-1 border-(--border-color) text-(--text-primary) hover:bg-[var(--bg-secondary)]"
                  onClick={() => {
                    setShowSuccess(false);
                    if (fullPageUrl && fullPageUrl !== "#")
                      window.open(fullPageUrl, "_blank");

                    router.push("/dashboard/services/payment/dashboard");
                  }}
                >
                  Preview Page
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-[#FDC020] text-[#191919] hover:bg-[#e6a800]"
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

      {/* ─── CUSTOMER PREVIEW MODAL ─── */}
      <CustomerPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        data={{
          title: form.title || `Untitled ${typeLabels[pageType]}`,
          description: form.description,
          productImage: productPreviews[0] || null,
          productImages: productPreviews,
          // ── For school pages, use computed total from fee breakdown
          price:
            pageType === "school"
              ? feeBreakdown.reduce((sum, f) => sum + (f.amount || 0), 0)
              : Number(form.price) || 0,
          priceType: form.priceType,
          installmentCount: Number(form.installmentCount) || 1,
          installmentAmount:
            pageType === "school"
              ? feeBreakdown.reduce((sum, f) => sum + (f.amount || 0), 0) /
                Math.max(1, Number(form.installmentCount) || 1)
              : installmentAmount,
          installmentPeriod,
          amountMode: pageType === "donation" ? "variable" : "fixed",
          storeName: store?.name || "Your Store",
          storeSlug: store?.slug || "",
          config: {
            buttonText:
              pageType === "donation"
                ? "Donate now"
                : pageType === "school"
                  ? "Pay Fees"
                  : pageType === "services"
                    ? "Book Now"
                    : "Pay Now",
            buttonColor: "#FDC020",
          },
          pageType: pageType,
          // ── extras
          suggestedAmounts:
            pageType === "donation" ? suggestedAmounts : undefined,
          minimumDonation:
            pageType === "donation" ? minimumDonation : undefined,
          variants:
            pageType === "physical"
              ? variants.map((v) => ({
                  name: v.name || "",
                  price: Number(v.price) || 0,
                  stock: v.stock,
                }))
              : undefined,
          entities:
            pageType === "school"
              ? students.map((s, i) => ({
                  id: (s as any).id || `student-${i}`,
                  name: s.name,
                  metadata: { className: schoolClass },
                  remainingBalance:
                    feeBreakdown.reduce((sum, f) => sum + (f.amount || 0), 0) ||
                    0,
                }))
              : undefined,
          stock: stock,
          allowMultiple: allowMultiple,
          requiresShipping:
            pageType === "physical" ? requiresShipping : undefined,
          emailDelivery: pageType === "digital" ? emailDelivery : undefined,
          bookingEnabled: pageType === "services" ? bookingEnabled : undefined,
          customerNoteEnabled:
            pageType === "services" ? customerNoteEnabled : undefined,
          minimumAmount:
            isInvestment && minimumAmount ? minimumAmount : undefined,
          expectedReturn:
            isInvestment && expectedReturn ? expectedReturn : undefined,
          tenure: isInvestment && tenure ? tenure : undefined,
          whatsappContactEnabled: whatsappContactEnabled,
          whatsappContactNumber: whatsappContactNumber,
        }}
      />
    </div>
  );
}
