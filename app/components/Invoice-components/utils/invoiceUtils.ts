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

// Get remaining invoices based on tier
export const getRemainingInvoices = (
  tier: string,
  usedCount: number
): number | "unlimited" => {
  if (tier === "growth" || tier === "premium" || tier === "elite") {
    return "unlimited";
  }
  if (tier === "zidlite") {
    return Math.max(0, 10 - usedCount);
  }
  // Free tier
  return Math.max(0, 5 - usedCount);
};