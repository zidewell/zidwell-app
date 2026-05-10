import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import SignReceiptForm from "@/app/components/SignReceiptForm"; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReceiptItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Receipt {
  id: string;
  token: string;
  receipt_id: string;
  initiator_name: string;
  initiator_email: string;
  business_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  bill_to: string;
  from_name: string;
  issue_date: string;
  customer_note: string;
  payment_for: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "pending" | "signed" | "expired" | "draft";
  verification_code: string;
  receipt_items: ReceiptItem[];
  seller_signature: string;
  client_signature: string;
  signed_at: string | null;
  created_at: string;
  sent_at: string;
  signee_name: string;
  signee_email: string;
  metadata: any;
}

export default async function ReceiptSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Fetch receipt from Supabase
  const { data: receiptData, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("token", token)
    .single();
    

  if (error || !receiptData) {
    return notFound();
  }

  // Parse receipt_items if it's a string
  const parsedItems = typeof receiptData.receipt_items === 'string' 
    ? JSON.parse(receiptData.receipt_items)
    : receiptData.receipt_items || [];

  // Parse metadata if it's a string
  const metadata = typeof receiptData.metadata === 'string' 
    ? JSON.parse(receiptData.metadata)
    : receiptData.metadata || {};

  const transformedItems = parsedItems.map((item: any, index: number) => ({
    id: item.id || index.toString(),
    description: item.description || item.item || "",
    quantity: item.quantity || 1,
    unit_price: item.unit_price || item.price || 0,
    amount: item.total || item.amount || (item.quantity * (item.unit_price || item.price)) || 0
  }));

  const receipt: Receipt = {
    ...receiptData,
    receipt_items: transformedItems,
    signee_name: receiptData.signee_name || receiptData.client_name || "",
    signee_email: receiptData.signee_email || receiptData.client_email || "",
    metadata: metadata,
    status: receiptData.status || "pending",
    verification_code: receiptData.verification_code || "",
    seller_signature: receiptData.seller_signature || "",
    client_signature: receiptData.client_signature || "",
    signed_at: receiptData.signed_at || null
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <SignReceiptForm receipt={receipt} />
    </div>
  );
}