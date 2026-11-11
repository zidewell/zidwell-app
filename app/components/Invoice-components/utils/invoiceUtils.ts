// app/components/Invoice-components/utils/invoiceUtils.ts

import { InvoiceForm } from "../types";

// ============================================================================
// ID generators
// ============================================================================

export const generateInvoiceId = () => {
  const randomToken = crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 4)
    .toUpperCase();
  return `INV_${randomToken}`;
};

export const generateItemId = () => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Totals
// ============================================================================

// Subscription-based — no processing fee is added to the invoice.
// The total is simply the sum of quantity × unitPrice across all items.
export const calculateTotals = (
  invoice_items: InvoiceForm["invoice_items"],
  _fee_option: InvoiceForm["fee_option"],
) => {
  const subtotal = invoice_items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0,
  );

  const feeAmount = 0;
  const totalAmount = subtotal;

  return { subtotal, feeAmount, totalAmount };
};

// ============================================================================
// Preview transformation
// ============================================================================

export const convertToInvoicePreview = (form: InvoiceForm) => {
  const { subtotal, totalAmount } = calculateTotals(
    form.invoice_items,
    form.fee_option,
  );

  return {
    id: form.invoice_id,
    invoiceNumber: form.invoice_id,
    businessName: form.business_name,
    businessLogo: form.business_logo || "",
    // Sender details
    fromName: form.senderName?.trim() || form.business_name,
    fromEmail: form.from || "",
    fromPhone: form.senderPhone || "",
    // Client details
    clientName: form.name,
    clientEmail: form.email,
    clientPhone: form.clientPhone || "",
    billTo: form.bill_to || "",
    items: form.invoice_items,
    subtotal,
    tax: 0,
    total: totalAmount,
    allowPartialPayment: false,
    allowMultiplePayments: form.allowMultiplePayments,
    targetQuantity: form.allowMultiplePayments
      ? form.targetQuantity
      : undefined,
    targetAmount: form.allowMultiplePayments ? totalAmount : undefined,
    paidQuantity: 0,
    createdAt: form.issue_date,
    status: form.status as "draft" | "unpaid" | "paid",
    redirectUrl: form.redirect_url || "",
  };
};

// ============================================================================
// Tier helpers
// ============================================================================
// Zidwell invoice tiers: starter (= free), sme, enterprise.
// Any other raw tier (booster / console) is normalized to starter by
// useSubscription before it reaches these helpers, so only the three real
// tiers below need to be handled explicitly.

const UNLIMITED_TIERS = ["sme", "enterprise"];
const STARTER_INVOICE_LIMIT = 5;
const STARTER_RECEIPT_LIMIT = 5;
const ENTERPRISE_CONTRACT_LIMIT = 10;

export const canCreateInvoice = (
  _tier: string,
  usedCount: number,
  limit: number | "unlimited",
): boolean => {
  if (limit === "unlimited") return true;
  return usedCount < limit;
};

export const getRemainingInvoices = (
  tier: string,
  usedCount: number,
): number | "unlimited" => {
  if (UNLIMITED_TIERS.includes(tier)) return "unlimited";
  return Math.max(0, STARTER_INVOICE_LIMIT - usedCount);
};

export const getRemainingReceipts = (
  tier: string,
  usedCount: number,
): number | "unlimited" => {
  if (UNLIMITED_TIERS.includes(tier)) return "unlimited";
  return Math.max(0, STARTER_RECEIPT_LIMIT - usedCount);
};

export const getRemainingContracts = (
  tier: string,
  usedCount: number,
): number | "unlimited" => {
  if (tier === "enterprise") {
    return Math.max(0, ENTERPRISE_CONTRACT_LIMIT - usedCount);
  }
  return 0;
};

export const getInvoiceLimit = (tier: string): number | "unlimited" => {
  if (UNLIMITED_TIERS.includes(tier)) return "unlimited";
  return STARTER_INVOICE_LIMIT;
};

export const getReceiptLimit = (tier: string): number | "unlimited" => {
  if (UNLIMITED_TIERS.includes(tier)) return "unlimited";
  return STARTER_RECEIPT_LIMIT;
};

export const getContractLimit = (tier: string): number | "unlimited" => {
  if (tier === "enterprise") return ENTERPRISE_CONTRACT_LIMIT;
  return 0;
};

export const getTierDisplayName = (tier: string): string => {
  const tierMap: Record<string, string> = {
    free: "Free",
    starter: "Free",
    sme: "SME",
    enterprise: "Enterprise",
  };
  return tierMap[tier] || tier;
};

export const isFeatureIncluded = (tier: string, feature: string): boolean => {
  const features: Record<string, string[]> = {
    starter: [
      "manual_bookkeeping",
      "branded_invoices",
      "expense_tracking",
      "basic_financial_insights",
    ],
    sme: [
      "manual_bookkeeping",
      "branded_invoices",
      "expense_tracking",
      "basic_financial_insights",
      "bank_statement_upload",
      "vault",
      "tax_calculator",
      "financial_statements",
      "bookkeeping_access",
      "international_payments",
    ],
    enterprise: [
      "manual_bookkeeping",
      "branded_invoices",
      "expense_tracking",
      "basic_financial_insights",
      "bank_statement_upload",
      "vault",
      "tax_calculator",
      "financial_statements",
      "bookkeeping_access",
      "international_payments",
      "multi_user_access",
      "role_permissions",
      "approval_system",
      "downloadable_reports",
      "dedicated_onboarding",
      "connect_bank_accounts",
      "increased_transaction_limits",
    ],
  };

  return (features[tier] || []).includes(feature);
};
