// app/components/payment-page-components/CreatePage/index.tsx
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
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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

const ZIDWELL_FEE_RATE = 0.03;

const getPlaceholderText = (
  pageType: PageType | null,
  field: "title" | "description"
): string => {
  if (!pageType)
    return field === "title"
      ? "Enter page title"
      : "Describe your product or service...";

  const placeholders: Record<
    PageType,
    { title: string; description: string }
  > = {
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
  setCopied: (value: boolean) => void
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
}: {
  priceType: "fixed" | "installment";
  price: number;
  installmentCount: string;
  installmentPeriod: string;
  installmentAmount: number;
}) {
  if (price <= 0) return null;

  const isInstallment =
    priceType === "installment" && Number(installmentCount) > 1;

  const fee = price * ZIDWELL_FEE_RATE;
  const youReceiveTotal = price - fee;
  const perInstallmentFee = isInstallment
    ? installmentAmount * ZIDWELL_FEE_RATE
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
                  {formatNaira(installmentAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-(--text-secondary)">
                {isInstallment ? "Total across all installments" : "Amount"}
              </span>
              <span className="font-bold text-(--text-primary)">
                {formatNaira(price)}
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
          ✓ The buyer pays exactly the amount shown. The 3% fee is deducted from
          your payout — you never charge the buyer extra.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// LIVE PREVIEW MODAL
// ============================================================
function LivePreviewModal({
  isOpen,
  onClose,
  pageType,
  productImages,
  title,
  description,
  price,
  installmentCount,
  installmentPeriod,
  priceType,
}: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = productImages || [];

  if (!isOpen) return null;

  const isInstallment =
    priceType === "installment" && Number(installmentCount) > 1;
  const perInstallment =
    isInstallment && Number(price) > 0
      ? Number(price) / Number(installmentCount)
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#023528] px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#e1bf46]" />
                <span className="text-lg font-semibold text-white">
                  Live Preview
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  What shoppers will see
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {images.length > 0 ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2">
                    <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-gray-700">
                      <img
                        src={images[currentImageIndex]}
                        alt={title || "Product"}
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev === 0 ? images.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev === images.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {images.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                              idx === currentImageIndex
                                ? "border-[#e1bf46]"
                                : "border-gray-700 hover:border-gray-500"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:w-1/2 space-y-3">
                    <span className="text-xs bg-[#e1bf46]/10 text-[#e1bf46] px-2 py-0.5 rounded-full">
                      {pageType
                        ? typeLabels[pageType as PageType] || "Product"
                        : "Product"}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {title || "Your Product Title"}
                    </h3>
                    {description && (
                      <div
                        className="text-sm text-gray-400 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    )}

                    {isInstallment ? (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-[#e1bf46]">
                          {formatNaira(perInstallment)}
                          <span className="text-sm text-gray-400 ml-1">
                            × {installmentCount}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {installmentPeriod} installments — total ₦
                          {Number(price).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-[#e1bf46]">
                        {formatNaira(Number(price) || 0)}
                      </p>
                    )}

                    <div className="bg-[#1a1a1a] rounded-lg p-2">
                      <p className="text-xs text-gray-400">
                        Transaction fee:{" "}
                        <span className="text-[#e1bf46]">3%</span>
                      </p>
                    </div>
                    <button className="w-full bg-[#e1bf46] text-[#023528] font-semibold py-3 rounded-xl hover:bg-[#e1bf46]/90">
                      Pay with Card
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-20 w-20 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">
                    {title || "Your Product"}
                  </h3>
                  {description && (
                    <div
                      className="text-gray-400 text-sm mt-2"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  )}

                  {isInstallment ? (
                    <div className="mt-4 space-y-1">
                      <p className="text-3xl font-bold text-[#e1bf46]">
                        {formatNaira(perInstallment)}
                        <span className="text-sm text-gray-400 ml-1">
                          × {installmentCount}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {installmentPeriod} installments — total ₦
                        {Number(price).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-[#e1bf46] mt-4">
                      {formatNaira(Number(price) || 0)}
                    </p>
                  )}

                  <button className="mt-4 bg-[#e1bf46] text-[#023528] font-semibold px-8 py-3 rounded-xl hover:bg-[#e1bf46]/90">
                    Pay with Card
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 px-6 py-4 flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Close Preview
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    Math.floor(100 + Math.random() * 900).toString()
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

  // ─── STOCK / QUANTITY (shared across page types) ───
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

  const [cacCertificate, setCacCertificate] = useState("");
  const [taxClearance, setTaxClearance] = useState("");
  const [explainerVideo, setExplainerVideo] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    { platform: string; url: string }[]
  >([]);
  const [website, setWebsite] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const productRef = useRef<HTMLInputElement>(null);

  // Installment amount recompute
  useEffect(() => {
    if (form.priceType === "installment") {
      const totalAmount = Number(form.price) || 0;
      const count = Number(form.installmentCount) || 1;
      setInstallmentAmount(
        totalAmount > 0 && count > 0 ? totalAmount / count : 0
      );
    }
  }, [form.price, form.installmentCount, form.priceType]);

  // Sync school price from fee breakdown
  useEffect(() => {
    if (pageType === "school") {
      const total = feeBreakdown.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      if (total > 0) setForm((f) => ({ ...f, price: total.toString() }));
    }
  }, [feeBreakdown, pageType]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Slug generation + validation
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
    [validateSlug]
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
          `File "${file.name}" is not supported. Please upload JPG, PNG, WEBP, or HEIC images.`
        );
        return;
      }
      if (file.size > PRODUCT_IMAGE_SPECS.maxSize) {
        alert(
          `File "${file.name}" exceeds 10MB limit. Please compress your image.`
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
        feeBreakdown.length > 0 &&
        feeBreakdown.some((item) => item.amount > 0);
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
          .then((data) => data.url)
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
        metadata.variants = variants;
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
        feeMode: "bearer",
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
        <div className="lg:pl-72 min-h-screen flex flex-col">
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
      <div className="lg:pl-72 min-h-screen flex flex-col">
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

                    <div>
                      <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
                        {form.priceType === "installment"
                          ? "Total Amount (₦)"
                          : "Amount (₦)"}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) =>
                          pageType !== "school" &&
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        className="h-12 text-base border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
                        disabled={pageType === "school"}
                      />
                      {pageType === "school" && (
                        <p className="text-xs text-(--text-secondary) mt-1">
                          Amount is calculated from your fee breakdown above
                        </p>
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
                    />
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </main>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-[#FDC020] text-[#191919] hover:bg-[#e6a800]"
              onClick={handleCreate}
              disabled={!canCreate() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                `Create ${typeLabels[pageType]} Page`
              )}
            </Button>
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
              className="bg-[var(--bg-primary)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl border border-[var(--border-color)] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                🎉
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                Payment Page Created!
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 sm:mb-6">
                Your page is now live and ready to collect payments.
              </p>

              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border-color)]">
                <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
                  Your Payment Link:
                </Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] rounded-lg p-2 sm:p-3 border border-[var(--border-color)]">
                    <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                    <code className="text-xs sm:text-sm font-mono text-[var(--text-primary)] break-all flex-1 text-left">
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
                  className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
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
                className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        pageType={pageType}
        productImages={productPreviews}
        title={form.title}
        description={form.description}
        price={form.price}
        installmentCount={form.installmentCount}
        installmentPeriod={installmentPeriod}
        priceType={form.priceType}
      />
    </div>
  );
}