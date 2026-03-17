// app/components/Invoice-components/InvoiceSummary.tsx
"use client";

import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, Sparkles, Star, CheckCircle2, AlertCircle } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceUsageInfo {
  used: number;
  limit: string | number | "unlimited";
  remaining: string | number | "unlimited";
  hasAccess: boolean;
  isChecking: boolean;
}

interface InvoiceSummaryProps {
  invoiceData: {
    name: string;
    email: string;
    invoice_id: string;
    bill_to: string;
    from: string;
    issue_date: string;
    customer_note: string;
    message: string;
    invoice_items: InvoiceItem[];
    payment_type: "single" | "multiple";
    fee_option: "absorbed" | "customer";
    targetQuantity: number | "";
    status: "unpaid" | "paid" | "draft";
    business_name: string;
    allowMultiplePayments: boolean;
  };
  totals: {
    subtotal: number;
    feeAmount: number;
    totalAmount: number;
  };
  initiatorName: string;
  initiatorEmail: string;
  amount: number;
  confirmInvoice: boolean;
  onBack: () => void;
  onConfirm: () => void;
  usageInfo?: InvoiceUsageInfo;
  userTier?: "free" | "zidlite" | "growth" | "premium" | "elite";
}

export default function InvoiceSummary({
  invoiceData,
  totals,
  initiatorName,
  initiatorEmail,
  amount,
  confirmInvoice,
  onBack,
  onConfirm,
  usageInfo,
  userTier = "free",
}: InvoiceSummaryProps) {
  const isFree = userTier === "free";
  const isZidLite = userTier === "zidlite";
  const isGrowth = userTier === "growth";
  const isPremium = userTier === "premium";
  const isElite = userTier === "elite";
  const hasUnlimited = isPremium || isElite || isGrowth;

  const getRemaining = (): number => {
    if (usageInfo) {
      return typeof usageInfo.remaining === "number" ? usageInfo.remaining : 999;
    }
    return 0;
  };

  const remainingInvoices = getRemaining();
  const hasFreeInvoices = hasUnlimited || remainingInvoices > 0;
  const isChecking = usageInfo?.isChecking || false;

  const getTierIcon = () => {
    if (isElite) return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    if (isPremium) return <Crown className="w-5 h-5 text-[#2b825b]" />;
    if (isGrowth) return <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (isZidLite) return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    return <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };

  const getTierColors = () => {
    if (isElite) return {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-700 dark:text-purple-400",
      btn: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700",
    };
    if (isPremium) return {
      bg: "bg-[#2b825b]/10",
      border: "border-[#2b825b]",
      text: "text-[#2b825b]",
      btn: "bg-[#2b825b] hover:bg-[#1e5d42] dark:bg-[#2b825b] dark:hover:bg-[#1e5d42]",
    };
    if (isGrowth) return {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-700 dark:text-green-400",
      btn: "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
    };
    if (isZidLite) return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-400",
      btn: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
    };
    return {
      bg: "bg-gray-50 dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      text: "text-gray-700 dark:text-gray-400",
      btn: "bg-[#2b825b] hover:bg-[#1e5d42] dark:bg-[#2b825b] dark:hover:bg-[#1e5d42]",
    };
  };

  const colors = getTierColors();
  const tierIcon = getTierIcon();

  const getTierDisplayName = () => {
    if (isElite) return "Elite";
    if (isPremium) return "Premium";
    if (isGrowth) return "Growth";
    if (isZidLite) return "ZidLite";
    return "Free Trial";
  };

  const safeEmail = initiatorEmail || invoiceData.email || "";

  // Check if user has reached limit
  const hasReachedLimit = !hasUnlimited && remainingInvoices <= 0;

  return (
    <AnimatePresence>
      {confirmInvoice && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-border dark:border-gray-800">
              {/* Invoice Status Banner */}
              {!isChecking && (
                <div
                  className={`p-4 rounded-lg border ${
                    hasUnlimited
                      ? colors.bg + " " + colors.border
                      : hasFreeInvoices
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {hasUnlimited ? (
                        <>
                          <span className={`mr-3 text-2xl ${colors.text}`}>
                            {tierIcon}
                          </span>
                          <div>
                            <p className={`font-semibold ${colors.text}`}>
                              {getTierDisplayName()} Plan
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Unlimited invoices included
                            </p>
                          </div>
                        </>
                      ) : hasFreeInvoices ? (
                        <>
                          <CheckCircle2 className="text-green-600 dark:text-green-400 mr-3 w-6 h-6" />
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-400">
                              Free Invoice Available
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              You have {remainingInvoices} free{" "}
                              {remainingInvoices === 1 ? "invoice" : "invoices"} remaining
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="text-yellow-600 dark:text-yellow-400 mr-3 w-6 h-6" />
                          <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                              Limit Reached
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                              You've used all your free invoices
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          hasUnlimited
                            ? colors.text
                            : hasFreeInvoices
                              ? "text-green-600 dark:text-green-400"
                              : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {hasUnlimited ? "FREE" : hasFreeInvoices ? "FREE" : "LIMIT REACHED"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {usageInfo?.used || 0} used
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col items-center border-b border-border dark:border-gray-800 pb-4">
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Invoice Summary
                </div>
                <div
                  className={`text-3xl font-bold ${
                    hasUnlimited
                      ? colors.text
                      : hasFreeInvoices
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  ₦{totals.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {invoiceData.payment_type === "multiple"
                    ? "Multiple Buyers Invoice"
                    : "Single Buyer Invoice"}
                </div>
              </div>

              {/* INVOICE DETAILS Section */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3">
                  Invoice Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Invoice Number
                    </span>
                    <span className="text-gray-900 dark:text-gray-200 font-medium">
                      {invoiceData.invoice_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Issue Date
                    </span>
                    <span className="text-gray-900 dark:text-gray-200">
                      {invoiceData.issue_date}
                    </span>
                  </div>
                  {invoiceData.payment_type === "multiple" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Total Units
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {invoiceData?.targetQuantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    From
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Name
                      </span>
                      <span className="text-gray-900 dark:text-gray-200 font-medium">
                        {initiatorName || invoiceData.business_name || invoiceData.from}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Email
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {safeEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Bill To
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {invoiceData.bill_to || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    To
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Client Name
                      </span>
                      <span className="text-gray-900 dark:text-gray-200 font-medium">
                        {invoiceData.name || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Email
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {invoiceData.email || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS & TOTALS */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                  Items & Amount
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="space-y-2 mb-3">
                    {invoiceData.invoice_items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.description} (Qty: {item.quantity})
                        </span>
                        <span className="text-gray-900 dark:text-gray-200">
                          ₦{item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        ₦{totals.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        Total Amount
                      </span>
                      <span className="text-gray-900 dark:text-gray-200">
                        ₦{totals.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div
                className={`rounded-lg p-4 text-sm flex items-start gap-3 ${
                  hasUnlimited
                    ? colors.bg + " border " + colors.border
                    : hasFreeInvoices
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <div className="space-y-1">
                  <p className="font-medium">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This invoice will be sent to the client's email</li>
                    <li>Client can pay via multiple payment methods</li>

                    {hasUnlimited ? (
                      <>
                        <li>
                          <strong className={colors.text}>
                            {getTierDisplayName()} Plan:
                          </strong>{" "}
                          Unlimited invoices included
                        </li>
                        <li>No additional charges for invoice creation</li>
                      </>
                    ) : hasFreeInvoices ? (
                      <>
                        <li>
                          This invoice is <strong>FREE</strong> (within plan limit)
                        </li>
                        <li>
                          You have {remainingInvoices - 1} free{" "}
                          {remainingInvoices - 1 === 1 ? "invoice" : "invoices"} remaining
                        </li>
                        <li>
                          Upgrade to a higher tier for unlimited invoices
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="text-yellow-700 dark:text-yellow-400 font-medium">
                          ⚠️ You've reached your invoice limit
                        </li>
                        <li>
                          You need to upgrade your plan to create more invoices
                        </li>
                        <li>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-[#2b825b] font-semibold underline"
                            onClick={() => window.location.href = "/pricing?upgrade=growth"}
                          >
                            Upgrade to Growth
                          </Button>{" "}
                          for unlimited invoices
                        </li>
                      </>
                    )}

                    <li>You will receive notifications when payment is made</li>
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t border-border dark:border-gray-800">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Back to Edit
                </Button>
                
                {hasReachedLimit ? (
                  <Button
                    onClick={() => window.location.href = "/pricing?upgrade=growth"}
                    className="px-8 bg-[#2b825b] hover:bg-[#1e5d42] dark:bg-[#2b825b] dark:hover:bg-[#1e5d42] text-white"
                  >
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button
                    onClick={onConfirm}
                    className={`px-8 text-white ${
                      hasUnlimited
                        ? colors.btn
                        : "bg-[#2b825b] hover:bg-[#1e5d42] dark:bg-[#2b825b] dark:hover:bg-[#1e5d42]"
                    }`}
                  >
                    Create Invoice
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}