import { NextRequest, NextResponse } from "next/server";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { processInvoicePayment } from "./services/invoice-payment.service";
import { processVirtualAccountDeposit } from "./services/virtual-account.service";
import { processPayout } from "./services/payout.service";
import { processPaymentPagePayment, checkIfPaymentPagePayment } from "./services/payment-page.service"; // ADD THIS

export async function POST(req: NextRequest) {
  try {
    console.log("====== Nomba Webhook Received ======");

    const rawBody = await req.text();
    let payload;

    try {
      payload = JSON.parse(rawBody);
      console.log("Event type:", payload.event_type || payload.eventType);
    } catch (err) {
      console.error("Failed to parse JSON");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify signature
    const timestamp = req.headers.get("nomba-timestamp");
    const signature = req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      console.warn("Missing signature headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = await verifyNombaSignature(payload, timestamp, signature);
    if (!isValid) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Signature verified");

    const eventType = payload.event_type || payload.eventType;
    const tx = payload.data?.transaction || {};
    const order = payload.data?.order || {};
    const customer = payload.data?.customer || {};

    const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
    const orderReference = order.orderReference;
    const aliasAccountReference = tx.aliasAccountReference || tx.alias_account_reference;
    const transactionAmount = safeNum(tx.transactionAmount ?? tx.amount ?? order.amount ?? 0);
    const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatus = (tx.status || payload.data?.status || "").toString().toLowerCase();
    const transactionType = (tx.type || "").toLowerCase();

    console.log("Processing:", { eventType, amount: transactionAmount, nombaFee, reference: nombaTransactionId });

    // SKIP SUBSCRIPTION PAYMENTS
    const isSubscription = checkIfSubscription(orderReference, payload, tx);
    if (isSubscription) {
      console.log("📱 Subscription payment detected - skipping (handled by callback)");
      return NextResponse.json({ success: true, message: "Subscription payment handled by callback" });
    }

    // ========== 1. PAYMENT PAGE PAYMENTS (ADD THIS - PUT IT FIRST) ==========
    const isPaymentPage = checkIfPaymentPagePayment(orderReference, payload);
    
    if (isPaymentPage && (eventType === "payment_success" || txStatus === "success")) {
      const result = await processPaymentPagePayment(payload, {
        nombaTransactionId,
        nombaFee,
        orderReference,
      });
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }
      
      return NextResponse.json(result);
    }

    // ========== 2. INVOICE PAYMENTS ==========
    const isInvoicePayment = checkIfInvoicePayment(orderReference, payload);
    if (isInvoicePayment && (eventType === "payment_success" || txStatus === "success")) {
      const result = await processInvoicePayment(payload, {
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        orderReference,
        customer,
        tx
      });
      return NextResponse.json(result);
    }

    // ========== 3. VIRTUAL ACCOUNT DEPOSITS ==========
    if (aliasAccountReference && (eventType === "payment_success" || txStatus === "success")) {
      const result = await processVirtualAccountDeposit(payload, {
        aliasAccountReference,
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        customer,
        tx
      });
      return NextResponse.json(result);
    }

    // ========== 4. WITHDRAWALS/TRANSFERS (PAYOUTS) ==========
    const isPayout = eventType?.toLowerCase().includes("payout") ||
      transactionType.includes("transfer") ||
      transactionType.includes("payout");

    if (isPayout) {
      const result = await processPayout(payload, {
        nombaTransactionId,
        eventType,
        txStatus,
        tx
      });
      return NextResponse.json(result);
    }

    console.log("ℹ️ Unhandled event type:", eventType);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function checkIfSubscription(orderReference: string, payload: any, tx: any): boolean {
  return orderReference?.startsWith("SUB_") ||
    orderReference?.includes("SUB-") ||
    payload.data?.order?.metadata?.type === "subscription" ||
    payload.data?.order?.metadata?.isSubscription === true ||
    payload.data?.metadata?.subscription === true ||
    tx.merchantTxRef?.includes("SUB-") ||
    tx.narration?.includes("SUB-");
}

function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
  return orderReference ||
    payload.data?.order?.callbackUrl?.includes("/api/invoice-payment-callback") ||
    payload.data?.order?.metadata?.invoiceId;
}