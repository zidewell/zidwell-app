// components/Invoice-components/types.ts

// ============================================================================
// Shared types
// ============================================================================

// Zidwell subscription tiers. "starter" is the free plan (5 invoices/month);
// "free" is only used as a pre-subscription sentinel before the first row
// is created. Any ZidStore tier (booster / console) is normalized to
// "starter" by useSubscription before it reaches the invoice components.
export type SubscriptionTier = "free" | "starter" | "sme" | "enterprise";

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// ============================================================================
// Form state
// ============================================================================

export interface InvoiceForm {
  name: string;
  email: string;
  message: string;
  invoice_id: string;
  bill_to: string;
  from: string;
  issue_date: string;
  customer_note: string;
  invoice_items: InvoiceItem[];
  payment_type: "single" | "multiple";
  fee_option: "absorbed" | "customer";
  status: "unpaid" | "paid" | "draft";
  business_logo?: string;
  redirect_url?: string;
  business_name: string;
  /** Contact person name shown under the business name on the invoice */
  senderName?: string;
  /** Contact person phone shown under the business name on the invoice */
  senderPhone?: string;
  allowMultiplePayments: boolean;
  clientPhone?: string;
  targetQuantity: number | "";
  sendEmailAutomatically: boolean;
}

// ============================================================================
// Usage tracking
// ============================================================================

export interface InvoiceUsageInfo {
  used: number;
  limit: number | string | "unlimited";
  remaining: number | string | "unlimited";
  hasAccess: boolean;
  isChecking: boolean;
  isPayPerUse?: boolean;
  canCreate: boolean;
}

// ============================================================================
// Component props
// ============================================================================

export interface InvoiceSummaryProps {
  invoiceData: InvoiceForm;
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
  userTier?: SubscriptionTier;
}

export interface PinPopOverProps {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  pin: string[];
  setPin: (pin: string[]) => void;
  inputCount: number;
  onConfirm: () => Promise<void>;
  invoiceFeeInfo?: {
    isFree: boolean;
    freeInvoicesLeft: number;
    totalInvoicesCreated: number;
    feeAmount: number;
  };
  usageInfo?: InvoiceUsageInfo;
}

export interface CreateInvoiceProps {
  onInvoiceCreated?: () => void;
}

export interface TabsNavigationProps {
  activeTab: "create" | "preview";
  onTabChange: (tab: "create" | "preview") => void;
  createContent: React.ReactNode;
  previewContent: React.ReactNode;
}

export interface InvoiceItemFormProps {
  item?: InvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InvoiceItem) => void;
}

export interface InvoiceItemRowProps {
  item: InvoiceItem;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

// ============================================================================
// Drafts
// ============================================================================

export interface Draft {
  id: string;
  business_name: string;
  invoice_id: string;
  created_at: string;
  total_amount: number;
  client_name?: string;
  client_email?: string;
  items?: InvoiceItem[];
  invoice_items?: InvoiceItem[];
  message?: string;
  bill_to?: string;
  issue_date?: string;
  customer_note?: string;
  payment_type?: "single" | "multiple";
  fee_option?: "absorbed" | "customer";
  business_logo?: string;
  redirect_url?: string;
  allow_multiple_payments?: boolean;
  client_phone?: string;
  send_email_automatically?: boolean;
  target_quantity?: number;
  initiator_name?: string;
  initiator_phone?: string;
  from_name?: string;
}

export interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: Draft[];
  onLoadDraft: (draft: Draft) => void;
  onViewAll?: () => void;
  onStartFresh: () => void;
}

// ============================================================================
// Success modal
// ============================================================================

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSigningLink: string;
  onDownloadPDF: () => void;
  onCopyLink: () => void;
  allowMultiplePayments: boolean;
  pdfLoading: boolean;
  paymentProgress?: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    progress: number;
    status: string;
    paidQuantity: number;
    targetQuantity: number;
  };
}

// ============================================================================
// Usage API response
// ============================================================================

export interface UsageApiResponse {
  invoices: {
    used: number;
    limit: number | "unlimited";
    remaining: number | "unlimited";
    canCreate: boolean;
  };
  receipts: {
    used: number;
    limit: number | "unlimited";
    remaining: number | "unlimited";
  };
  contracts: {
    used: number;
    limit: number | "unlimited";
    remaining: number | "unlimited";
  };
  tier: SubscriptionTier;
}