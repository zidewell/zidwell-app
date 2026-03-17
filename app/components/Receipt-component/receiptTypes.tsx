// Types for receipt components
export type ReceiptType = "general" | "product" | "service" | "bookings" | "rental" | "funds_transfer";

export interface SellerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface ReceiverInfo {
  name: string;
  email?: string;
  phone?: string;
}

export interface ReceiptItem {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

// Draft Interface - Updated to match receipts table structure
export interface ReceiptDraft {
  id: string;
  token: string;
  receipt_id: string;
  payment_for: string;
  user_id: string;
  initiator_email: string;
  initiator_name: string;
  business_name: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  bill_to: string;
  from_name: string;
  issue_date: string;
  customer_note: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "draft";
  receipt_items: ReceiptItem[];
  seller_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface DraftsResponse {
  success: boolean;
  drafts: ReceiptDraft[];
  count: number;
  error?: string;
}

export interface SaveReceiptResponse {
  success: boolean;
  signingLink?: string;
  receiptId?: string;
  isUpdate?: boolean;
  error?: string;
  message?: string;
  data?: any;
  metadata?:any;
}

export interface PaymentResponse {
  error?: string;
  message?: string;
}

// Receipt Summary Component Types
export interface ReceiptSummaryItem {
  item: string;
  quantity: string | number;
  price: string | number;
}