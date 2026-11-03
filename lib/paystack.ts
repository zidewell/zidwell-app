// lib/paystack.ts
const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackHeaders() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export interface PaystackInitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function paystackInitialize(params: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
  channels?: (
    | "card"
    | "bank"
    | "ussd"
    | "bank_transfer"
    | "qr"
    | "mobile_money"
  )[];
}): Promise<PaystackInitResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
      channels: params.channels ?? ["card","bank_transfer"],
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(
      json?.message || "Failed to initialize Paystack transaction"
    );
  }
  return json.data as PaystackInitResult;
}

export interface PaystackVerifyResult {
  status:
    | "success"
    | "failed"
    | "abandoned"
    | "ongoing"
    | "reversed"
    | "pending";
  reference: string;
  amount: number; // kobo
  currency: string;
  paid_at: string | null;
  channel: string | null;
  customer: { email: string; name?: string; phone?: string };
  metadata: Record<string, any> | null;
  gateway_response: string;
  fees?: number;
  transactionId: number;
}

export async function paystackVerify(
  reference: string
): Promise<PaystackVerifyResult> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders(), cache: "no-store" }
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json?.message || "Paystack verification failed");
  }
  return json.data as PaystackVerifyResult;
}