// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { handlePayoutWebhook } from "./services/payout.service";
import { handleVirtualAccountDeposit } from "./services/virtual-account.service";
import { handleInvoicePayment } from "./services/invoice-payment.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ============================================================
    // STEP 1: Read body exactly ONCE as text
    // ============================================================
    const rawBody = await req.text();

    if (!rawBody || rawBody.length === 0) {
      console.error("[webhook] Empty body received");
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    // ============================================================
    // STEP 2: Extract signature headers (accept multiple possible names)
    // ============================================================
    const signature =
      req.headers.get("nomba-signature") ||
      req.headers.get("nomba-webhook-signature") ||
      req.headers.get("x-nomba-signature") ||
      "";

    const timestamp =
      req.headers.get("nomba-timestamp") ||
      req.headers.get("x-nomba-timestamp") ||
      "";

    // Debug: log all incoming headers so you can see what Nomba sends
    console.log("[webhook] === INCOMING HEADERS ===");
    req.headers.forEach((v, k) => {
      console.log(`[webhook]   ${k}: ${v.substring(0, 120)}`);
    });
    console.log("[webhook] Raw body length:", rawBody.length);
    console.log("[webhook] Raw body preview:", rawBody.substring(0, 300));

    // ============================================================
    // STEP 3: Parse JSON (before verification — helper needs object)
    // ============================================================
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("[webhook] Invalid JSON body:", parseErr);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!signature) {
      console.error("[webhook] ❌ Missing signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 }
      );
    }

    // ============================================================
    // STEP 4: Verify signature
    // ============================================================
    const isValid = await verifyNombaSignature(payload, timestamp, signature);

    if (!isValid) {
      console.error("[webhook] ❌ Signature verification FAILED");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("[webhook] ✅ Signature valid");

    // ============================================================
    // STEP 5: Extract event details
    // ============================================================
    const eventType: string =
      payload?.event_type || payload?.eventType || payload?.type || "";

    const tx = payload?.data?.transaction || {};
    const merchant = payload?.data?.merchant || {};
    const data = payload?.data || {};

    // ============================================================
    // STEP 6: Extract stable transaction ID
    // ============================================================
    const nombaTransactionId: string | undefined =
      tx?.transactionId ||
      tx?.transaction_id ||
      tx?.id ||
      tx?.reference ||
      data?.nomba_transaction_id ||
      payload?.requestId;

    if (!nombaTransactionId) {
      console.error("[webhook] Missing transaction ID in payload", {
        eventType,
        payloadKeys: Object.keys(payload || {}),
      });
      return NextResponse.json(
        { error: "Webhook missing transaction identifier" },
        { status: 400 }
      );
    }

    console.log(
      `[webhook] event=${eventType} txId=${nombaTransactionId} userId=${
        merchant.userId || "?"
      }`
    );

    // ============================================================
    // STEP 7: Replay protection — check if already processed
    // ============================================================
    const { data: existingWebhook, error: existingError } = await supabase
      .from("processed_webhooks")
      .select("id")
      .eq("nomba_transaction_id", nombaTransactionId)
      .maybeSingle();

    if (existingError) {
      console.error("[webhook] Dedupe lookup failed:", existingError);
      return NextResponse.json(
        { error: "Webhook dedupe error" },
        { status: 500 }
      );
    }

    if (existingWebhook) {
      console.log(
        `[webhook] ${nombaTransactionId} already processed — skipping`
      );
      return NextResponse.json({
        success: true,
        message: "Webhook already processed",
      });
    }

    // ============================================================
    // STEP 8: Atomic claim — prevents concurrent duplicate deliveries
    // ============================================================
    const { error: claimError } = await supabase
      .from("processed_webhooks")
      .insert({
        nomba_transaction_id: nombaTransactionId,
        event_type: eventType,
        payload,
      });

    if (claimError) {
      // Unique constraint violation = another request beat us to it
      if (claimError.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Webhook already processed",
        });
      }
      console.error("[webhook] Claim failed:", claimError);
      return NextResponse.json(
        { error: "Webhook processing error" },
        { status: 500 }
      );
    }

    // ============================================================
    // STEP 9: Dispatch business logic
    // ============================================================
    try {
      switch (eventType) {
        // ----- Payouts -----
        case "payout.success":
        case "payout.failed":
        case "transfer.success":
        case "transfer.failed": {
          const pendingTxId =
            tx?.pending_transaction_id ||
            data?.pending_transaction_id ||
            merchant?.pending_transaction_id;

          if (pendingTxId) {
            const isSuccess =
              eventType.endsWith(".success") ||
              tx?.responseCode === "00" ||
              String(tx?.status || "").toUpperCase() === "SUCCESS";

            const result = await handlePayoutWebhook({
              pendingTxId,
              success: isSuccess,
              nombaTransactionId,
              nombaFee: Number(tx?.fee || 0),
              failureReason:
                tx?.failure_reason || tx?.responseMessage || undefined,
            });
            if (!result.ok) {
              console.error("[webhook] Payout handler failed:", result.message);
            }
          } else {
            console.warn(
              "[webhook] Payout event has no pending_transaction_id — skipping"
            );
          }
          break;
        }

        // ----- Virtual account deposits -----
        case "virtual_account.deposit":
        case "virtual_account.credit":
        case "deposit.success": {
          const userId = tx?.userId || data?.userId || merchant?.userId;
          const amount = Number(tx?.amount || data?.amount || 0);
          if (userId && amount > 0) {
            const result = await handleVirtualAccountDeposit({
              userId,
              netAmount: Number(tx?.net_amount || tx?.netAmount || amount),
              grossAmount: amount,
              nombaFee: Number(tx?.fee || 0),
              nombaTransactionId,
              senderName: tx?.sender_name || data?.senderName,
              senderBank: tx?.sender_bank || data?.senderBank,
              narration: tx?.narration || data?.narration,
            });
            if (!result.ok) {
              console.error(
                "[webhook] VA deposit handler failed:",
                result.message
              );
            }
          } else {
            console.warn(
              "[webhook] VA deposit event missing userId or amount — skipping"
            );
          }
          break;
        }

        // ----- Invoice payments -----
        case "invoice.payment":
        case "invoice.paid":
        case "payment.success": {
          const userId = tx?.userId || data?.userId || merchant?.userId;
          const invoiceId = tx?.invoice_id || data?.invoice_id;
          const amount = Number(tx?.amount || data?.amount || 0);
          if (userId && invoiceId && amount > 0) {
            const result = await handleInvoicePayment({
              userId,
              amount,
              transactionReference: nombaTransactionId,
              invoiceId,
              invoiceReference:
                tx?.invoice_reference || data?.invoice_reference,
              payerEmail: tx?.payer_email || data?.payerEmail,
              externalResponse: { payload },
            });
            if (!result.ok) {
              console.error(
                "[webhook] Invoice payment handler failed:",
                result.message
              );
            }
          } else {
            console.warn(
              "[webhook] Invoice event missing userId/invoiceId/amount — skipping"
            );
          }
          break;
        }

        default:
          console.log(`[webhook] Unhandled event type: "${eventType}"`);
      }
    } catch (handlerError: any) {
      // Non-fatal: row already claimed. Ops can reconcile manually.
      console.error("[webhook] Handler threw:", handlerError);
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("[webhook] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}