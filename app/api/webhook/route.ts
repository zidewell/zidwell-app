
// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { processInvoicePayment } from "./services/invoice-payment.service";
import { processVirtualAccountDeposit } from "./services/virtual-account.service";
import { processPayout } from "./services/payout.service";
import {
  processPaymentPagePayment,
  checkIfPaymentPagePayment,
  processPaymentPageBankTransfer,
  checkIfPaymentPageBankTransfer,
} from "./services/payment-page.service";

// Helper to check if this is a regular wallet deposit (user ID)
async function isRegularWalletDeposit(
  aliasAccountReference: string,
): Promise<boolean> {
  if (!aliasAccountReference) return false;

  // Check if it's a payment page virtual account (VA-PP- prefix)
  if (aliasAccountReference.startsWith("VA-PP-")) {
    return false;
  }

  // Check if it matches a user ID (UUID format)
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(aliasAccountReference)) {
    return false;
  }

  // Verify it's actually a user ID in the database
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
    const signature =
      req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

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
    const aliasAccountReference =
      tx.aliasAccountReference || tx.alias_account_reference;
    const transactionAmount = safeNum(
      tx.transactionAmount ?? tx.amount ?? order.amount ?? 0,
    );
    const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
    const txStatus = (tx.status || payload.data?.status || "")
      .toString()
      .toLowerCase();
    const transactionType = (tx.type || "").toLowerCase();

    console.log("Processing:", {
      eventType,
      amount: transactionAmount,
      nombaFee,
      reference: nombaTransactionId,
      aliasAccountReference,
      orderReference,
    });

    // SKIP SUBSCRIPTION PAYMENTS
    const isSubscription = checkIfSubscription(orderReference, payload, tx);
    if (isSubscription) {
      console.log(
        "📱 Subscription payment detected - skipping (handled by callback)",
      );
      return NextResponse.json({
        success: true,
        message: "Subscription payment handled by callback",
      });
    }

    // ========== PRIORITY 1: PAYMENT PAGE BANK TRANSFERS ==========
    // Must start with "VA-PP-" prefix - these are virtual accounts created FOR payment pages
    const isPaymentPageBankTransfer =
      aliasAccountReference?.startsWith("VA-PP-");

    if (
      isPaymentPageBankTransfer &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log(
        "🏦 Processing payment page bank transfer (VA-PP- pattern)...",
      );
      const result = await processPaymentPageBankTransfer(payload, {
        nombaTransactionId,
        nombaFee,
        aliasAccountReference,
        transactionAmount,
        customer,
        tx,
      });

      if ("error" in result) {
        const errorResult = result as { error: string; status?: number };
        const statusCode =
          errorResult.status && typeof errorResult.status === "number"
            ? errorResult.status
            : 500;
        return NextResponse.json(
          { error: errorResult.error },
          { status: statusCode },
        );
      }

      return NextResponse.json(result);
    }

    // ========== PRIORITY 2: REGULAR WALLET DEPOSITS (USER ID) ==========
    // Check if this is a regular wallet deposit where aliasAccountReference is a user ID
    const isRegularDeposit = await isRegularWalletDeposit(
      aliasAccountReference,
    );

    if (
      isRegularDeposit &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log(
        "💰 Processing regular wallet deposit via virtual account...",
      );
      const result = await processVirtualAccountDeposit(payload, {
        aliasAccountReference,
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        customer,
        tx,
      });

      if (result && "error" in result && result.error) {
        const errorResult = result as { error: string; status?: number };
        const statusCode =
          errorResult.status && typeof errorResult.status === "number"
            ? errorResult.status
            : 500;
        return NextResponse.json(
          { error: errorResult.error },
          { status: statusCode },
        );
      }

      return NextResponse.json(result);
    }

    // ========== PRIORITY 3: PAYMENT PAGE CARD PAYMENTS ==========
    const isPaymentPageCard = checkIfPaymentPagePayment(
      orderReference,
      payload,
    );

    if (
      isPaymentPageCard &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("💳 Processing payment page card payment...");
      const result = await processPaymentPagePayment(payload, {
        nombaTransactionId,
        nombaFee,
        orderReference,
      });

      if ("error" in result) {
        const errorResult = result as { error: string; status?: number };
        const statusCode =
          errorResult.status && typeof errorResult.status === "number"
            ? errorResult.status
            : 500;
        return NextResponse.json(
          { error: errorResult.error },
          { status: statusCode },
        );
      }

      return NextResponse.json(result);
    }

    // ========== PRIORITY 4: INVOICE PAYMENTS ==========
    const isInvoicePayment = checkIfInvoicePayment(orderReference, payload);
    if (
      isInvoicePayment &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("📄 Processing invoice payment...");
      const result = await processInvoicePayment(payload, {
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        orderReference,
        customer,
        tx,
      });

      if (result && "error" in result && result.error) {
        if (result.error.includes("not found")) {
          console.log("⚠️ Invoice not found, might be another payment type");
        } else {
          const errorResult = result as { error: string; status?: number };
          const statusCode =
            errorResult.status && typeof errorResult.status === "number"
              ? errorResult.status
              : 500;
          return NextResponse.json(
            { error: errorResult.error },
            { status: statusCode },
          );
        }
      } else if (result && "success" in result) {
        return NextResponse.json(result);
      }
    }

    // ========== PRIORITY 5: FALLBACK VIRTUAL ACCOUNT DEPOSIT ==========
    // If we have an aliasAccountReference and nothing else matched
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

      if (result && "error" in result && result.error) {
        const errorResult = result as { error: string; status?: number };
        const statusCode =
          errorResult.status && typeof errorResult.status === "number"
            ? errorResult.status
            : 500;
        return NextResponse.json(
          { error: errorResult.error },
          { status: statusCode },
        );
      }

      return NextResponse.json(result);
    }

    // ========== WITHDRAWALS/TRANSFERS (PAYOUTS) ==========
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

      if (result && "error" in result && result.error) {
        const errorResult = result as { error: string; status?: number };
        const statusCode =
          errorResult.status && typeof errorResult.status === "number"
            ? errorResult.status
            : 500;
        return NextResponse.json(
          { error: errorResult.error },
          { status: statusCode },
        );
      }

      return NextResponse.json(result);
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

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function checkIfSubscription(
  orderReference: string,
  payload: any,
  tx: any,
): boolean {
  return (
    orderReference?.startsWith("SUB_") ||
    orderReference?.includes("SUB-") ||
    payload.data?.order?.metadata?.type === "subscription" ||
    payload.data?.order?.metadata?.isSubscription === true ||
    payload.data?.metadata?.subscription === true ||
    tx.merchantTxRef?.includes("SUB-") ||
    tx.narration?.includes("SUB-")
  );
}

function checkIfInvoicePayment(orderReference: string, payload: any): boolean {
  const hasInvoiceMetadata =
    payload.data?.order?.metadata?.invoiceId ||
    payload.data?.order?.metadata?.invoiceNumber ||
    payload.data?.order?.callbackUrl?.includes("/api/invoice-payment-callback");

  const isInvoiceReference =
    orderReference?.startsWith("INV-") ||
    orderReference?.startsWith("INVOICE-");

  const isPaymentPageRef =
    orderReference?.startsWith("PP-") || orderReference?.startsWith("P");

  const result =
    (hasInvoiceMetadata || isInvoiceReference) && !isPaymentPageRef;

  if (result) {
    console.log("📄 Detected invoice payment by:", {
      hasInvoiceMetadata,
      isInvoiceReference,
      orderReference,
    });
  }

  return result;
}
