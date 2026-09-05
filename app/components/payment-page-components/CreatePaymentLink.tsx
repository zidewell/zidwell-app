"use client";

import { useRef, useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Link2,
  RefreshCw,
  CheckCircle,
  Copy,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Package,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { useStore, CustomField, LinkConfig } from "@/app/hooks/useStore";
import { useUserContextData } from "@/app/context/userData";
import confetti from "canvas-confetti";
import { useTheme } from "@/app/components/ThemeProvider";
import RichTextArea from "@/app/components/payment-page-components/RichTextArea";

// ✅ Product image specs - Instagram style 1350x1080
const PRODUCT_IMAGE_SPECS = {
  width: 1350,
  height: 1080,
  ratio: "5:4",
  description: "1350 x 1080 pixels (5:4 ratio) - Instagram style",
  maxSize: 10 * 1024 * 1024, // 10MB
  formats: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
};

// Function to validate title for virtual account naming
const validateTitleForVirtualAccount = (
  title: string,
  className?: string,
): { isValid: boolean; message: string; cleanedName: string } => {
  let fullName = title;
  if (className && className.trim()) {
    fullName = `${className} ${title}`;
  }

  let cleaned = fullName.toUpperCase();
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const length = cleaned.length;

  if (length < 8) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned}" (${length} chars). Minimum 8 characters required. Please make your title longer.`,
      cleanedName: cleaned,
    };
  }

  if (length > 64) {
    return {
      isValid: false,
      message: `Account name will be "${cleaned.substring(0, 50)}..." (${length} chars). Maximum 64 characters allowed. Please shorten your title.`,
      cleanedName: cleaned.substring(0, 64),
    };
  }

  return {
    isValid: true,
    message: `✓ Account name will be "${cleaned}" (${length} chars)`,
    cleanedName: cleaned,
  };
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
// LIVE PREVIEW MODAL COMPONENT
// ============================================================
function LivePreviewModal({
  isOpen,
  onClose,
  title,
  description,
  productImage,
  previewPrice,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  productImage: string | null;
  previewPrice: string;
  config: LinkConfig;
}) {
  const images = productImage ? [productImage] : [];

  if (!isOpen) return null;

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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderTop: `4px solid ${config.brandColor}` }}
          >
            {/* Modal Header */}
            <div className="bg-[#023528] px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#e1bf46]" />
                <span className="text-lg font-semibold text-white">Live Preview</span>
                <span className="text-xs text-gray-400 ml-2">What shoppers will see</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Section - Left */}
                <div className="md:w-1/2">
                  <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-gray-700">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={title || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png';
                          e.currentTarget.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <Package className="h-16 w-16 mb-2 opacity-30" />
                        <p className="text-sm">No image uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section - Right */}
                <div className="md:w-1/2 space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${config.brandColor}15` }}
                    >
                      <Link2 className="h-4 w-4" style={{ color: config.brandColor }} />
                    </div>
                    <span className="text-xs bg-[#e1bf46]/10 text-[#e1bf46] px-2 py-0.5 rounded-full">
                      Payment Link
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white leading-tight">
                    {title || "Your Link Title"}
                  </h3>

                  {description && (
                    <div 
                      className="text-sm text-gray-400 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  )}

                  <div className="py-2">
                    <div className="text-xs text-gray-400">Amount</div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: config.brandColor }}
                    >
                      {previewPrice}
                    </p>
                  </div>

                  {/* Customer Fields Preview */}
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">
                        Full Name *
                      </div>
                      <div className="h-8 rounded-md border border-gray-700 bg-[#1a1a1a]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">
                        Email *
                      </div>
                      <div className="h-8 rounded-md border border-gray-700 bg-[#1a1a1a]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">
                        Phone
                      </div>
                      <div className="h-8 rounded-md border border-gray-700 bg-[#1a1a1a]" />
                    </div>
                    {config.customFields.slice(0, 3).map((f) => (
                      <div key={f.id}>
                        <div className="text-[10px] text-gray-400 mb-0.5">
                          {f.label}{f.required ? " *" : ""}
                        </div>
                        <div className="h-8 rounded-md border border-gray-700 bg-[#1a1a1a]" />
                      </div>
                    ))}
                    {config.customFields.length > 3 && (
                      <p className="text-xs text-gray-400">
                        + {config.customFields.length - 3} more fields
                      </p>
                    )}
                  </div>

                  <button
                    className="w-full py-3 rounded-xl font-bold text-sm transition-colors"
                    style={{ background: config.buttonColor, color: "#191919" }}
                  >
                    {config.buttonText}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-3.5 w-3.5" />
                    Secured by Zidwell
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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

const CreatePaymentLink = () => {
  const router = useRouter();
  const { createPage, store, loading, hasStore } = useStore();
  const { userData } = useUserContextData();
  const { theme } = useTheme();
  const generatedId = useId();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [config, setConfig] = useState<LinkConfig>(defaultConfig);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [titleValidation, setTitleValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: "" });
  const [showPreview, setShowPreview] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof LinkConfig>(k: K, v: LinkConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  const generateIdentifier = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateFullSlug = (titleText: string): string => {
    const baseSlug = slugify(titleText);
    const identifier = generateIdentifier();
    return `${identifier}-${baseSlug}`;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Redirect if no store exists
  useEffect(() => {
    if (!loading && !hasStore) {
      router.push("/dashboard/services/payment/dashboard");
    }
  }, [loading, hasStore, router]);

  // Validate title for virtual account naming
  useEffect(() => {
    if (title) {
      const validation = validateTitleForVirtualAccount(title);
      setTitleValidation(validation);
    } else {
      setTitleValidation({ isValid: true, message: "" });
    }
  }, [title]);

  // Handle product image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      alert(`File "${file.name}" is not supported. Please upload JPG, PNG, WEBP, or HEIC images.`);
      return;
    }

    if (file.size > PRODUCT_IMAGE_SPECS.maxSize) {
      alert(`File "${file.name}" exceeds 10MB limit. Please compress your image.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProductImage(result);
      setProductPreview(result);
    };
    reader.readAsDataURL(file);

    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const onTitleChange = (t: string) => {
    setTitle(t);
    if (t) {
      const baseSlug = slugify(t);
      const identifier = generateIdentifier();
      setSlug(`${identifier}-${baseSlug}`);
    } else {
      setSlug("");
    }
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

  const canCreate =
    title.trim() && titleValidation.isValid && (config.amountMode === "variable" || Number(price) > 0);

  const generateFinalSlug = () => {
    const baseSlug = slugify(title);
    const slugParts = slug?.split("-") || [];
    let identifier = slugParts[0] || generateIdentifier();
    if (!/^\d{4}$/.test(identifier)) {
      identifier = generateIdentifier();
    }
    return `${baseSlug}-${identifier}`;
  };

  // ✅ Generate page URL with proper store slug
  const getPageUrl = () => {
    const storeSlug = store?.slug || '';
    if (!storeSlug) {
      console.warn("No store slug available for URL generation");
      return '#';
    }
    return `${window.location.origin}/store/${storeSlug}/${createdSlug}`.replace(/\/+/g, '/');
  };

  const pageUrl = getPageUrl();
  
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateSlug = () => {
    const baseSlug = slugify(title);
    const newIdentifier = generateIdentifier();
    setSlug(`${baseSlug}-${newIdentifier}`);
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsCreating(true);

    try {
      const finalSlug = generateFinalSlug();

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

      const metadata = {
        pageType: "link",
        storeSlug: store?.slug,
        linkConfig: {
          currency: config.currency,
          amountMode: config.amountMode,
          active: config.active,
          brandColor: config.brandColor,
          buttonColor: config.buttonColor,
          buttonText: config.buttonText,
          successMessage: config.successMessage,
          thankYouMessage: config.thankYouMessage,
          redirectUrl: config.redirectUrl,
          altRedirectUrl: config.altRedirectUrl,
          referenceCode: config.referenceCode,
          customFields: config.customFields,
          qrColor: config.qrColor,
          qrBackground: config.qrBackground,
          qrFrame: config.qrFrame,
          createdAt: new Date().toISOString(),
        },
      };

      const pageData = {
        title: title,
        slug: finalSlug,
        description: description,
        coverImage: uploadedImageUrl || null,
        logo: null,
        productImages: uploadedImageUrl ? [uploadedImageUrl] : [],
        priceType: config.amountMode === "variable" ? "open" : "fixed",
        price: Number(price) || 0,
        installmentCount: null,
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

  const previewPrice =
    config.amountMode === "variable"
      ? "Buyer chooses"
      : `${config.currency === "NGN" ? "₦" : config.currency + " "}${(Number(price) || 0).toLocaleString()}`;

  // ✅ Show loading state
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-yellow)]" />
      </div>
    );
  }

  // ✅ If no store, show message
  if (!hasStore) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto py-20 px-4 text-center">
          <Package className="h-16 w-16 mx-auto text-[var(--text-secondary)] mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)]">No Store Found</h3>
          <p className="text-[var(--text-secondary)] mt-2">
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
      {/* ✅ Back Button */}
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
        {/* ✅ Live Preview Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="border-[#e1bf46] text-[#e1bf46] hover:bg-[#e1bf46]/10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Page
          </Button>
        </div>

        {/* ✅ Product Image - Smaller (aspect-[4/3]) */}
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
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Premium Coaching Session"
            className="h-12 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
          />
          {title && (
            <div
              className={`mt-2 text-xs flex items-start gap-2 p-2 rounded-lg ${
                titleValidation.isValid
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {titleValidation.isValid ? (
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              )}
              <span className="flex-1">{titleValidation.message}</span>
            </div>
          )}
        </div>

        {/* URL Preview */}
        {title && (
          <div className="bg-(--bg-secondary)/50 rounded-lg p-4 border border-(--border-color)">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-(--color-accent-yellow)">
                Your Payment Link URL:
              </Label>
              <button
                onClick={regenerateSlug}
                className="flex items-center gap-1 text-xs text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80"
              >
                <RefreshCw className="h-3 w-3" /> New ID
              </button>
            </div>
            <div className="flex items-center gap-2 bg-(--bg-primary) p-3 rounded-lg border border-(--border-color)">
              <Link2 className="h-4 w-4 text-(--color-accent-yellow) shrink-0" />
              <code className="text-sm font-mono text-(--text-primary) break-all">
                {store?.slug ? `/store/${store.slug}/${generateFinalSlug()}` : 'Please select a store first'}
              </code>
            </div>
            <p className="text-xs text-(--text-secondary) mt-2">
              💡 Your URL includes a unique 4-digit identifier
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
                set(
                  "currency",
                  e.target.value as "NGN" | "USD" | "GBP" | "EUR",
                )
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

        {/* Amount for fixed mode */}
        {config.amountMode === "fixed" && (
          <div>
            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
              Amount *
            </Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              className="h-12 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
            />
          </div>
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

        {/* Branding Colors */}
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Brand Color"
            value={config.brandColor}
            onChange={(v) => set("brandColor", v)}
          />
          <ColorField
            label="Button Color"
            value={config.buttonColor}
            onChange={(v) => set("buttonColor", v)}
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

        {/* Redirect URLs */}
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
              Alternative Redirect
            </Label>
            <Input
              value={config.altRedirectUrl || ""}
              onChange={(e) => set("altRedirectUrl", e.target.value)}
              placeholder="https://yoursite.com/cancel"
              className="h-11 border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:border-(--color-accent-yellow) focus:ring-0"
            />
          </div>
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
            Add extra fields to collect additional information from your customers (beyond the default Name, Email, Phone).
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
                No custom fields added. Add fields like Passport Number, Booking Date, etc.
              </p>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-(--bg-secondary)/90 backdrop-blur-lg border-t border-(--border-color) p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full py-6 text-base bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
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

      {/* Live Preview Modal */}
      <LivePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title || "Your link title"}
        description={description}
        productImage={productPreview}
        previewPrice={previewPrice}
        config={config}
      />

      {/* Success Modal */}
      {showSuccess && (
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowSuccess(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-[var(--bg-primary)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg w-full text-center shadow-2xl border border-[var(--border-color)] mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎉</div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Payment Link Created!
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 sm:mb-6">
                  Your payment link is now live and ready to collect payments.
                </p>

                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border-color)]">
                  <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
                    Your Payment Link:
                  </Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] rounded-lg p-2 sm:p-3 border border-[var(--border-color)]">
                      <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                      <code className="text-xs sm:text-sm font-mono text-[var(--text-primary)] break-all flex-1 text-left">
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
                    variant="outline"
                    className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => {
                      setShowSuccess(false);
                      window.open(pageUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Preview Page
                  </Button>
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
                  onClick={() => setShowSuccess(false)}
                  className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-semibold mb-2 block text-(--text-primary)">
      {label}
    </Label>
    <div className="flex items-center gap-2 rounded-xl border border-(--border-color) bg-(--bg-primary) px-2 h-12">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded cursor-pointer bg-transparent border-0"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-mono flex-1 outline-none text-(--text-primary)"
      />
    </div>
  </div>
);

export default CreatePaymentLink;