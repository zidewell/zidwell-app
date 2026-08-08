// app/components/Invoice-components/utils/invoiceUtils.ts

import { InvoiceForm } from "../types";

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

// FIXED: Removed 2% fee calculation
export const calculateTotals = (invoice_items: InvoiceForm["invoice_items"], fee_option: InvoiceForm["fee_option"]) => {
  const subtotal = invoice_items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  // NO FEE - subscription based
  const feeAmount = 0;
  const totalAmount = subtotal; // Total is just subtotal, no fee added

  return { subtotal, feeAmount, totalAmount };
};

// FIXED: Updated to use new calculateTotals
export const convertToInvoicePreview = (form: InvoiceForm) => {
  const { subtotal, totalAmount } = calculateTotals(form.invoice_items, form.fee_option);

  return {
    id: form.invoice_id,
    invoiceNumber: form.invoice_id,
    businessName: form.business_name,
    businessLogo: form.business_logo || "",
    clientName: form.name,
    clientEmail: form.email,
    clientPhone: form.clientPhone || "",
    items: form.invoice_items,
    subtotal,
    tax: 0, // No tax
    total: totalAmount, // This is now just subtotal
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

// Helper to check if user can create invoice based on tier
export const canCreateInvoice = (
  tier: string,
  usedCount: number,
  limit: number | "unlimited"
): boolean => {
  if (limit === "unlimited") return true;
  return usedCount < limit;
};

// Get remaining invoices based on tier (UPDATED with real plan names)
export const getRemainingInvoices = (
  tier: string,
  usedCount: number
): number | "unlimited" => {
  // Updated tier names: sme, enterprise, corporation have unlimited
  if (tier === "sme" || tier === "enterprise" || tier === "corporation") {
    return "unlimited";
  }
  if (tier === "solopreneur") {
    return Math.max(0, 10 - usedCount);
  }
  // Free tier
  return Math.max(0, 5 - usedCount);
};

// Get remaining receipts based on tier (UPDATED with real plan names)
export const getRemainingReceipts = (
  tier: string,
  usedCount: number
): number | "unlimited" => {
  if (tier === "sme" || tier === "enterprise" || tier === "corporation") {
    return "unlimited";
  }
  if (tier === "solopreneur") {
    return "unlimited"; // Solopreneur has unlimited receipts
  }
  // Free tier
  return Math.max(0, 5 - usedCount);
};

// Get remaining contracts based on tier (UPDATED with real plan names)
export const getRemainingContracts = (
  tier: string,
  usedCount: number
): number | "unlimited" => {
  if (tier === "corporation") {
    return "unlimited";
  }
  if (tier === "enterprise") {
    return Math.max(0, 10 - usedCount);
  }
  if (tier === "sme") {
    return Math.max(0, 1 - usedCount);
  }
  // Solopreneur and Free have no contracts
  return 0;
};

// Get invoice limit based on tier (UPDATED with real plan names)
export const getInvoiceLimit = (tier: string): number | "unlimited" => {
  switch (tier) {
    case "corporation":
    case "enterprise":
    case "sme":
      return "unlimited";
    case "solopreneur":
      return 10;
    case "free":
    default:
      return 5;
  }
};

// Get receipt limit based on tier (UPDATED with real plan names)
export const getReceiptLimit = (tier: string): number | "unlimited" => {
  switch (tier) {
    case "corporation":
    case "enterprise":
    case "sme":
      return "unlimited";
    case "solopreneur":
      return "unlimited";
    case "free":
    default:
      return 5;
  }
};

// Get contract limit based on tier (UPDATED with real plan names)
export const getContractLimit = (tier: string): number | "unlimited" => {
  switch (tier) {
    case "corporation":
      return "unlimited";
    case "enterprise":
      return 10;
    case "sme":
      return 1;
    case "solopreneur":
    case "free":
    default:
      return 0;
  }
};

// Get tier display name (UPDATED with real plan names)
export const getTierDisplayName = (tier: string): string => {
  const tierMap: Record<string, string> = {
    free: "Free",
    solopreneur: "Solopreneur",
    sme: "SME",
    enterprise: "Enterprise",
    corporation: "Corporation",
  };
  return tierMap[tier] || tier;
};

// Check if feature is included in tier (UPDATED with real plan names)
export const isFeatureIncluded = (tier: string, feature: string): boolean => {
  const features: Record<string, string[]> = {
    free: ["manual_bookkeeping", "basic_financial_overview"],
    solopreneur: [
      "manual_bookkeeping",
      "branded_invoices",
      "expense_tracking",
      "basic_financial_insights"
    ],
    sme: [
      "bank_statement_upload",
      "vault",
      "tax_calculator",
      "financial_statements",
      "bookkeeping_access"
    ],
    enterprise: [
      "multi_user_access",
      "role_permissions",
      "approval_system",
      "downloadable_reports",
      "dedicated_onboarding"
    ],
    corporation: [
      "department_access",
      "payroll_system",
      "advanced_reporting",
      "custom_financial_structure",
      "priority_onboarding",
      "dedicated_account_manager"
    ],
  };
  
  return (features[tier] || []).includes(feature);
};