// // app/api/webhook/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { verifyNombaSignature } from "./helpers/signature-verification";
// import { processInvoicePayment } from "./services/invoice-payment.service";
// import { processVirtualAccountDeposit } from "./services/virtual-account.service";
// import { processPayout } from "./services/payout.service";
// import {
//   processPaymentPagePayment,
//   checkIfPaymentPagePayment,
//   processPaymentPageBankTransfer,
//   checkIfPaymentPageBankTransfer,
// } from "./services/payment-page.service";
// import {
//   processSubscriptionPayment,
//   processSubscriptionBankTransfer,
//   checkIfSubscriptionPayment,
//   checkIfSubscriptionBankTransfer,
// } from "../webhook/services/subscription-service";

// // Define common response types
// type WebhookResponse = 
//   | { success: boolean; message?: string; subscription_id?: string; credited_amount?: number; new_balance?: number | null; payment_id?: string }
//   | { error: string; status?: number; gross_amount?: number; fee_deducted?: number; net_credit?: number };

// // Helper to check if this is a regular wallet deposit (user ID)
// async function isRegularWalletDeposit(aliasAccountReference: string): Promise<boolean> {
//   if (!aliasAccountReference) return false;
//   if (aliasAccountReference.startsWith("VA-PP-")) return false;
//   if (aliasAccountReference.startsWith("VA-SUB-")) return false;

//   const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//   if (!uuidPattern.test(aliasAccountReference)) return false;

//   const { createClient } = await import("@supabase/supabase-js");
//   const supabase = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   );

//   const { data: user } = await supabase
//     .from("users")
//     .select("id")
//     .eq("id", aliasAccountReference)
//     .single();

//   return !!user;
// }

// // Helper to handle error responses
// function handleErrorResponse(result: any): NextResponse {
//   if (result && "error" in result && result.error) {
//     const statusCode = result.status && typeof result.status === "number" ? result.status : 500;
//     return NextResponse.json({ error: result.error }, { status: statusCode });
//   }
//   return NextResponse.json(result);
// }

// export async function POST(req: NextRequest) {
//   try {
//     console.log("====== Nomba Webhook Received ======");

//     const rawBody = await req.text();
//     let payload;

//     try {
//       payload = JSON.parse(rawBody);
//       console.log("Event type:", payload.event_type || payload.eventType);
//     } catch (err) {
//       console.error("Failed to parse JSON");
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     // Verify signature
//     const timestamp = req.headers.get("nomba-timestamp");
//     const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

//     if (!timestamp || !signature) {
//       console.warn("Missing signature headers");
//       return NextResponse.json({ error: "Missing signature" }, { status: 401 });
//     }

//     const isValid = await verifyNombaSignature(payload, timestamp, signature);
//     if (!isValid) {
//       console.error("Invalid signature");
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     console.log("✅ Signature verified");

//     const eventType = payload.event_type || payload.eventType;
//     const tx = payload.data?.transaction || {};
//     const order = payload.data?.order || {};
//     const customer = payload.data?.customer || {};

//     const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
//     const orderReference = order.orderReference;
//     const aliasAccountReference = tx.aliasAccountReference || tx.alias_account_reference;
//     const transactionAmount = safeNum(tx.transactionAmount ?? tx.amount ?? order.amount ?? 0);
//     const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
//     const txStatus = (tx.status || payload.data?.status || "").toString().toLowerCase();
//     const transactionType = (tx.type || "").toLowerCase();

//     console.log("Processing:", {
//       eventType,
//       amount: transactionAmount,
//       nombaFee,
//       reference: nombaTransactionId,
//       aliasAccountReference,
//       orderReference,
//     });

//     // ========== PRIORITY 1: SUBSCRIPTION BANK TRANSFERS ==========
//     const isSubscriptionBankTransfer = checkIfSubscriptionBankTransfer(aliasAccountReference, payload);
//     if (isSubscriptionBankTransfer && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("🏦 Processing subscription bank transfer...");
//       const result = await processSubscriptionBankTransfer(payload, {
//         nombaTransactionId,
//         aliasAccountReference,
//         transactionAmount,
//         customer,
//         tx,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 2: PAYMENT PAGE BANK TRANSFERS ==========
//     const isPaymentPageBankTransfer = aliasAccountReference?.startsWith("VA-PP-");
//     if (isPaymentPageBankTransfer && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("🏦 Processing payment page bank transfer...");
//       const result = await processPaymentPageBankTransfer(payload, {
//         nombaTransactionId,
//         nombaFee,
//         aliasAccountReference,
//         transactionAmount,
//         customer,
//         tx,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 3: SUBSCRIPTION CARD PAYMENTS ==========
//     const isSubscriptionCard = checkIfSubscriptionPayment(orderReference, payload);
//     if (isSubscriptionCard && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("💳 Processing subscription card payment...");
//       const result = await processSubscriptionPayment(payload, {
//         nombaTransactionId,
//         orderReference,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 4: REGULAR WALLET DEPOSITS ==========
//     const isRegularDeposit = await isRegularWalletDeposit(aliasAccountReference);
//     if (isRegularDeposit && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("💰 Processing regular wallet deposit via virtual account...");
//       const result = await processVirtualAccountDeposit(payload, {
//         aliasAccountReference,
//         nombaTransactionId,
//         transactionAmount,
//         nombaFee,
//         customer,
//         tx,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 5: PAYMENT PAGE CARD PAYMENTS ==========
//     const isPaymentPageCard = checkIfPaymentPagePayment(orderReference, payload);
//     if (isPaymentPageCard && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("💳 Processing payment page card payment...");
//       const result = await processPaymentPagePayment(payload, {
//         nombaTransactionId,
//         nombaFee,
//         orderReference,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 6: INVOICE PAYMENTS ==========
//     const isInvoicePayment = checkIfInvoicePayment(orderReference, payload);
//     if (isInvoicePayment && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("📄 Processing invoice payment...");
//       const result = await processInvoicePayment(payload, {
//         nombaTransactionId,
//         transactionAmount,
//         nombaFee,
//         orderReference,
//         customer,
//         tx,
//       }) as WebhookResponse;
      
//       if (result && "error" in result && result.error) {
//         if (!result.error.includes("not found")) {
//           const statusCode = result.status && typeof result.status === "number" ? result.status : 500;
//           return NextResponse.json({ error: result.error }, { status: statusCode });
//         }
//       } else if (result && "success" in result) {
//         return NextResponse.json(result);
//       }
//     }

//     // ========== PRIORITY 7: FALLBACK VIRTUAL ACCOUNT DEPOSIT ==========
//     if (aliasAccountReference && (eventType === "payment_success" || txStatus === "success")) {
//       console.log("🏦 Processing fallback virtual account deposit...");
//       const result = await processVirtualAccountDeposit(payload, {
//         aliasAccountReference,
//         nombaTransactionId,
//         transactionAmount,
//         nombaFee,
//         customer,
//         tx,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== WITHDRAWALS/TRANSFERS (PAYOUTS) ==========
//     const isPayout = eventType?.toLowerCase().includes("payout") ||
//       transactionType.includes("transfer") ||
//       transactionType.includes("payout");

//     if (isPayout) {
//       console.log("💸 Processing payout...");
//       const result = await processPayout(payload, {
//         nombaTransactionId,
//         eventType,
//         txStatus,
//         tx,
//       });
//       return handleErrorResponse(result);
//     }

//     console.log("ℹ️ Unhandled event type:", eventType);
//     return NextResponse.json({ message: "Event ignored" }, { status: 200 });

//   } catch (error: any) {
//     console.error("🔥 Webhook error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// function safeNum(v: any): number {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
//   const hasInvoiceMetadata = payload.data?.order?.metadata?.invoiceId ||
//     payload.data?.order?.metadata?.invoiceNumber ||
//     payload.data?.order?.callbackUrl?.includes("/api/invoice-payment-callback");

//   const isInvoiceReference = orderReference?.startsWith("INV-") || orderReference?.startsWith("INVOICE-");
//   const isSubscriptionRef = orderReference?.startsWith("SUB_");
//   const isPaymentPageRef = orderReference?.startsWith("PP-") || orderReference?.startsWith("P");

//   const result = (hasInvoiceMetadata || isInvoiceReference) && !isSubscriptionRef && !isPaymentPageRef;

//   if (result) console.log("📄 Detected invoice payment by:", { hasInvoiceMetadata, isInvoiceReference, orderReference });
//   return result;
// }


import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming JSON
    const body = await req.json();

    console.log("Webhook received:", body);


    return NextResponse.json(
      {
        success: true,
        message: "Webhook received",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook failed",
      },
      { status: 500 }
    );
  }
}