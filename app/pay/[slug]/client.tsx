"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  CheckCircle,
  Copy,
  Banknote,
  Download,
  Truck,
  PackageIcon,
  Image as ImageIcon,
  CreditCard,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

interface Student {
  name: string;
  className: string;
  regNumber?: string;
  paid?: boolean;
  isPartiallyPaid?: boolean;
  paidAmount?: number;
  parentName?: string;
  remainingBalance?: number;
  totalAmount?: number;
}

interface Variant {
  name: string;
  price: number;
  sku?: string;
  stock?: number;
}

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "dropdown" | "checkbox" | "paragraph";
  required: boolean;
  options?: string[];
}

interface LinkConfig {
  currency: "NGN" | "USD" | "GBP" | "EUR";
  amountMode: "fixed" | "variable";
  active: boolean;
  brandColor: string;
  buttonColor: string;
  buttonText: string;
  successMessage: string;
  thankYouMessage: string;
  redirectUrl?: string;
  altRedirectUrl?: string;
  referenceCode?: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  nameRequired: boolean;
  emailRequired: boolean;
  phoneRequired: boolean;
  customFields: CustomField[];
  qrColor: string;
  qrBackground: string;
  qrFrame: "round" | "rounded" | "square";
}

interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  productImages: string[];
  priceType: "fixed" | "installment" | "open";
  price: number;
  installmentCount?: number;
  feeMode: "bearer" | "customer";
  pageType: string;
  metadata: any;
  linkConfig?: LinkConfig;
}

interface PaymentPageClientProps {
  slug: string;
}

type PaymentOption = "full" | "installment";
type PaymentMethodType = "card";

// ============================================================
// PAYMENT LINK COMPONENT (For Payment Link page type) - CARD ONLY
// ============================================================
function PaymentLinkComponent({
  page,
  config,
}: {
  page: PaymentPage;
  config: LinkConfig;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);

  const amount = config.amountMode === "fixed" ? page.price : formData.customAmount;
  const isValidAmount = config.amountMode === "variable" ? amount && amount > 0 : page.price > 0;
  const currencySymbol = config.currency === "NGN" ? "₦" : config.currency === "USD" ? "$" : config.currency === "GBP" ? "£" : "€";

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ============================================================
  // CARD PAYMENT WITH REDIRECTION - PAYMENT LINK
  // ============================================================
  const handleCardPayment = async () => {
    const totalAmount = config.amountMode === "fixed" ? page.price : formData.customAmount;
    if (!totalAmount || totalAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!customerName || !customerName.trim()) newErrors.name = "Name is required";
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) newErrors.email = "Valid email is required";
    if (config.collectPhone && config.phoneRequired && !customerPhone) newErrors.phone = "Phone number is required";
    config.customFields.forEach((field) => {
      if (field.required && !formData[field.id]) newErrors[field.id] = `${field.label} is required`;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessingCardPayment(true);
    setShowCardModal(false);

    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName,
          customerEmail,
          customerPhone,
          amount: totalAmount,
          metadata: {
            pageType: "link",
            pageTitle: page.title,
            paymentType: "link",
            customFields: formData,
            referenceCode: config.referenceCode,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const checkoutWindow = window.open(data.checkoutLink, "_blank", "width=500,height=700");

      // If popup was blocked, redirect instead
      if (!checkoutWindow) {
        window.location.href = data.checkoutLink;
        return;
      }

      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/payment-page/status?reference=${data.orderReference}`
          );
          const statusData = await statusResponse.json();

          if (statusData.payment?.status === "completed") {
            clearInterval(checkInterval);

            if (checkoutWindow && !checkoutWindow.closed) {
              checkoutWindow.close();
            }

            // Get redirect URL - priority: statusData.redirectUrl > config.redirectUrl > config.altRedirectUrl > default
            const redirectUrl = statusData.payment?.redirectUrl ||
              config.redirectUrl ||
              config.altRedirectUrl ||
              `/payment-page-success?reference=${data.orderReference}&status=success`;

            await Swal.fire({
              icon: "success",
              title: "Payment Successful! 🎉",
              html: `
                <div class="text-left">
                  <p class="font-semibold text-green-600">✅ ${config.successMessage || "Payment successful! Thank you."}</p>
                  <p class="text-sm text-gray-600 mt-2">${config.thankYouMessage || "We've received your payment and a receipt has been sent to your email."}</p>
                  <p class="text-sm text-gray-600 mt-2">💰 Amount: <strong>${currencySymbol}${totalAmount.toLocaleString()}</strong></p>
                </div>
              `,
              confirmButtonColor: "#F5B81B",
              confirmButtonText: "Continue",
            });

            window.location.href = redirectUrl;
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000);

      setTimeout(() => clearInterval(checkInterval), 300000);
    } catch (err: any) {
      alert(err.message || "Failed to initiate card payment. Please try again.");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData[field.id] || "";
    const error = errors[field.id];

    switch (field.type) {
      case "text":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{field.label} {field.required && "*"}</Label>
            <Input value={value} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} className="bg-[#1a1a1a] border-gray-700 text-white" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{field.label} {field.required && "*"}</Label>
            <Input type="number" value={value} onChange={(e) => setFormData({ ...formData, [field.id]: parseFloat(e.target.value) })} className="bg-[#1a1a1a] border-gray-700 text-white" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "date":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{field.label} {field.required && "*"}</Label>
            <Input type="date" value={value} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} className="bg-[#1a1a1a] border-gray-700 text-white" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "dropdown":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{field.label} {field.required && "*"}</Label>
            <select value={value} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} className="w-full h-12 rounded-lg border border-gray-700 bg-[#1a1a1a] px-3 text-white">
              <option value="">Select...</option>
              {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="flex items-center gap-3">
            <input type="checkbox" checked={value} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })} className="h-4 w-4 rounded border-gray-700 bg-[#1a1a1a]" />
            <Label className="text-sm text-gray-300">{field.label} {field.required && "*"}</Label>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      case "paragraph":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">{field.label} {field.required && "*"}</Label>
            <Textarea value={value} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} rows={3} className="bg-[#1a1a1a] border-gray-700 text-white resize-none" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  if (!config.active) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Link Not Available</h2>
          <p className="text-gray-400">This payment link is currently inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="sticky top-0 z-10" style={{ backgroundColor: config.brandColor }}>
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80 text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />}
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">{page.title}</h1>
              <p className="text-white/70 text-xs">Secure Payment Link</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden"
          style={{ borderTop: `4px solid ${config.brandColor}` }}
        >
          {page.coverImage && <img src={page.coverImage} alt={page.title} className="w-full h-40 object-cover" />}

          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{page.title}</h2>
              {page.description && <p className="text-gray-400 text-sm mt-2">{page.description}</p>}
            </div>

            <div className="bg-[#0e0e0e] rounded-xl p-4 text-center">
              {config.amountMode === "fixed" ? (
                <>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-3xl font-bold" style={{ color: config.brandColor }}>
                    {currencySymbol}{page.price.toLocaleString()}
                  </p>
                </>
              ) : (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Enter Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.customAmount || ""}
                      onChange={(e) => setFormData({ ...formData, customAmount: parseFloat(e.target.value) })}
                      className="pl-8 h-14 text-lg bg-[#1a1a1a] border-gray-700 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Full Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Email Address *</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              {config.collectPhone && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Phone Number {config.phoneRequired && "*"}</Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="08012345678"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              )}
              {config.customFields.map(renderCustomField)}
            </div>

            {config.referenceCode && (
              <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Reference Code</p>
                <p className="text-sm font-mono" style={{ color: config.brandColor }}>{config.referenceCode}</p>
              </div>
            )}

            {/* Payment Method - Card Only */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>
              
              <div className="mb-6">
                <div className="p-4 rounded-xl border-2 border-[#e1bf46] bg-[#e1bf46]/10">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-[#e1bf46]" />
                  <p className="font-medium text-[#e1bf46] text-center">Card Payment</p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Pay with Credit/Debit Card
                  </p>
                </div>
              </div>

              <div className="bg-[#0e0e0e] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">
                    {currencySymbol}{(config.amountMode === "fixed" ? page.price : formData.customAmount || 0).toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setCardPaymentAmount(config.amountMode === "fixed" ? page.price : formData.customAmount || 0);
                    setShowCardModal(true);
                  }}
                  disabled={!isValidAmount}
                  className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold"
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Pay with Card
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
            </div>
          </div>
        </motion.div>
      </div>

      {/* Card Payment Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Complete Payment</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[#0e0e0e] rounded-xl p-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-xl font-bold text-[#e1bf46]">
                  {currencySymbol}{cardPaymentAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-blue-900/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-blue-400">You'll be redirected to our secure payment gateway to complete your transaction.</p>
            </div>
            <Button
              onClick={handleCardPayment}
              disabled={processingCardPayment}
              className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-3"
            >
              {processingCardPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {processingCardPayment ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAYMENT PAGE CLIENT COMPONENT
// ============================================================
export default function PaymentPageClient({ slug }: PaymentPageClientProps) {
  const router = useRouter();
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption>("full");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const students = useMemo(() => {
    const rawStudents = page?.metadata?.students || [];
    const totalAmount = page?.price || 0;
    return rawStudents.map((student: Student) => {
      const paidAmount = student.paidAmount || 0;
      const remainingBalance = totalAmount - paidAmount;
      const isFullyPaid = paidAmount >= totalAmount;
      return {
        ...student,
        paidAmount,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paid: isFullyPaid,
        isPartiallyPaid: paidAmount > 0 && !isFullyPaid,
        totalAmount,
      };
    });
  }, [page?.metadata?.students, page?.price]);

  const feeBreakdown = useMemo(() => page?.metadata?.feeBreakdown || [], [page?.metadata?.feeBreakdown]);
  const className = useMemo(() => page?.metadata?.className || "", [page?.metadata?.className]);
  const variants = useMemo(() => page?.metadata?.variants || [], [page?.metadata?.variants]);

  const getBasePrice = () => selectedVariant?.price || page?.price || 0;
  const getTotalProductPrice = () => getBasePrice() * quantity;

  const getTotalAmount = () => {
    if (feeBreakdown.length > 0) return feeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    return page?.price || 0;
  };

  const getAmountToPay = () => {
    const totalAmount = getTotalAmount();
    if (selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1) {
      return totalAmount / page.installmentCount;
    }
    return totalAmount;
  };

  const getInstallmentInfo = () => {
    if (page?.installmentCount && page.installmentCount > 1) {
      const totalAmount = getTotalAmount();
      return { totalAmount, installmentCount: page.installmentCount, installmentAmount: totalAmount / page.installmentCount };
    }
    return null;
  };

  const getStudentPayAmount = (student: Student) => {
    const amountPerStudent = getAmountToPay();
    return Math.min(amountPerStudent, student.remainingBalance || 0);
  };

  const getTotalForSelectedStudents = () => {
    let total = 0;
    selectedStudents.forEach((studentName) => {
      const student = students.find((s: Student) => s.name === studentName);
      if (student) total += getStudentPayAmount(student);
    });
    return total;
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ============================================================
  // CARD PAYMENT WITH REDIRECTION - MAIN PAYMENT PAGE
  // ============================================================
  const handleCardPayment = async () => {
    const totalAmount = getCurrentTotalAmount();

    if (totalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!customerName || !customerName.trim()) newErrors.name = "Name is required";
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) newErrors.email = "Valid email is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isInstallmentPayment = selectedPaymentOption === "installment" && page?.installmentCount && page.installmentCount > 1;
    const metadata: any = {
      pageType: page?.pageType,
      pageTitle: page?.title,
      paymentType: isInstallmentPayment ? "installment" : "full",
      isInstallment: isInstallmentPayment,
      selectedStudents: Array.from(selectedStudents),
      numberOfStudents: selectedStudents.size,
      totalAmount,
    };

    if (isInstallmentPayment) {
      const installmentInfo = getInstallmentInfo();
      metadata.totalAmount = installmentInfo?.totalAmount;
      metadata.totalInstallments = installmentInfo?.installmentCount;
      metadata.installmentAmount = installmentInfo?.installmentAmount;
      metadata.currentInstallment = 1;
    }

    setProcessingCardPayment(true);
    setShowCardModal(false);

    try {
      const response = await fetch("/api/payment-page/public/card-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName,
          customerEmail,
          customerPhone,
          amount: totalAmount,
          metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const checkoutWindow = window.open(data.checkoutLink, "_blank", "width=500,height=700");

      // If popup was blocked, redirect instead
      if (!checkoutWindow) {
        window.location.href = data.checkoutLink;
        return;
      }

      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/payment-page/status?reference=${data.orderReference}`
          );
          const statusData = await statusResponse.json();

          if (statusData.payment?.status === "completed") {
            clearInterval(checkInterval);

            if (checkoutWindow && !checkoutWindow.closed) {
              checkoutWindow.close();
            }

            // Get redirect URL - priority: statusData.redirectUrl > metadata.accessLink > metadata.downloadUrl > default
            const redirectUrl = statusData.payment?.redirectUrl ||
              page?.metadata?.accessLink ||
              page?.metadata?.downloadUrl ||
              `/payment-page-success?reference=${data.orderReference}&status=success`;

            await Swal.fire({
              icon: "success",
              title: "Payment Successful! 🎉",
              html: `
                <div class="text-left">
                  <p class="font-semibold text-green-600">✅ Payment successful! Thank you.</p>
                  <p class="text-sm text-gray-600 mt-2">A receipt has been sent to your email.</p>
                  <p class="text-sm text-gray-600 mt-2">💰 Amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
                </div>
              `,
              confirmButtonColor: "#F5B81B",
              confirmButtonText: "Continue",
            });

            window.location.href = redirectUrl;
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 3000);

      setTimeout(() => clearInterval(checkInterval), 300000);
    } catch (err: any) {
      alert(err.message || "Failed to initiate card payment. Please try again.");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const openCardModal = () => {
    const totalAmount = getCurrentTotalAmount();
    if (totalAmount <= 0) {
      alert("Please select items to continue");
      return;
    }
    if (!customerName || !customerName.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }
    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) {
      setErrors({ email: "Valid email is required" });
      return;
    }
    setCardPaymentAmount(totalAmount);
    setShowCardModal(true);
  };

  const getCurrentTotalAmount = () => {
    if (page?.pageType === "school") return getTotalForSelectedStudents();
    if (page?.pageType === "physical" || page?.pageType === "digital") return getTotalProductPrice();
    return page?.price || 0;
  };

  const handleStudentClick = (student: Student) => {
    if (student.paid || student.remainingBalance <= 0) return;
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student.name)) newSet.delete(student.name);
      else newSet.add(student.name);
      return newSet;
    });
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/payment-page/public/${slug}`);
        if (!response.ok) {
          setError(response.status === 404 ? "Page not found" : "Failed to load page");
          return;
        }
        const data = await response.json();
        setPage(data.page);
        if (data.page?.metadata?.variants?.length > 0) {
          setSelectedVariant(data.page.metadata.variants[0]);
        }
      } catch (err) {
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  // If payment link page type, render PaymentLinkComponent
  if (page?.pageType === "link" && page.linkConfig) {
    return <PaymentLinkComponent page={page} config={page.linkConfig} />;
  }

  const totalAmount = getTotalAmount();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page?.coverImage ? [page.coverImage] : []), ...(page?.productImages || [])];
  const currentTotalAmount = getCurrentTotalAmount();
  const hasValidAmount = currentTotalAmount > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e1bf46]"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-gray-400 mb-4">This payment page doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")} className="bg-[#e1bf46] text-[#023528]">Go Home</Button>
        </div>
      </div>
    );
  }

  const productImages = page.productImages || [];

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Header */}
      <div className="bg-[#023528] text-white sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {page.logo && <img src={page.logo} className="h-10 w-10 rounded-xl object-cover" alt="Logo" />}
            <div>
              <h1 className="font-bold text-lg leading-tight">{page.title}</h1>
              <p className="text-white/60 text-xs">by zidwell.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTENT - IMAGE LEFT, INFO RIGHT ON DESKTOP */}
      {/* ============================================================ */}
      <div className="max-w-6xl mx-auto py-6 px-4 pb-32">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ============================================================ */}
          {/* LEFT COLUMN - PRODUCT IMAGES (Instagram Style 1350x1080) */}
          {/* ============================================================ */}
          <div className="lg:w-1/2">
            {productImages.length > 0 ? (
              <div className="sticky top-24">
                {/* Main Image - Large display */}
                <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-[#1a1a1a] border border-gray-700">
                  <img
                    src={productImages[currentImage]}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((c) => (c === 0 ? productImages.length - 1 : c - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5 text-white" />
                      </button>
                      <button
                        onClick={() => setCurrentImage((c) => (c === productImages.length - 1 ? 0 : c + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {productImages.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                              i === currentImage ? "w-5 bg-[#e1bf46]" : "w-1.5 bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          idx === currentImage ? "border-[#e1bf46]" : "border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Image count badge */}
                <div className="mt-2 text-xs text-gray-500">
                  {productImages.length} image{productImages.length > 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="sticky top-24 aspect-[5/4] rounded-xl bg-[#1a1a1a] border border-gray-700 flex flex-col items-center justify-center">
                <Package className="h-20 w-20 text-gray-600 mb-4" />
                <p className="text-gray-400 text-sm">No product images</p>
                <p className="text-gray-500 text-xs mt-1">Merchant hasn't added images yet</p>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN - PRODUCT INFO & PAYMENT */}
          {/* ============================================================ */}
          <div className="lg:w-1/2 space-y-6">
            {/* Page Type Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-[#e1bf46]/10 text-[#e1bf46] px-2 py-0.5 rounded-full">
                {page.pageType ? typeLabels?.[page.pageType as keyof typeof typeLabels] || page.pageType : "Product"}
              </span>
              {className && (
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                  {className}
                </span>
              )}
              {page.pageType === "school" && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                  School Fees
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-white">{page.title}</h1>
              {page.description && (
                <p className="text-gray-400 text-sm mt-2">{page.description}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-[#e1bf46]">
                ₦{page.price.toLocaleString()}
              </p>
              {page.priceType === "installment" && page.installmentCount && (
                <p className="text-sm text-gray-400">
                  or {page.installmentCount} monthly payments of ₦{(page.price / page.installmentCount).toLocaleString()}
                </p>
              )}
            </div>

            {/* Fee Info - 4% */}
            <div className="bg-[#1a1a1a] rounded-xl p-3 border border-gray-800">
              <p className="text-sm text-gray-400">
                Transaction fee: <span className="text-[#e1bf46] font-medium">4%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You pay exactly ₦{page.price.toLocaleString()}. The 4% fee is covered by the merchant.
              </p>
            </div>

            {/* ============================================================ */}
            {/* TYPE-SPECIFIC SECTIONS */}
            {/* ============================================================ */}

            {/* Physical Product Section */}
            {page.pageType === "physical" && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-[#e1bf46]" />
                  <h3 className="font-bold text-lg text-white">Product Details</h3>
                </div>
                {variants.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block text-white">Select Variant</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {variants.map((variant: Variant, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            selectedVariant?.name === variant.name
                              ? "border-[#e1bf46] bg-[#e1bf46]/10 text-[#e1bf46]"
                              : "border-gray-700 hover:border-[#e1bf46]/50 text-gray-300"
                          }`}
                        >
                          <p className="font-semibold">{variant.name}</p>
                          <p className="text-sm mt-1">₦{(variant.price || page.price).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold mb-2 block text-white">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center bg-[#1a1a1a] border-gray-700 text-white"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 rounded-xl bg-gray-800 text-white hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
                {page.metadata?.requiresShipping && (
                  <div className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-xl border border-blue-800">
                    <Truck className="h-4 w-4 text-blue-400" />
                    <p className="text-xs text-blue-300">Shipping address will be required</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Unit Price:</span>
                    <span className="text-white">₦{getBasePrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="text-white">x{quantity}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-800">
                    <span className="font-semibold text-white">Total:</span>
                    <span className="text-2xl font-bold text-[#e1bf46]">₦{getTotalProductPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Digital Product Section */}
            {page.pageType === "digital" && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="h-5 w-5 text-[#e1bf46]" />
                  <h3 className="font-bold text-lg text-white">Digital Product</h3>
                </div>
                <div className="p-4 bg-[#e1bf46]/10 rounded-xl border border-[#e1bf46]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Price:</span>
                    <span className="text-2xl font-bold text-[#e1bf46]">₦{page.price.toLocaleString()}</span>
                  </div>
                </div>
                {page.metadata?.emailDelivery !== false && (
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-xl border border-green-800 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-xs text-green-300">Download link will be sent to your email</p>
                  </div>
                )}
              </div>
            )}

            {/* Fee Breakdown - School Only */}
            {page.pageType === "school" && feeBreakdown.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
                <h3 className="font-bold text-lg mb-4 text-white">Fee Breakdown</h3>
                {feeBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold text-white">₦{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-bold">
                  <span className="text-white">Total per Student</span>
                  <span className="text-[#e1bf46]">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment Options - Available for all page types except "link" */}
            {page.pageType !== "link" && canDoInstallments && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
                <h3 className="font-bold text-lg mb-4 text-white">Payment Options</h3>
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedPaymentOption("full")}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPaymentOption === "full"
                        ? "border-[#e1bf46] bg-[#e1bf46]/10"
                        : "border-gray-700 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">Pay in Full</p>
                      <p className="text-sm text-gray-400">Pay once</p>
                    </div>
                    <p className="font-bold text-[#e1bf46]">₦{totalAmount.toLocaleString()}</p>
                  </div>
                  <div
                    onClick={() => setSelectedPaymentOption("installment")}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPaymentOption === "installment"
                        ? "border-[#e1bf46] bg-[#e1bf46]/10"
                        : "border-gray-700 hover:border-[#e1bf46]/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">Pay in Installments</p>
                      <p className="text-sm text-gray-400">{page.installmentCount} payments</p>
                    </div>
                    <p className="font-bold text-[#e1bf46]">
                      ₦{installmentInfo?.installmentAmount.toLocaleString()} / month
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Student Selection - School Only */}
            {page.pageType === "school" && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 space-y-4">
                <h3 className="font-bold text-lg text-white">Select Students</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {students.map((student: Student) => {
                    const isSelected = selectedStudents.has(student.name);
                    const payAmount = getStudentPayAmount(student);
                    const remainingBalance = student.remainingBalance;

                    if (student.paid) {
                      return (
                        <div key={student.name} className="p-4 rounded-xl bg-green-900/20 border border-green-800 opacity-70">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{student.name}</p>
                              <p className="text-xs text-green-400 mt-1">✓ Fully Paid</p>
                            </div>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">PAID</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={student.name}
                        onClick={() => handleStudentClick(student)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#e1bf46] bg-[#e1bf46]/10"
                            : "border-gray-700 hover:border-[#e1bf46]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{student.name}</p>
                            {student.className && (
                              <p className="text-xs text-gray-400">Class: {student.className}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#e1bf46]">₦{payAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        {remainingBalance > 0 && remainingBalance < (page.price || 0) && (
                          <p className="text-xs text-yellow-500 mt-2">Remaining: ₦{remainingBalance.toLocaleString()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedStudents.size > 0 && (
                  <div className="p-4 bg-[#e1bf46]/10 rounded-xl border border-[#e1bf46]/20">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-300">Selected:</span>
                      <span className="font-bold text-white">{selectedStudents.size} student(s)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#e1bf46]/20">
                      <span className="font-semibold text-white">Total to Pay:</span>
                      <span className="text-xl font-bold text-[#e1bf46]">₦{totalForSelected.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* CUSTOMER INFO FIELDS */}
            {/* ============================================================ */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-lg mb-4 text-white">Your Information</h3>
              <p className="text-xs text-gray-400 mb-4">Please provide your details so we can send you a receipt.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Full Name *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Email Address *</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">Phone Number (Optional)</Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="08012345678"
                  />
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* PAYMENT METHOD - CARD ONLY */}
            {/* ============================================================ */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>

              <div className="mb-6">
                <div className="p-4 rounded-xl border-2 border-[#e1bf46] bg-[#e1bf46]/10">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-[#e1bf46]" />
                  <p className="font-medium text-[#e1bf46] text-center">Card Payment</p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Pay with Credit/Debit Card
                  </p>
                </div>
              </div>

              <div className="bg-[#0e0e0e] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">₦{currentTotalAmount.toLocaleString()}</span>
                </div>
                {hasValidAmount ? (
                  <Button
                    onClick={openCardModal}
                    className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-6 text-lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" /> Pay ₦{currentTotalAmount.toLocaleString()} with Card
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                    <p className="text-gray-400 text-sm">Please select items to continue</p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CARD PAYMENT MODAL */}
      {/* ============================================================ */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Complete Payment</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-[#0e0e0e] rounded-xl p-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-xl font-bold text-[#e1bf46]">₦{cardPaymentAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-900/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-blue-400">You'll be redirected to our secure payment gateway to complete your transaction.</p>
            </div>
            <Button
              onClick={handleCardPayment}
              disabled={processingCardPayment}
              className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-3"
            >
              {processingCardPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {processingCardPayment ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* IMAGE LIGHTBOX MODAL */}
      {/* ============================================================ */}
      {isLightboxOpen && selectedProductImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <img src={selectedProductImage} alt="Product view" className="w-full h-auto rounded-xl max-h-[90vh] object-contain" />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #2a2a2a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e1bf46; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ============================================================
// TYPE LABELS HELPER (for display)
// ============================================================
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