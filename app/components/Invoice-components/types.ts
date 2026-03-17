// components/Invoice-components/types.ts

// Shared types to avoid duplicates
export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

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
  allowMultiplePayments: boolean;
  clientPhone?: string;
  targetQuantity: number | "";
}

// NEW: Subscription-based invoice usage tracking
export interface InvoiceUsageInfo {
  /** Number of invoices used this month */
  used: number;
  /** Monthly limit based on subscription tier */
  limit: number | string;
  /** Remaining invoices for this month */
  remaining: number | string;
  /** Whether user has access to create more invoices */
  hasAccess: boolean;
  /** Loading state */
  isChecking: boolean;
   isPayPerUse?: boolean;
    canCreate: boolean;
}

// NEW: Props for InvoiceSummary component with usage info
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
  /** Usage information from subscription system */
  usageInfo?: InvoiceUsageInfo;
}

// NEW: Props for PinPopOver with usage info
export interface PinPopOverProps {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  pin: string[];
  setPin: (pin: string[]) => void;
  inputCount: number;
  onConfirm: () => Promise<void>;
  /** @deprecated Use usageInfo instead */
  invoiceFeeInfo?: {
    isFree: boolean;
    freeInvoicesLeft: number;
    totalInvoicesCreated: number;
    feeAmount: number;
  };
  /** Usage information from subscription system */
  usageInfo?: InvoiceUsageInfo;
}

// Drafts Modal Component
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
  target_quantity?: number;
}

export interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: Draft[];
  onLoadDraft: (draft: Draft) => void;
  onViewAll?: () => void;
  onStartFresh: () => void;
}

export interface CreateInvoiceProps {
  onInvoiceCreated?: () => void;
}

/**
 * @deprecated Use InvoiceUsageInfo from subscription system instead
 * This was used for the old free invoice system with free_invoices_left column
 * Now using invoices_used_this_month with limits from subscription_features table
 */
export interface FreeInvoiceInfo {
  freeInvoicesLeft: number;
  totalInvoicesCreated: number;
  hasFreeInvoices: boolean;
  isChecking: boolean;
}

// NEW: Response from the usage API
export interface UsageApiResponse {
  invoices: {
    used: number;
    limit: number;
    remaining: number;
  };
  receipts: {
    used: number;
    limit: number;
    remaining: number;
  };
  contracts: {
    used: number;
    limit: number;
    remaining: number;
  };
  bookkeepingTrial: {
    isActive: boolean;
    endsAt: Date;
    daysRemaining: number;
  } | null;
  tier: 'free' | 'growth' | 'premium' | 'elite';
  payPerUseFee?: number;
}

// NEW: Props for SuccessModal
export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSigningLink: string;
  onDownloadPDF: () => void;
  onCopyLink: () => void;
  allowMultiplePayments: boolean;
  pdfLoading: boolean;
  /** Payment progress for multiple payments */
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

// NEW: Tabs navigation props
export interface TabsNavigationProps {
  activeTab: 'create' | 'preview';
  onTabChange: (tab: 'create' | 'preview') => void;
  createContent: React.ReactNode;
  previewContent: React.ReactNode;
}

// NEW: Invoice item form props
export interface InvoiceItemFormProps {
  item?: InvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InvoiceItem) => void;
}

// NEW: Invoice item row props
export interface InvoiceItemRowProps {
  item: InvoiceItem;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}