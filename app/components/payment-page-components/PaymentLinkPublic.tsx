// app/components/payment-page-components/PaymentLinkPublic.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion"; 
import { 
  Shield, 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  ArrowLeft,
  Banknote,
  Copy,
  X
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import type { LinkConfig, CustomField } from "@/app/hooks/useStore";

interface PaymentPagePublic {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  logo: string | null;
  price: number;
  pageType: string;
  linkConfig?: LinkConfig;
  virtualAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    bankAccountName?: string;
  };
}

interface PaymentLinkPublicProps {
  page: PaymentPagePublic;
  config: LinkConfig;
}

type PaymentMethodType = "virtual_account" | "card";

export default function PaymentLinkPublic({ page, config }: PaymentLinkPublicProps) {
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("virtual_account");
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardPaymentAmount, setCardPaymentAmount] = useState(0);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [pendingReference, setPendingReference] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);

  const amount = config.amountMode === "fixed" ? page.price : formData.customAmount;
  const isValidAmount = config.amountMode === "variable" ? amount && amount > 0 : page.price > 0;

  const currencySymbol = config.currency === "NGN" ? "₦" : config.currency === "USD" ? "$" : config.currency === "GBP" ? "£" : "€";

 const generateNarrationCode = (): string => {
  const prefix = "PL";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${code}`; // PL_XXXX with underscore
};

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateField = (field: { label: string; required: boolean; type: string }, value: any): string => {
    if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
      return `${field.label} is required`;
    }
    return "";
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
      // Show loading state
      Swal.fire({
        title: "Verifying Payment...",
        text: "Please wait while we confirm your transfer.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch("/api/payment-page/public/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transferReference: reference,
        }),
      });

      const data = await response.json();

      // Close loading
      Swal.close();

      if (!response.ok) {
        // Check if it's a "not found" error
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
                <p class="text-sm text-gray-600 mt-2">Please check and try again.</p>
              </div>
            `,
            confirmButtonColor: "#F5B81B",
          });
          return;
        }
        throw new Error(data.error || "Failed to confirm payment");
      }

      if (data.success) {
        // Check if already confirmed
        if (data.alreadyConfirmed) {
          await Swal.fire({
            icon: "info",
            title: "Already Confirmed",
            text: "This payment has already been confirmed.",
            confirmButtonColor: "#F5B81B",
          });
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          return;
        }

        // Use the success message from the API response
        const successMessage = data.successMessage || "Payment successful! Thank you.";
        const thankYouMessage = data.thankYouMessage || "We've received your payment and a receipt has been sent to your email.";

        // Show success message
        await Swal.fire({
          icon: "success",
          title: "🎉 Payment Confirmed!",
          html: `
            <div class="text-left">
              <p class="font-semibold text-green-600">✅ ${successMessage}</p>
              <p class="text-sm text-gray-600 mt-2">${thankYouMessage}</p>
              ${data.payment?.customer_email ? `<p class="text-sm text-gray-600 mt-2">📧 Receipt sent to: <strong>${data.payment.customer_email}</strong></p>` : ''}
              <p class="text-sm text-gray-600 mt-2">💰 Amount: <strong>₦${data.payment?.amount?.toLocaleString() || '0'}</strong></p>
            </div>
          `,
          confirmButtonColor: "#F5B81B",
          confirmButtonText: "Continue",
        });

        // Redirect to the success page
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
  // Handle Virtual Account Payment
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

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (config.collectName && config.nameRequired && !customerName) {
      newErrors.name = "Name is required";
    }
    if (config.collectEmail && config.emailRequired && !customerEmail) {
      newErrors.email = "Email is required";
    }
    if (config.collectPhone && config.phoneRequired && !customerPhone) {
      newErrors.phone = "Phone number is required";
    }
    config.customFields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) newErrors[field.id] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generate narration code - THIS IS THE TRACKING CODE
    const narration = generateNarrationCode();
    setNarrationCode(narration);

    // Generate a simple reference for the pending payment
   const transferReference = `PL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setPendingReference(transferReference);

    // Create pending payment record
    try {
      const response = await fetch(
        "/api/payment-page/public/transfer-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageSlug: page.slug,
            customerName: customerName || "Customer",
            customerEmail: customerEmail || "customer@example.com",
            customerPhone: customerPhone || "",
            amount: totalAmount,
            transferReference: transferReference,
            metadata: {
              pageType: "link",
              pageTitle: page.title,
              paymentType: "link",
              customFields: formData,
              referenceCode: config.referenceCode,
              narration: narration, // IMPORTANT: Store the narration code
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setShowBankDetails(true);

      // Build account details with narration code
      const details = `Bank: ${virtualAccount.bankName}
Account Number: ${virtualAccount.accountNumber}
Account Name: ${virtualAccount.bankAccountName || virtualAccount.accountName}
Amount: ${currencySymbol}${totalAmount.toLocaleString()}
Reference: ${transferReference}
Narration: ${narration}`;

      setAccountDetails(details);
      setShowAccountModal(true);
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment. Please try again.");
    }
  };

  // Handle Card Payment
  const handleCardPayment = async () => {
    const totalAmount = config.amountMode === "fixed" ? page.price : formData.customAmount;

    if (!totalAmount || totalAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (config.collectName && config.nameRequired && !customerName) {
      newErrors.name = "Name is required";
    }
    if (config.collectEmail && config.emailRequired && !customerEmail) {
      newErrors.email = "Email is required";
    }
    if (config.collectPhone && config.phoneRequired && !customerPhone) {
      newErrors.phone = "Phone number is required";
    }
    config.customFields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) newErrors[field.id] = error;
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
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
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

      window.open(data.checkoutLink, "_blank", "width=500,height=700");

      const checkInterval = setInterval(async () => {
        const statusResponse = await fetch(
          `/api/payment-page/public/status?reference=${data.orderReference}`
        );
        const statusData = await statusResponse.json();
        if (statusData.payment?.status === "completed") {
          clearInterval(checkInterval);
          alert("Payment successful!");
          window.location.reload();
        }
      }, 5000);

      setTimeout(() => clearInterval(checkInterval), 300000);
    } catch (err: any) {
      alert(
        err.message || "Failed to initiate card payment. Please try again."
      );
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
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "number":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: parseFloat(e.target.value) })}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "date":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Input
              type="date"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              className="bg-[#1a1a1a] border-gray-700 text-white"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "dropdown":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <select
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-700 bg-[#1a1a1a] px-3 text-white"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
              className="h-4 w-4 rounded border-gray-700 bg-[#1a1a1a]"
            />
            <Label className="text-sm text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      case "paragraph":
        return (
          <div key={field.id}>
            <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
              {field.label} {field.required && "*"}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              rows={3}
              className="bg-[#1a1a1a] border-gray-700 text-white resize-none"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  // Check if link is active
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
      {/* Header */}
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

      {/* Content */}
      <div className="max-w-lg mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden"
          style={{ borderTop: `4px solid ${config.brandColor}` }}
        >
          {page.coverImage && (
            <img src={page.coverImage} alt={page.title} className="w-full h-40 object-cover" />
          )}
          
          <div className="p-6 space-y-6">
            {/* Title & Description */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{page.title}</h2>
              {page.description && (
                <p className="text-gray-400 text-sm mt-2">{page.description}</p>
              )}
            </div>

            {/* Amount Display */}
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
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Enter Amount *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {currencySymbol}
                    </span>
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

            {/* Customer Info Fields */}
            <div className="space-y-4">
              {config.collectName && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Full Name {config.nameRequired && "*"}
                  </Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
              )}

              {config.collectEmail && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Email Address {config.emailRequired && "*"}
                  </Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="customer@example.com"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              )}

              {config.collectPhone && (
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block text-gray-300">
                    Phone Number {config.phoneRequired && "*"}
                  </Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-[#1a1a1a] border-gray-700 text-white"
                    placeholder="+234 123 456 7890"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              )}

              {config.customFields.map(renderCustomField)}

              {/* Reference Code Display */}
              {config.referenceCode && (
                <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Reference Code</p>
                  <p className="text-sm font-mono" style={{ color: config.brandColor }}>{config.referenceCode}</p>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <h3 className="font-bold text-lg mb-4 text-white">Payment Method</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod("virtual_account")}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "virtual_account" ? "border-[#e1bf46] bg-[#e1bf46]/10" : "border-gray-700 hover:border-[#e1bf46]/50"}`}
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
                  className={`p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "card" ? "border-[#e1bf46] bg-[#e1bf46]/10" : "border-gray-700 hover:border-[#e1bf46]/50"}`}
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
                        {/* NARRATION CODE - This is the tracking code */}
                        <div className="mt-3 p-3 bg-yellow-900/40 rounded-xl border border-yellow-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">📝 Narration Code</span>
                              <span className="text-[10px] text-yellow-500/70">(Required - Use this to track your payment)</span>
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
                          <p className="text-[9px] text-yellow-500/60 mt-1">Use this exact code as narration when transferring</p>
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
                      <span className="text-2xl font-bold text-[#e1bf46]">
                        {currencySymbol}{(config.amountMode === "fixed" ? page.price : formData.customAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      onClick={handleVirtualAccountPayment}
                      disabled={!isValidAmount}
                      className="w-full mt-4 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold"
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Get Account Details
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
                      <span className="text-2xl font-bold text-[#e1bf46]">
                        {currencySymbol}{(config.amountMode === "fixed" ? page.price : formData.customAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setCardPaymentAmount(config.amountMode === "fixed" ? page.price : formData.customAmount || 0);
                      setShowCardModal(true);
                    }}
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
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
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
            <Button
              onClick={handleCardPayment}
              disabled={processingCardPayment}
              className="w-full bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90 font-semibold py-3"
            >
              {processingCardPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {processingCardPayment ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      )}

      {/* Virtual Account Details Modal with Narration Code */}
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
                <span className="font-semibold text-white">{page.virtualAccount?.bankName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#e1bf46]">{page.virtualAccount?.accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(page.virtualAccount?.accountNumber || "", "account")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "account" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Account Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{page.virtualAccount?.bankAccountName || page.virtualAccount?.accountName}</span>
                  <button
                    onClick={() => copyToClipboard(page.virtualAccount?.bankAccountName || page.virtualAccount?.accountName || "", "accountName")}
                    className="p-1.5 rounded-lg bg-[#e1bf46]/10 hover:bg-[#e1bf46]/20"
                  >
                    {copiedField === "accountName" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-[#e1bf46]" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500">Amount</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#e1bf46]">{currencySymbol}{amount.toLocaleString()}</span>
                  <button
                    onClick={() => copyToClipboard(`${currencySymbol}${amount.toLocaleString()}`, "amount")}
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

              {/* NARRATION CODE - The tracking code */}
              <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-800 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">📝 Narration Code</span>
                    <span className="text-[10px] text-yellow-500/70">(Required - Use this to track your payment)</span>
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
                  <p className="text-[9px] text-yellow-500/60 text-center mt-1">This code helps us identify your payment</p>
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
    </div>
  );
}