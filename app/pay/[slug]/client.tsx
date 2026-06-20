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
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    bankAccountName?: string;
  };
  linkConfig?: LinkConfig;
}

interface PaymentPageClientProps {
  slug: string;
}

type PaymentOption = "full" | "installment";
type PaymentMethodType = "virtual_account" | "card";

const generateNarrationCode = (): string => {
  const prefix = "PL";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${code}`;
};

// ============================================================
// PAYMENT LINK COMPONENT (For Payment Link page type)
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
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountDetails, setAccountDetails] = useState("");
  const [narrationCode, setNarrationCode] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodType>("virtual_account");
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingReference, setPendingReference] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);

  const amount = config.amountMode === "fixed" ? page.price : formData.customAmount;
  const isValidAmount = config.amountMode === "variable" ? amount && amount > 0 : page.price > 0;
  const currencySymbol = config.currency === "NGN" ? "₦" : config.currency === "USD" ? "$" : config.currency === "GBP" ? "£" : "€";

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const confirmPayment = async (reference: string) => {
    setConfirmingPayment(true);
    try {
      const result = await Swal.fire({
        title: "Confirm Transfer",
        html: `
          <div class="text-left">
            <p class="mb-2">Have you completed the bank transfer?</p>
            <p class="text-sm text-gray-600">Please confirm that you have transferred the money.</p>
            <p class="text-sm text-gray-600 mt-2">Reference: <strong>${reference}</strong></p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "✅ Yes, I've Transferred",
        cancelButtonText: "⏳ Not Yet",
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Verifying Payment...",
          text: "Please wait while we confirm your transfer.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const response = await fetch("/api/payment-page/public/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transferReference: reference }),
        });

        const data = await response.json();
        Swal.close();

        if (!response.ok) {
          if (response.status === 404) {
            await Swal.fire({
              icon: "warning",
              title: "Payment Not Found",
              html: `
                <div class="text-left">
                  <p>We couldn't find a pending payment with this reference.</p>
                  <p class="text-sm text-gray-600 mt-2">Possible reasons:</p>
                  <ul class="text-sm text-gray-600 mt-1 text-left list-disc pl-4">
                    <li>You haven't initiated a transfer yet</li>
                    <li>The payment has already been confirmed</li>
                    <li>The reference is incorrect</li>
                  </ul>
                </div>
              `,
              confirmButtonColor: "#F5B81B",
            });
            return;
          }
          throw new Error(data.error || "Failed to confirm payment");
        }

        if (data.success) {
          await Swal.fire({
            icon: "success",
            title: "🎉 Payment Confirmed!",
            html: `
              <div class="text-left">
                <p class="font-semibold text-green-600">✅ ${data.successMessage || "Payment successful! Thank you."}</p>
                <p class="text-sm text-gray-600 mt-2">${data.thankYouMessage || "We've received your payment and a receipt has been sent to your email."}</p>
                ${data.payment?.customer_email ? `<p class="text-sm text-gray-600 mt-2">📧 Receipt sent to: <strong>${data.payment.customer_email}</strong></p>` : ''}
              </div>
            `,
            confirmButtonColor: "#F5B81B",
            confirmButtonText: "Continue",
          });

          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            window.location.reload();
          }
        }
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      await Swal.fire({
        icon: "error",
        title: "Confirmation Failed",
        text: error.message || "Could not confirm payment. Please try again.",
        confirmButtonColor: "#F5B81B",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleVirtualAccountPayment = async () => {
    const virtualAccount = page.virtualAccount;
    if (!virtualAccount) {
      alert("Virtual account not available. Please try card payment.");
      return;
    }

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

    const transferReference = `PL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setPendingReference(transferReference);
    const narration = generateNarrationCode();
    setNarrationCode(narration);

    try {
      const response = await fetch("/api/payment-page/public/transfer-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          customerName: customerName || "Customer",
          customerEmail: customerEmail || "customer@example.com",
          customerPhone: customerPhone || "",
          amount: totalAmount,
          transferReference,
          metadata: {
            pageType: "link",
            pageTitle: page.title,
            paymentType: "link",
            customFields: formData,
            referenceCode: config.referenceCode,
            narration,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setShowBankDetails(true);
      setAccountDetails(`Bank: ${virtualAccount.bankName}
Account Number: ${virtualAccount.accountNumber}
Account Name: ${virtualAccount.bankAccountName || virtualAccount.accountName}
Amount: ${currencySymbol}${totalAmount.toLocaleString()}
Reference: ${transferReference}
Narration: ${narration}`);
      setShowAccountModal(true);
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment. Please try again.");
    }
  };

  // ============================================================
  // FULL CARD PAYMENT WITH REDIRECTION - PAYMENT LINK
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

            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod("virtual_account")}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "virtual_account" ? "border-[#e1bf46] bg-[#e1bf46]/10" : "border-gray-700 hover:border-[#e1bf46]/50"}`}
                >
                  <Banknote className={`h-6 w-6 mx-auto mb-2 ${selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-gray-400"}`} />
                  <p className={`font-medium ${selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-white"}`}>Bank Transfer</p>
                  <p className="text-xs text-gray-500 mt-1">Pay via Virtual Account</p>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod("card")}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "card" ? "border-[#e1bf46] bg-[#e1bf46]/10" : "border-gray-700 hover:border-[#e1bf46]/50"}`}
                >
                  <CreditCard className={`h-6 w-6 mx-auto mb-2 ${selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-gray-400"}`} />
                  <p className={`font-medium ${selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-white"}`}>Card Payment</p>
                  <p className="text-xs text-gray-500 mt-1">Pay with Credit/Debit Card</p>
                </button>
              </div>

              {selectedPaymentMethod === "virtual_account" && page.virtualAccount && (
                <>
                  {showBankDetails ? (
                    <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800 mb-4">
                      <p className="text-sm font-medium text-blue-400 mb-2">Transfer to this account:</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Bank:</span><span className="font-medium text-white">{page.virtualAccount.bankName}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Account Number:</span><span className="font-mono font-bold text-white">{page.virtualAccount.accountNumber}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Account Name:</span><span className="font-medium text-white truncate max-w-[200px]">{page.virtualAccount.bankAccountName || page.virtualAccount.accountName}</span></div>
                        <div className="mt-3 p-3 bg-yellow-900/40 rounded-xl border border-yellow-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">📝 Narration</span><span className="text-[10px] text-yellow-500/70">(Required)</span></div>
                            <button onClick={() => copyToClipboard(narrationCode, "narrationMain")} className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                              {copiedField === "narrationMain" ? <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-500">Copied!</span></> : <><Copy className="h-3 w-3" /><span>Copy</span></>}
                            </button>
                          </div>
                          <p className="text-lg font-mono font-bold text-yellow-300 tracking-wider">{narrationCode || "PL_XXXX"}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-4 text-center mb-4">
                      <Banknote className="h-10 w-10 mx-auto text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">Fill in your details above and click "Get Account Details"</p>
                    </div>
                  )}

                  <div className="bg-[#0e0e0e] rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-2xl font-bold text-[#e1bf46]">{currencySymbol}{(config.amountMode === "fixed" ? page.price : formData.customAmount || 0).toLocaleString()}</span>
                    </div>
                    <Button onClick={handleVirtualAccountPayment} disabled={!isValidAmount} className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold">
                      <Banknote className="h-4 w-4 mr-2" /> Get Account Details
                    </Button>
                  </div>
                </>
              )}

              {selectedPaymentMethod === "card" && (
                <>
                  <div className="bg-[#0e0e0e] rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-2xl font-bold text-[#e1bf46]">{currencySymbol}{(config.amountMode === "fixed" ? page.price : formData.customAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setCardPaymentAmount(config.amountMode === "fixed" ? page.price : formData.customAmount || 0); setShowCardModal(true); }}
                    disabled={!isValidAmount}
                    className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-6 text-lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" /> Pay with Card
                  </Button>
                </>
              )}
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
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-[#0e0e0e] rounded-xl p-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-xl font-bold text-[#e1bf46]">{currencySymbol}{cardPaymentAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-900/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-blue-400">You'll be redirected to our secure payment gateway to complete your transaction.</p>
            </div>
            <Button onClick={handleCardPayment} disabled={processingCardPayment} className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-3">
              {processingCardPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {processingCardPayment ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      )}

      {/* Virtual Account Details Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Bank Transfer Details</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="bg-[#0e0e0e] rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Bank</span>
                <span className="font-semibold text-white">{page.virtualAccount?.bankName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#e1bf46]">{page.virtualAccount?.accountNumber}</span>
                  <button onClick={() => copyToClipboard(page.virtualAccount?.accountNumber || "", "account")} className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20">
                    {copiedField === "account" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{page.virtualAccount?.bankAccountName || page.virtualAccount?.accountName}</span>
                  <button onClick={() => copyToClipboard(page.virtualAccount?.bankAccountName || page.virtualAccount?.accountName || "", "accountName")} className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20">
                    {copiedField === "accountName" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Amount</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#e1bf46]">{currencySymbol}{amount.toLocaleString()}</span>
                  <button onClick={() => copyToClipboard(`${currencySymbol}${amount.toLocaleString()}`, "amount")} className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20">
                    {copiedField === "amount" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Reference</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#e1bf46]">{pendingReference}</span>
                  <button onClick={() => copyToClipboard(pendingReference || "", "reference")} className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20">
                    {copiedField === "reference" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-800 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">📝 Narration Code</span>
                    <span className="text-[10px] text-yellow-500/70">(Required)</span>
                  </div>
                  <button onClick={() => copyToClipboard(narrationCode, "narration")} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30">
                    {copiedField === "narration" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-yellow-400" />}
                  </button>
                </div>
                <p className="text-2xl font-mono font-bold text-yellow-300 tracking-wider text-center py-2">{narrationCode || "PL_XXXX"}</p>
                <div className="mt-2 p-2 bg-yellow-800/30 rounded-lg">
                  <p className="text-[10px] text-yellow-400/80 text-center">⚠️ Use this exact code as narration when making the transfer</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => copyToClipboard(accountDetails, "all")} className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold">
                {copiedField === "all" ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedField === "all" ? "Copied!" : "Copy All Details"}
              </Button>
              {pendingReference && (
                <Button onClick={() => confirmPayment(pendingReference)} disabled={confirmingPayment} className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold">
                  {confirmingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {confirmingPayment ? "Confirming..." : "✅ I've Made the Transfer"}
                </Button>
              )}
              <p className="text-xs text-gray-500 text-center">After making the transfer, click the button above to confirm your payment.</p>
            </div>
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

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("virtual_account");
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountDetails, setAccountDetails] = useState("");
  const [narrationCode, setNarrationCode] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingReference, setPendingReference] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);

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

  const confirmPayment = async (reference: string) => {
    setConfirmingPayment(true);
    try {
      const result = await Swal.fire({
        title: "Confirm Transfer",
        html: `
          <div class="text-left">
            <p class="mb-2">Have you completed the bank transfer?</p>
            <p class="text-sm text-gray-600">Please confirm that you have transferred the money.</p>
            <p class="text-sm text-gray-600 mt-2">Reference: <strong>${reference}</strong></p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "✅ Yes, I've Transferred",
        cancelButtonText: "⏳ Not Yet",
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Verifying Payment...",
          text: "Please wait while we confirm your transfer.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const response = await fetch("/api/payment-page/public/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transferReference: reference }),
        });

        const data = await response.json();
        Swal.close();

        if (!response.ok) {
          if (response.status === 404) {
            await Swal.fire({
              icon: "warning",
              title: "Payment Not Found",
              html: `
                <div class="text-left">
                  <p>We couldn't find a pending payment with this reference.</p>
                  <p class="text-sm text-gray-600 mt-2">Possible reasons:</p>
                  <ul class="text-sm text-gray-600 mt-1 text-left list-disc pl-4">
                    <li>You haven't initiated a transfer yet</li>
                    <li>The payment has already been confirmed</li>
                    <li>The reference is incorrect</li>
                  </ul>
                </div>
              `,
              confirmButtonColor: "#F5B81B",
            });
            return;
          }
          throw new Error(data.error || "Failed to confirm payment");
        }

        if (data.success) {
          await Swal.fire({
            icon: "success",
            title: "🎉 Payment Confirmed!",
            html: `
              <div class="text-left">
                <p class="font-semibold text-green-600">✅ ${data.successMessage || "Payment successful! Thank you."}</p>
                <p class="text-sm text-gray-600 mt-2">${data.thankYouMessage || "We've received your payment and a receipt has been sent to your email."}</p>
                ${data.payment?.customer_email ? `<p class="text-sm text-gray-600 mt-2">📧 Receipt sent to: <strong>${data.payment.customer_email}</strong></p>` : ''}
              </div>
            `,
            confirmButtonColor: "#F5B81B",
            confirmButtonText: "Continue",
          });

          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            window.location.reload();
          }
        }
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      await Swal.fire({
        icon: "error",
        title: "Confirmation Failed",
        text: error.message || "Could not confirm payment. Please try again.",
        confirmButtonColor: "#F5B81B",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleVirtualAccountPayment = () => {
    const virtualAccount = page?.virtualAccount;
    if (!virtualAccount) {
      alert("Virtual account not available. Please try card payment.");
      return;
    }

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

    const transferReference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setPendingReference(transferReference);
    const narration = generateNarrationCode();
    setNarrationCode(narration);

    setAccountDetails(`Bank: ${virtualAccount.bankName}
Account Number: ${virtualAccount.accountNumber}
Account Name: ${virtualAccount.bankAccountName || virtualAccount.accountName}
Amount: ₦${totalAmount.toLocaleString()}
Reference: ${transferReference}
Narration: ${narration}`);
    setShowAccountModal(true);
    createPendingPayment(transferReference, totalAmount, narration);
  };

  const createPendingPayment = async (reference: string, amount: number, narration: string) => {
    try {
      const response = await fetch("/api/payment-page/public/transfer-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: slug,
          customerName: customerName || "Customer",
          customerEmail: customerEmail || "customer@example.com",
          customerPhone: customerPhone || "",
          amount,
          transferReference: reference,
          metadata: {
            pageType: page?.pageType,
            pageTitle: page?.title,
            selectedStudents: Array.from(selectedStudents),
            numberOfStudents: selectedStudents.size,
            narration,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) console.error("Failed to create pending payment:", data);
    } catch (error) {
      console.error("Error creating pending payment:", error);
    }
  };

  // ============================================================
  // FULL CARD PAYMENT WITH REDIRECTION - MAIN PAYMENT PAGE
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

  if (page?.pageType === "link" && page.linkConfig) {
    return <PaymentLinkComponent page={page} config={page.linkConfig} />;
  }

  const totalAmount = getTotalAmount();
  const installmentInfo = getInstallmentInfo();
  const canDoInstallments = page?.priceType === "installment" && page.installmentCount && page.installmentCount > 1;
  const totalForSelected = getTotalForSelectedStudents();
  const allImages = [...(page?.coverImage ? [page.coverImage] : [])];
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

      {/* Images Carousel */}
      {allImages.length > 0 && (
        <div className="relative bg-black/5">
          <img src={allImages[currentImage]} alt={page.title} className="w-full h-64 md:h-80 object-cover" />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((c) => (c === 0 ? allImages.length - 1 : c - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => setCurrentImage((c) => (c === allImages.length - 1 ? 0 : c + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Product Images Gallery */}
      {page.productImages && page.productImages.length > 0 && (
        <div className="bg-[#0e0e0e] py-6 px-4 border-b border-gray-800">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Product Gallery</h3>
              <span className="text-xs text-gray-500">{page.productImages.length} images</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {page.productImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border border-gray-800 cursor-pointer hover:border-[#e1bf46] transition-all group"
                  onClick={() => { setSelectedProductImage(img); setIsLightboxOpen(true); }}
                >
                  <img
                    src={img}
                    alt={`${page.title} - ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto py-6 space-y-6 px-4 pb-32">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white">{page.title}</h2>
          {className && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#e1bf46]/10 text-[#e1bf46] text-sm font-medium mt-2">
              {className}
            </span>
          )}
          {page.description && <p className="text-gray-400 text-sm mt-2">{page.description}</p>}
        </div>

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

        {/* ============================================================ */}
        {/* PAYMENT OPTIONS - Available for all page types except "link" */}
        {/* ============================================================ */}
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
        {/* CUSTOMER INFO FIELDS - ALWAYS SHOWN FOR ALL PAYMENT TYPES */}
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
        {/* PAYMENT METHOD SELECTOR */}
        {/* ============================================================ */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
          <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedPaymentMethod("virtual_account")}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === "virtual_account"
                  ? "border-[#e1bf46] bg-[#e1bf46]/10"
                  : "border-gray-700 hover:border-[#e1bf46]/50"
              }`}
            >
              <Banknote
                className={`h-6 w-6 mx-auto mb-2 ${selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-gray-400"}`}
              />
              <p className={`font-medium ${selectedPaymentMethod === "virtual_account" ? "text-[#e1bf46]" : "text-white"}`}>
                Bank Transfer
              </p>
              <p className="text-xs text-gray-500 mt-1">Pay via Virtual Account</p>
            </button>
            <button
              onClick={() => setSelectedPaymentMethod("card")}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === "card"
                  ? "border-[#e1bf46] bg-[#e1bf46]/10"
                  : "border-gray-700 hover:border-[#e1bf46]/50"
              }`}
            >
              <CreditCard
                className={`h-6 w-6 mx-auto mb-2 ${selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-gray-400"}`}
              />
              <p className={`font-medium ${selectedPaymentMethod === "card" ? "text-[#e1bf46]" : "text-white"}`}>
                Card Payment
              </p>
              <p className="text-xs text-gray-500 mt-1">Pay with Credit/Debit Card</p>
            </button>
          </div>

          {/* Virtual Account Section */}
          {selectedPaymentMethod === "virtual_account" && page.virtualAccount && (
            <>
              {showBankDetails ? (
                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800 mb-4">
                  <p className="text-sm font-medium text-blue-400 mb-2">Transfer to this account:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Bank:</span>
                      <span className="font-medium text-white">{page.virtualAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Account Number:</span>
                      <span className="font-mono font-bold text-white">{page.virtualAccount.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Account Name:</span>
                      <span className="font-medium text-white truncate max-w-[200px]">
                        {page.virtualAccount.bankAccountName || page.virtualAccount.accountName}
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-yellow-900/40 rounded-xl border border-yellow-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">📝 Narration</span>
                          <span className="text-[10px] text-yellow-500/70">(Required)</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(narrationCode, "narrationMain")}
                          className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                        >
                          {copiedField === "narrationMain" ? (
                            <><CheckCircle className="h-3 w-3 text-green-500" /><span className="text-green-500">Copied!</span></>
                          ) : (
                            <><Copy className="h-3 w-3" /><span>Copy</span></>
                          )}
                        </button>
                      </div>
                      <p className="text-lg font-mono font-bold text-yellow-300 tracking-wider">{narrationCode || "PL_XXXX"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/30 rounded-xl p-4 text-center mb-4">
                  <Banknote className="h-10 w-10 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">Fill in your details above and click "Copy Account Details"</p>
                </div>
              )}
              <div className="bg-[#0e0e0e] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">₦{currentTotalAmount.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => {
                    const newErrors: Record<string, string> = {};
                    if (!customerName || !customerName.trim()) newErrors.name = "Name is required";
                    if (!customerEmail || !customerEmail.trim() || !customerEmail.includes("@")) newErrors.email = "Valid email is required";
                    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
                    setShowBankDetails(true);
                    handleVirtualAccountPayment();
                  }}
                  className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold"
                >
                  <Banknote className="h-4 w-4 mr-2" /> Copy Account Details
                </Button>
              </div>
            </>
          )}

          {/* Card Payment Section */}
          {selectedPaymentMethod === "card" && (
            <>
              <div className="bg-[#0e0e0e] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#e1bf46]">₦{currentTotalAmount.toLocaleString()}</span>
                </div>
              </div>
              {hasValidAmount ? (
                <Button
                  onClick={openCardModal}
                  className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-6 text-lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" /> Pay ₦{currentTotalAmount.toLocaleString()} with Card
                </Button>
              ) : (
                <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                  <p className="text-gray-400 text-sm">Please select items to continue</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5" /> Secured by Zidwell
        </div>
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

      {/* Virtual Account Details Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Bank Transfer Details</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#0e0e0e] rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Bank</span>
                <span className="font-semibold text-white">{page?.virtualAccount?.bankName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#e1bf46]">{page?.virtualAccount?.accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(page?.virtualAccount?.accountNumber || "", "account")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "account" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{page?.virtualAccount?.bankAccountName || page?.virtualAccount?.accountName}</span>
                  <button
                    onClick={() => copyToClipboard(page?.virtualAccount?.bankAccountName || page?.virtualAccount?.accountName || "", "accountName")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "accountName" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Amount</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#e1bf46]">₦{currentTotalAmount.toLocaleString()}</span>
                  <button
                    onClick={() => copyToClipboard(`₦${currentTotalAmount.toLocaleString()}`, "amount")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "amount" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Reference</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#e1bf46]">{pendingReference}</span>
                  <button
                    onClick={() => copyToClipboard(pendingReference || "", "reference")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "reference" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>
              <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-800 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">📝 Narration Code</span>
                    <span className="text-[10px] text-yellow-500/70">(Required)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(narrationCode, "narration")}
                    className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30"
                  >
                    {copiedField === "narration" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-yellow-400" />}
                  </button>
                </div>
                <p className="text-2xl font-mono font-bold text-yellow-300 tracking-wider text-center py-2">{narrationCode || "PL_XXXX"}</p>
                <div className="mt-2 p-2 bg-yellow-800/30 rounded-lg">
                  <p className="text-[10px] text-yellow-400/80 text-center">⚠️ Use this exact code as narration when making the transfer</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => copyToClipboard(accountDetails, "all")}
                className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold"
              >
                {copiedField === "all" ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedField === "all" ? "Copied!" : "Copy All Details"}
              </Button>
              {pendingReference && (
                <Button
                  onClick={() => confirmPayment(pendingReference)}
                  disabled={confirmingPayment}
                  className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold"
                >
                  {confirmingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {confirmingPayment ? "Confirming..." : "✅ I've Made the Transfer"}
                </Button>
              )}
              <p className="text-xs text-gray-500 text-center">After making the transfer, click the button above to confirm your payment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {isLightboxOpen && selectedProductImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <img src={selectedProductImage} alt="Product view" className="w-full h-auto rounded-xl" />
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
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