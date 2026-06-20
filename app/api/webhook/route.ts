
// // app/api/webhook/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { verifyNombaSignature } from "./helpers/signature-verification";
// import { processInvoicePayment } from "./services/invoice-payment.service";
// import { processVirtualAccountDeposit } from "./services/virtual-account.service";
// import { processPayout } from "./services/payout.service";
// import {
//   processPaymentPageVirtualAccount,
//   checkIfPaymentPageVirtualAccount,
// } from "./services/payment-page.service";
// import {
//   processSubscriptionPayment,
//   processSubscriptionBankTransfer,
//   checkIfSubscriptionPayment,
//   checkIfSubscriptionBankTransfer,
// } from "./services/subscription-service";

// type WebhookResponse =
//   | {
//       success: boolean;
//       message?: string;
//       subscription_id?: string;
//       credited_amount?: number;
//       new_balance?: number | null;
//       payment_id?: string;
//     }
//   | { error: string; status?: number };

// async function isRegularWalletDeposit(aliasAccountReference: string): Promise<boolean> {
//   if (!aliasAccountReference) return false;
  
//   // Skip special prefixes - PPL is for payment pages
//   if (aliasAccountReference.startsWith("PPL")) return false;
//   if (aliasAccountReference.startsWith("VA-PP-")) return false;
//   if (aliasAccountReference.startsWith("VA-SUB-")) return false;

//   // Check if it's a valid UUID (regular wallet deposit)
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

// function handleErrorResponse(result: any): NextResponse {
//   if (result && "error" in result && result.error) {
//     const statusCode =
//       result.status && typeof result.status === "number" ? result.status : 500;
//     return NextResponse.json({ error: result.error }, { status: statusCode });
//   }
//   return NextResponse.json(result);
// }

// function safeNum(v: any): number {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
//   const hasInvoiceMetadata =
//     payload.data?.order?.metadata?.invoiceId ||
//     payload.data?.order?.metadata?.invoiceNumber;
//   const isInvoiceReference =
//     orderReference?.startsWith("INV-") ||
//     orderReference?.startsWith("INVOICE-");
//   const isSubscriptionRef = orderReference?.startsWith("SUB_");
//   const isPaymentPageRef =
//     orderReference?.startsWith("PP-") || orderReference?.startsWith("P");

//   return (
//     (hasInvoiceMetadata || isInvoiceReference) &&
//     !isSubscriptionRef &&
//     !isPaymentPageRef
//   );
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
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     // Verify signature
//     const timestamp = req.headers.get("nomba-timestamp");
//     const signature =
//       req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

//     if (!timestamp || !signature) {
//       return NextResponse.json({ error: "Missing signature" }, { status: 401 });
//     }

//     const isValid = await verifyNombaSignature(payload, timestamp, signature);
//     if (!isValid) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     const eventType = payload.event_type || payload.eventType;
//     const tx = payload.data?.transaction || {};
//     const order = payload.data?.order || {};
//     const customer = payload.data?.customer || {};

//     const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
//     const orderReference = order.orderReference;
//     const aliasAccountReference =
//       tx.aliasAccountReference || tx.alias_account_reference;
//     const transactionAmount = safeNum(
//       tx.transactionAmount ?? tx.amount ?? order.amount ?? 0,
//     );
//     const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
//     const txStatus = (tx.status || payload.data?.status || "")
//       .toString()
//       .toLowerCase();

//     console.log("Processing:", {
//       eventType,
//       amount: transactionAmount,
//       aliasAccountReference,
//     });

//     function extractTransferReference(tx: any): string | null {
//       const narration = tx.narration || tx.reference || "";

//       // Try multiple patterns to match the transfer reference
//       const patterns = [
//         /PPL[A-Za-z0-9]+/, // PPL... format (used in frontend)
//         /PPL_[A-Za-z0-9]+/, // PPL_... format
//         /PPL-[A-Za-z0-9]+/, // PPL-... format
//         /PPL[A-Za-z0-9]+/, // PPL... format
//       ];

//       for (const pattern of patterns) {
//         const match = narration.match(pattern);
//         if (match) {
//           console.log(
//             `✅ Extracted transfer reference: ${match[0]} from pattern ${pattern}`,
//           );
//           return match[0];
//         }
//       }

//       // Also check if the narration itself contains a reference
//       if (narration && narration.length > 20) {
//         console.log(
//           `⚠️ Using full narration as fallback reference: ${narration.substring(0, 30)}...`,
//         );
//         return narration;
//       }

//       return null;
//     }
//     const transferReference = extractTransferReference(tx);

//     // ========== PRIORITY 1: PAYMENT PAGE VIRTUAL ACCOUNT (PP- prefix) ==========
//     const isPaymentPageVA = checkIfPaymentPageVirtualAccount(
//       aliasAccountReference,
//     );
//     if (
//       isPaymentPageVA &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("🏦 Processing payment page virtual account...");
//       const result = await processPaymentPageVirtualAccount(payload, {
//         nombaTransactionId,
//         nombaFee,
//         aliasAccountReference,
//         transactionAmount,
//         customer,
//         tx,
//         transferReference,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 2: SUBSCRIPTION BANK TRANSFERS ==========
//     const isSubscriptionBankTransfer = checkIfSubscriptionBankTransfer(
//       aliasAccountReference,
//       payload,
//     );
//     if (
//       isSubscriptionBankTransfer &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
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

//     // ========== PRIORITY 3: SUBSCRIPTION CARD PAYMENTS ==========
//     const isSubscriptionCard = checkIfSubscriptionPayment(
//       orderReference,
//       payload,
//     );
//     if (
//       isSubscriptionCard &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("💳 Processing subscription card payment...");
//       const result = await processSubscriptionPayment(payload, {
//         nombaTransactionId,
//         orderReference,
//       });
//       return handleErrorResponse(result);
//     }

//     // ========== PRIORITY 4: REGULAR WALLET DEPOSITS ==========
//     const isRegularDeposit = await isRegularWalletDeposit(
//       aliasAccountReference,
//     );
//     if (
//       isRegularDeposit &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("💰 Processing wallet deposit...");
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

//     // ========== PRIORITY 5: INVOICE PAYMENTS ==========
//     const isInvoicePayment = checkIfInvoicePayment(orderReference, payload);
//     if (
//       isInvoicePayment &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("📄 Processing invoice payment...");
//       const result = (await processInvoicePayment(payload, {
//         nombaTransactionId,
//         transactionAmount,
//         nombaFee,
//         orderReference,
//         customer,
//         tx,
//       })) as WebhookResponse;

//       if (result && "error" in result && result.error) {
//         if (!result.error.includes("not found")) {
//           const statusCode = result.status || 500;
//           return NextResponse.json(
//             { error: result.error },
//             { status: statusCode },
//           );
//         }
//       } else if (result && "success" in result) {
//         return NextResponse.json(result);
//       }
//     }

//     // ========== PRIORITY 6: FALLBACK VIRTUAL ACCOUNT DEPOSIT ==========
//     if (
//       aliasAccountReference &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
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
//     const transactionType = (tx.type || "").toLowerCase();
//     const isPayout =
//       eventType?.toLowerCase().includes("payout") ||
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
//       { status: 500 },
//     );
//   }
// }



// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { processInvoicePayment } from "./services/invoice-payment.service";
import { processVirtualAccountDeposit } from "./services/virtual-account.service";
import { processPayout } from "./services/payout.service";
import {
  processPaymentPageVirtualAccount,
  checkIfPaymentPageVirtualAccount,
} from "./services/payment-page.service";
import {
  processSubscriptionPayment,
  processSubscriptionBankTransfer,
  checkIfSubscriptionPayment,
  checkIfSubscriptionBankTransfer,
} from "./services/subscription-service";
import { processCardPaymentWebhook } from "./services/card-payment.service";

type WebhookResponse =
  | {
      success: boolean;
      message?: string;
      subscription_id?: string;
      credited_amount?: number;
      new_balance?: number | null;
      payment_id?: string;
    }
  | { error: string; status?: number };

async function isRegularWalletDeposit(aliasAccountReference: string): Promise<boolean> {
  if (!aliasAccountReference) return false;
  
  // Skip special prefixes - PPL is for payment pages
  if (aliasAccountReference.startsWith("PPL")) return false;
  if (aliasAccountReference.startsWith("VA-PP-")) return false;
  if (aliasAccountReference.startsWith("VA-SUB-")) return false;

  // Check if it's a valid UUID (regular wallet deposit)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(aliasAccountReference)) return false;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", aliasAccountReference)
    .single();

  return !!user;
}

function handleErrorResponse(result: any): NextResponse {
  if (result && "error" in result && result.error) {
    const statusCode =
      result.status && typeof result.status === "number" ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }
  return NextResponse.json(result);
}

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
  const hasInvoiceMetadata =
    payload.data?.order?.metadata?.invoiceId ||
    payload.data?.order?.metadata?.invoiceNumber;
  const isInvoiceReference =
    orderReference?.startsWith("INV-") ||
    orderReference?.startsWith("INVOICE-");
  const isSubscriptionRef = orderReference?.startsWith("SUB_");
  const isPaymentPageRef =
    orderReference?.startsWith("PP-") || orderReference?.startsWith("P");

  return (
    (hasInvoiceMetadata || isInvoiceReference) &&
    !isSubscriptionRef &&
    !isPaymentPageRef
  );
}

// ============================================================
// HELPER: Check if this is a card payment
// ============================================================
function checkIfCardPayment(orderReference: string, payload: any): boolean {
  // Check if orderReference starts with CARD-
  if (orderReference?.startsWith("CARD-")) {
    return true;
  }
  
  // Check metadata for card payment indicator
  const metadata = payload.data?.order?.metadata || {};
  if (metadata.type === "payment_page" && metadata.paymentMethod === "card") {
    return true;
  }
  
  // Check if the order has allowedPaymentMethods containing Card
  const allowedMethods = payload.data?.order?.allowedPaymentMethods || [];
  if (allowedMethods.includes("Card") && !payload.data?.order?.virtualAccount) {
    return true;
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  try {
    console.log("====== Nomba Webhook Received ======");

    const rawBody = await req.text();
    let payload;

    try {
      payload = JSON.parse(rawBody);
      console.log("Event type:", payload.event_type || payload.eventType);
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify signature
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = await verifyNombaSignature(payload, timestamp, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventType = payload.event_type || payload.eventType;
    const tx = payload.data?.transaction || {};
    const order = payload.data?.order || {};
    const customer = payload.data?.customer || {};

    const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
    const orderReference = order.orderReference;
    const aliasAccountReference =
      tx.aliasAccountReference || tx.alias_account_reference;
    const transactionAmount = safeNum(
      tx.transactionAmount ?? tx.amount ?? order.amount ?? 0,
    );
    const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatus = (tx.status || payload.data?.status || "")
      .toString()
      .toLowerCase();

    console.log("Processing:", {
      eventType,
      amount: transactionAmount,
      aliasAccountReference,
      orderReference,
    });

    // ============================================================
    // PRIORITY 0: CARD PAYMENTS (by orderReference)
    // ============================================================
    const isCardPayment = checkIfCardPayment(orderReference, payload);
    
    if (isCardPayment && (eventType === "payment_success" || txStatus === "success")) {
      console.log("💳 Processing card payment by order reference...");
      
      // Find the pending payment by order_reference
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      
      const { data: payment, error: paymentError } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("order_reference", orderReference)
        .eq("status", "pending")
        .maybeSingle();

      if (paymentError || !payment) {
        console.error("❌ Card payment not found for order reference:", orderReference);
        // Check if already completed
        const { data: completedPayment } = await supabase
          .from("payment_page_payments")
          .select("*, payment_pages(*)")
          .eq("order_reference", orderReference)
          .eq("status", "completed")
          .maybeSingle();
        
        if (completedPayment) {
          console.log("✅ Card payment already completed:", completedPayment.id);
          return NextResponse.json({ 
            success: true, 
            message: "Payment already processed",
            payment_id: completedPayment.id 
          });
        }
        
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      console.log("✅ Found pending card payment:", payment.id);
      console.log("   Customer:", payment.customer_name);
      console.log("   Amount:", payment.amount);

      const result = await processCardPaymentWebhook(payload, {
        nombaTransactionId,
        orderReference,
        payment,
      });
      
      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 1: PAYMENT PAGE VIRTUAL ACCOUNT (PP- prefix)
    // ============================================================
    const isPaymentPageVA = checkIfPaymentPageVirtualAccount(
      aliasAccountReference,
    );
    
    if (
      isPaymentPageVA &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("🏦 Processing payment page virtual account...");
      
      function extractTransferReference(tx: any): string | null {
        const narration = tx.narration || tx.reference || "";
        const patterns = [
          /PPL[A-Za-z0-9]+/,
          /PPL_[A-Za-z0-9]+/,
          /PPL-[A-Za-z0-9]+/,
        ];
        for (const pattern of patterns) {
          const match = narration.match(pattern);
          if (match) {
            console.log(`✅ Extracted transfer reference: ${match[0]}`);
            return match[0];
          }
        }
        if (narration && narration.length > 20) {
          console.log(`⚠️ Using full narration as fallback: ${narration.substring(0, 30)}...`);
          return narration;
        }
        return null;
      }
      
      const transferReference = extractTransferReference(tx);
      
      const result = await processPaymentPageVirtualAccount(payload, {
        nombaTransactionId,
        nombaFee,
        aliasAccountReference,
        transactionAmount,
        customer,
        tx,
        transferReference,
      });
      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 2: SUBSCRIPTION BANK TRANSFERS
    // ============================================================
    const isSubscriptionBankTransfer = checkIfSubscriptionBankTransfer(
      aliasAccountReference,
      payload,
    );
    if (
      isSubscriptionBankTransfer &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("🏦 Processing subscription bank transfer...");
      const result = await processSubscriptionBankTransfer(payload, {
        nombaTransactionId,
        aliasAccountReference,
        transactionAmount,
        customer,
        tx,
      });
      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 3: SUBSCRIPTION CARD PAYMENTS
    // ============================================================
    const isSubscriptionCard = checkIfSubscriptionPayment(
      orderReference,
      payload,
    );
    if (
      isSubscriptionCard &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("💳 Processing subscription card payment...");
      const result = await processSubscriptionPayment(payload, {
        nombaTransactionId,
        orderReference,
      });
      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 4: REGULAR WALLET DEPOSITS
    // ============================================================
    const isRegularDeposit = await isRegularWalletDeposit(
      aliasAccountReference,
    );
    if (
      isRegularDeposit &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("💰 Processing wallet deposit...");
      const result = await processVirtualAccountDeposit(payload, {
        aliasAccountReference,
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        customer,
        tx,
      });
      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 5: INVOICE PAYMENTS
    // ============================================================
    const isInvoicePayment = checkIfInvoicePayment(orderReference, payload);
    if (
      isInvoicePayment &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("📄 Processing invoice payment...");
      const result = (await processInvoicePayment(payload, {
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        orderReference,
        customer,
        tx,
      })) as WebhookResponse;

      if (result && "error" in result && result.error) {
        if (!result.error.includes("not found")) {
          const statusCode = result.status || 500;
          return NextResponse.json(
            { error: result.error },
            { status: statusCode },
          );
        }
      } else if (result && "success" in result) {
        return NextResponse.json(result);
      }
    }

    // ============================================================
    // PRIORITY 6: FALLBACK VIRTUAL ACCOUNT DEPOSIT
    // ============================================================
    if (
      aliasAccountReference &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("🏦 Processing fallback virtual account deposit...");
      const result = await processVirtualAccountDeposit(payload, {
        aliasAccountReference,
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        customer,
        tx,
      });
      return handleErrorResponse(result);
    }

    // ============================================================
    // WITHDRAWALS/TRANSFERS (PAYOUTS)
    // ============================================================
    const transactionType = (tx.type || "").toLowerCase();
    const isPayout =
      eventType?.toLowerCase().includes("payout") ||
      transactionType.includes("transfer") ||
      transactionType.includes("payout");

    if (isPayout) {
      console.log("💸 Processing payout...");
      const result = await processPayout(payload, {
        nombaTransactionId,
        eventType,
        txStatus,
        tx,
      });
      return handleErrorResponse(result);
    }

    console.log("ℹ️ Unhandled event type:", eventType);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}