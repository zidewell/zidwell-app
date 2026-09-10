// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { processInvoicePayment } from "./services/invoice-payment.service";
import { processVirtualAccountDeposit } from "./services/virtual-account.service";
import { processPayout } from "./services/payout.service";
import {
  processSubscriptionPayment,
  processSubscriptionBankTransfer,
  checkIfSubscriptionPayment,
  checkIfSubscriptionBankTransfer,
} from "./services/subscription-service";
import { processCardPaymentWebhook } from "./services/card-payment.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// ============================================================
// CHECK IF STORE ACTIVATION PAYMENT
// ============================================================
function checkIfStoreActivationPayment(
  orderReference: string,
  payload: any
): boolean {
  if (orderReference?.startsWith("ACT-")) {
    return true;
  }

  const metadata = payload.data?.order?.metadata || {};
  if (metadata.type === "store_activation") {
    return true;
  }

  return false;
}

// ============================================================
// REGULAR WALLET DEPOSIT CHECK
// ============================================================
async function isRegularWalletDeposit(
  aliasAccountReference: string
): Promise<boolean> {
  if (!aliasAccountReference) return false;

  if (aliasAccountReference.startsWith("VA-SUB-")) return false;
  if (aliasAccountReference.startsWith("VA-PP-")) return false;
  if (aliasAccountReference.startsWith("PPL")) return false;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(aliasAccountReference)) return false;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", aliasAccountReference)
    .single();

  return !!user;
}

// ============================================================
// CARD PAYMENT CHECK
// ============================================================
function checkIfCardPayment(orderReference: string, payload: any): boolean {
  if (orderReference?.startsWith("CARD-")) {
    return true;
  }

  const metadata = payload.data?.order?.metadata || {};
  if (metadata.type === "payment_page" && metadata.paymentMethod === "card") {
    return true;
  }

  const allowedMethods = payload.data?.order?.allowedPaymentMethods || [];
  if (allowedMethods.includes("Card") && !payload.data?.order?.virtualAccount) {
    return true;
  }

  return false;
}

// ============================================================
// INVOICE PAYMENT CHECK
// ============================================================
function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
  const hasInvoiceMetadata =
    payload.data?.order?.metadata?.invoiceId ||
    payload.data?.order?.metadata?.invoiceNumber;
  const isInvoiceReference =
    orderReference?.startsWith("INV-") ||
    orderReference?.startsWith("INVOICE-");
  const isSubscriptionRef = orderReference?.startsWith("SUB_");

  return (hasInvoiceMetadata || isInvoiceReference) && !isSubscriptionRef;
}

// ============================================================
// SAFE NUMBER PARSING
// ============================================================
function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ============================================================
// HANDLE ERROR RESPONSE
// ============================================================
function handleErrorResponse(result: any): NextResponse {
  if (result && "error" in result && result.error) {
    const statusCode =
      result.status && typeof result.status === "number" ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }
  return NextResponse.json(result);
}

// ============================================================
// MAIN WEBHOOK HANDLER
// ============================================================
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
      tx.transactionAmount ?? tx.amount ?? order.amount ?? 0
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
    // PRIORITY 0: STORE ACTIVATION PAYMENT
    // ============================================================
    const isStoreActivation = checkIfStoreActivationPayment(
      orderReference,
      payload
    );

    if (
      isStoreActivation &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("Processing store activation payment...");

      // Find the payment record
      const { data: payment, error: paymentError } = await supabase
        .from("store_activation_payments")
        .select("*")
        .eq("order_reference", orderReference)
        .eq("status", "pending")
        .maybeSingle();

      if (paymentError || !payment) {
        console.error("Store activation payment not found:", orderReference);

        const { data: completedPayment } = await supabase
          .from("store_activation_payments")
          .select("*")
          .eq("order_reference", orderReference)
          .eq("status", "completed")
          .maybeSingle();

        if (completedPayment) {
          console.log("Store activation already completed");
          return NextResponse.json({
            success: true,
            message: "Already processed",
            payment_id: completedPayment.id,
          });
        }

        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      console.log("Found store activation payment:", payment.id);

      // ============================================================
      // ✅ STEP 1: Mark payment as completed FIRST
      // If this fails, we abort so the store never activates without
      // a matching completed payment record.
      // ============================================================
      const { error: paymentUpdateError } = await supabase
        .from("store_activation_payments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          nomba_transaction_id: nombaTransactionId,
        })
        .eq("id", payment.id);

      if (paymentUpdateError) {
        console.error(
          "❌ Failed to update store activation payment:",
          paymentUpdateError
        );
        return NextResponse.json(
          { error: "Failed to update payment status" },
          { status: 500 }
        );
      }

      console.log("✅ Payment marked completed:", payment.id);

      // ============================================================
      // ✅ STEP 2: Activate the store
      // ============================================================
      const { error: storeUpdateError } = await supabase
        .from("online_stores")
        .update({
          is_active: true,
          activation_paid: true,
          activated_at: new Date().toISOString(),
          activation_reference: payment.reference,
        })
        .eq("id", payment.store_id);

      if (storeUpdateError) {
        console.error("❌ Failed to activate store:", storeUpdateError);
        // Roll back payment status so it can be retried
        await supabase
          .from("store_activation_payments")
          .update({
            status: "pending",
            completed_at: null,
            paid_at: null,
            nomba_transaction_id: null,
          })
          .eq("id", payment.id);

        return NextResponse.json(
          { error: "Failed to activate store" },
          { status: 500 }
        );
      }

      console.log("✅ Store activated:", payment.store_id);

      // ============================================================
      // ✅ STEP 3: Clear create draft (best-effort)
      // ============================================================
      try {
        const { error: draftDeleteError } = await supabase
          .from("store_create_drafts")
          .delete()
          .eq("user_id", payment.user_id);

        if (draftDeleteError) {
          console.error(
            "Failed to delete create draft on activation:",
            draftDeleteError
          );
        } else {
          console.log("Create draft cleared for user:", payment.user_id);
        }
      } catch (draftErr) {
        console.error("Unexpected error clearing create draft:", draftErr);
      }

      // ============================================================
      // ✅ STEP 4: Ensure store owner wallet exists
      // ============================================================
      const { data: existingWallet } = await supabase
        .from("store_owner_wallets")
        .select("id")
        .eq("user_id", payment.user_id)
        .maybeSingle();

      if (!existingWallet) {
        const { error: walletInsertError } = await supabase
          .from("store_owner_wallets")
          .insert({
            user_id: payment.user_id,
            store_id: payment.store_id,
            available_balance: 0,
            pending_balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            last_activity_at: new Date().toISOString(),
          });

        if (walletInsertError) {
          console.error("Failed to create store owner wallet:", walletInsertError);
        } else {
          console.log("✅ Store owner wallet created");
        }
      }

      console.log("✅ Store activation completed");

      return NextResponse.json({
        success: true,
        message: "Store activated successfully",
        payment_id: payment.id,
      });
    }

    // ============================================================
    // PRIORITY 1: CARD PAYMENTS (Payment Pages)
    // ============================================================
    const isCardPayment = checkIfCardPayment(orderReference, payload);

    if (
      isCardPayment &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("Processing card payment...");

      const { data: payment, error: paymentError } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("order_reference", orderReference)
        .eq("status", "pending")
        .maybeSingle();

      if (paymentError || !payment) {
        console.error(
          "Card payment not found for order reference:",
          orderReference
        );
        const { data: completedPayment } = await supabase
          .from("payment_page_payments")
          .select("*, payment_pages(*)")
          .eq("order_reference", orderReference)
          .eq("status", "completed")
          .maybeSingle();

        if (completedPayment) {
          console.log("Card payment already completed:", completedPayment.id);
          return NextResponse.json({
            success: true,
            message: "Payment already processed",
            payment_id: completedPayment.id,
          });
        }

        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      console.log("Found pending card payment:", payment.id);

      const result = await processCardPaymentWebhook(payload, {
        nombaTransactionId,
        orderReference,
        payment,
      });

      return handleErrorResponse(result);
    }

    // ============================================================
    // PRIORITY 2: SUBSCRIPTION BANK TRANSFERS
    // ============================================================
    const isSubscriptionBankTransfer = checkIfSubscriptionBankTransfer(
      aliasAccountReference,
      payload
    );
    if (
      isSubscriptionBankTransfer &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("Processing subscription bank transfer...");
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
      payload
    );
    if (
      isSubscriptionCard &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("Processing subscription card payment...");
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
      aliasAccountReference
    );
    if (
      isRegularDeposit &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("Processing wallet deposit...");
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
      console.log("Processing invoice payment...");
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
            { status: statusCode }
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
      console.log("Processing fallback virtual account deposit...");
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
      console.log("Processing payout...");
      const result = await processPayout(payload, {
        nombaTransactionId,
        eventType,
        txStatus,
        tx,
      });
      return handleErrorResponse(result);
    }

    console.log("Unhandled event type:", eventType);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



// export async function POST(req: Request) {
//   const timestamp = req.headers.get("nomba-timestamp");
//   const signature = req.headers.get("nomba-sig-value");

//   // ✅ TEMP: Allow missing headers only for initial verification
//   if (!timestamp || !signature) {
//     console.log("Nomba initial webhook verification ping — allowing");
//     return new Response(JSON.stringify({ verified: true }), { status: 200 });
//   }

//   // 🔐 Normal processing for real events
//   const body = await req.json();
//   console.log("Nomba Webhook Triggered", body);

//   return new Response(JSON.stringify({ received: true }), { status: 200 });
// }
