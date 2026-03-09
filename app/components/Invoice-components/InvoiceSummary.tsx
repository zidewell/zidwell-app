"use client";

import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Use the same InvoiceItem type as main component
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Updated InvoiceUsageInfo interface
interface InvoiceUsageInfo {
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  hasAccess: boolean;
  isChecking: boolean;
  isPayPerUse?: boolean;
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
  freeInvoiceInfo?: {
    freeInvoicesLeft: number;
    totalInvoicesCreated: number;
    hasFreeInvoices: boolean;
    isChecking: boolean;
  };
  usageInfo?: InvoiceUsageInfo;
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  payPerUseFee?: number; // Added this prop
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
  freeInvoiceInfo,
  usageInfo,
  userTier = 'free',
  payPerUseFee = 100, // Default to 100
}: InvoiceSummaryProps) {
  
  // Determine which system to use (new subscription system takes precedence)
  const useNewSystem = usageInfo !== undefined;
  
  // Get usage data from either system
  const isPremium = userTier === 'premium' || userTier === 'elite';
  const isGrowth = userTier === 'growth';
  const hasUnlimited = isPremium || isGrowth;
  
  // Safe function to get remaining value
  const getRemaining = (): number => {
    if (useNewSystem && usageInfo) {
      return typeof usageInfo.remaining === 'number' ? usageInfo.remaining : 999;
    }
    return freeInvoiceInfo?.freeInvoicesLeft || 0;
  };
  
  const remainingInvoices = getRemaining();
  
  const hasFreeInvoices = useNewSystem
    ? (hasUnlimited || (typeof usageInfo?.remaining === 'number' && usageInfo.remaining > 0))
    : (freeInvoiceInfo?.hasFreeInvoices || false);
  
  const totalCreated = useNewSystem
    ? usageInfo?.used || 0
    : freeInvoiceInfo?.totalInvoicesCreated || 0;
  
  const isChecking = useNewSystem
    ? usageInfo?.isChecking || false
    : freeInvoiceInfo?.isChecking || false;

  // Calculate invoice fee
  const invoiceFee = hasUnlimited ? 0 : (hasFreeInvoices ? 0 : payPerUseFee);
  const showInvoiceInfo = !isChecking;

  // Safe email value
  const safeEmail = initiatorEmail || invoiceData.email || "";

  return (
    <AnimatePresence>
      {confirmInvoice && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* 📄 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Invoice Status Banner */}
              {showInvoiceInfo && (
                <div
                  className={`p-4 rounded-lg border ${
                    hasUnlimited 
                      ? "bg-purple-50 border-purple-200"
                      : hasFreeInvoices
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {hasUnlimited ? (
                        <>
                          <span className="text-purple-600 mr-3 text-2xl">
                            👑
                          </span>
                          <div>
                            <p className="font-semibold text-purple-800">
                              {userTier === 'growth' ? 'Growth Plan' : 'Premium Plan'}
                            </p>
                            <p className="text-sm text-purple-600">
                              Unlimited invoices
                            </p>
                          </div>
                        </>
                      ) : hasFreeInvoices ? (
                        <>
                          <span className="text-green-600 mr-3 text-2xl">
                            🎉
                          </span>
                          <div>
                            <p className="font-semibold text-green-800">
                              Free Invoice Available
                            </p>
                            <p className="text-sm text-green-600">
                              You have {remainingInvoices} free {remainingInvoices === 1 ? 'invoice' : 'invoices'} remaining this month
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[#C29307] mr-3 text-2xl">
                            💰
                          </span>
                          <div>
                            <p className="font-semibold text-yellow-800">
                              Pay-Per-Use
                            </p>
                            <p className="text-sm text-[#C29307]">
                              You've reached your monthly limit
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          hasUnlimited 
                            ? "text-purple-600"
                            : hasFreeInvoices
                            ? "text-green-600"
                            : "text-[#C29307]"
                        }`}
                      >
                        {hasUnlimited ? "UNLIMITED" : (hasFreeInvoices ? "FREE" : `₦${invoiceFee}`)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {useNewSystem 
                          ? `${totalCreated} used this month`
                          : `${totalCreated} invoices created`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex flex-col items-center border-b pb-4">
                <div className="text-gray-500 text-sm">Invoice Generation</div>
                <div
                  className={`text-3xl font-bold ${
                    hasUnlimited 
                      ? "text-purple-600"
                      : hasFreeInvoices
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {hasUnlimited ? "FREE" : (hasFreeInvoices ? "FREE" : `₦${invoiceFee}`)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {invoiceData.payment_type === "multiple"
                    ? "Multiple Buyers Invoice"
                    : "Single Buyer Invoice"}
                  {!hasUnlimited && showInvoiceInfo && (
                    <span
                      className={`block mt-1 ${
                        hasFreeInvoices
                          ? "text-green-600"
                          : "text-[#C29307]"
                      }`}
                    >
                      {hasFreeInvoices
                        ? `(${remainingInvoices} ${remainingInvoices === 1 ? 'invoice' : 'invoices'} left this month)`
                        : "(Monthly limit reached - Pay-per-use active)"}
                    </span>
                  )}
                  {hasUnlimited && (
                    <span className="block mt-1 text-purple-600">
                      (Unlimited invoices)
                    </span>
                  )}
                </div>
              </div>

              {/* INVOICE DETAILS Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-3">
                  Invoice Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Number</span>
                    <span className="text-gray-900 font-medium">
                      {invoiceData.invoice_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issue Date</span>
                    <span className="text-gray-900">
                      {invoiceData.issue_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee Option</span>
                    <span className="text-gray-900 capitalize">
                      {invoiceData.fee_option === "customer"
                        ? "Customer pays 2% fee"
                        : "2% absorbed by you"}
                    </span>
                  </div>
                  {invoiceData.payment_type === "multiple" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Units</span>
                      <span className="text-gray-900">
                        {invoiceData?.targetQuantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    From
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Name</span>
                      <span className="text-gray-900 font-medium">
                        {initiatorName || invoiceData.business_name || invoiceData.from}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{safeEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">
                        Bill To
                      </span>
                      <span className="text-gray-900">
                        {invoiceData.bill_to || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TO Section */}
                <div>
                  <h3 className="text-gray-700 text-sm font-semibold mb-2">
                    To
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">
                        Client Name
                      </span>
                      <span className="text-gray-900 font-medium">
                        {invoiceData.name || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Email</span>
                      <span className="text-gray-900">{invoiceData.email || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS & TOTALS */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2">
                  Items & Amount
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 mb-3">
                    {invoiceData.invoice_items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-700">
                          {item.description} (Qty: {item.quantity})
                        </span>
                        <span className="text-gray-900">
                          ₦{item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ₦{totals.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {invoiceData.fee_option === "customer" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Processing Fee (2%) capped at ₦2000
                        </span>
                        <span className="text-gray-900">
                          ₦{totals.feeAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-gray-900">
                        ₦{totals.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGE & NOTES */}
              {(invoiceData.message || invoiceData.customer_note) && (
                <div className="space-y-3">
                  {invoiceData.message && (
                    <div>
                      <h3 className="text-gray-700 text-sm font-semibold mb-2">
                        Message
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">{invoiceData.message}</p>
                      </div>
                    </div>
                  )}
                  {invoiceData.customer_note && (
                    <div>
                      <h3 className="text-gray-700 text-sm font-semibold mb-2">
                        Customer Note
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">
                          {invoiceData.customer_note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Important Notes */}
              <div
                className={`rounded-lg p-4 text-sm flex items-start gap-3 ${
                  hasUnlimited
                    ? "bg-purple-50 border border-purple-200 text-purple-700"
                    : hasFreeInvoices
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-blue-50 border border-blue-200 text-blue-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 mt-0.5 shrink-0 ${
                    hasUnlimited
                      ? "text-purple-500"
                      : hasFreeInvoices
                      ? "text-green-500"
                      : "text-blue-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-1">
                  <p className="font-medium">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This invoice will be sent to the client's email</li>
                    <li>Client can pay via multiple payment methods</li>
                    
                    {hasUnlimited ? (
                      <>
                        <li>
                          <strong className="text-purple-700">{userTier === 'growth' ? 'Growth Plan:' : 'Premium Plan:'}</strong> Unlimited invoices
                        </li>
                        <li>No monthly limits on invoice creation</li>
                      </>
                    ) : hasFreeInvoices ? (
                      <>
                        <li>
                          This invoice is <strong>FREE</strong> (within monthly limit)
                        </li>
                        <li>
                          You have {remainingInvoices - 1} free {remainingInvoices - 1 === 1 ? 'invoice' : 'invoices'} remaining this month
                        </li>
                        <li>After reaching limit, you can continue with pay-per-use (₦{payPerUseFee} per invoice) or upgrade to Growth for unlimited</li>
                      </>
                    ) : (
                      <>
                        <li>
                          This invoice will cost <strong>₦{payPerUseFee}</strong> (pay-per-use)
                        </li>
                        <li>
                          You've reached your monthly limit of 5 free invoices
                        </li>
                        <li>Upgrade to Growth for unlimited free invoices</li>
                      </>
                    )}
                    
                    <li>You will receive notifications when payment is made</li>
                    {invoiceData.fee_option === "customer" && (
                      <li>
                        2% processing fee will be added to the client's total
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={onConfirm}
                  className={`px-8 ${
                    hasUnlimited
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : hasFreeInvoices
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-[#C29307] hover:bg-[#b38606] text-white"
                  }`}
                >
                  {hasUnlimited 
                    ? "Create Invoice"
                    : hasFreeInvoices 
                    ? `Create Free Invoice (${remainingInvoices - 1} left)` 
                    : `Pay ₦${payPerUseFee} & Create Invoice`}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}