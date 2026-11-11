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
    // 1️⃣ Signature verification
    const signature = req.headers.get("nomba-signature") || "";
    const timestamp = req.headers.get("nomba-timestamp") || "";
    const rawBody = await req.text();

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    const isValid = await verifyNombaSignature(rawBody, timestamp, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2️⃣ Parse body
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType: string = payload?.event_type || payload?.eventType || "";
    const data = payload?.data || {};
    const tx = data?.transaction || data?.payment || data || {};

    // 3️⃣ Extract stable transaction ID
    const nombaTransactionId: string | undefined =
      tx?.transactionId ||
      tx?.transaction_id ||
      tx?.id ||
      tx?.reference ||
      payload?.requestId ||
      data?.reference;

    if (!nombaTransactionId) {
      console.error("[webhook] Missing transaction ID", { payload });
      return NextResponse.json(
        { error: "Webhook missing transaction identifier" },
        { status: 400 }
      );
    }

    // 4️⃣ 🔒 REPLAY PROTECTION — check if already processed
    const { data: existingWebhook, error: existingError } = await supabase
      .from("processed_webhooks")
      .select("id")
      .eq("nomba_transaction_id", nombaTransactionId)
      .maybeSingle();

    if (existingError) {
      console.error("[webhook] Dedupe lookup failed:", existingError);
      // Fail closed
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

    // 5️⃣ 🔒 CLAIM the transaction ID BEFORE business logic
    //     This prevents concurrent duplicates from racing past the check.
    const { error: claimError } = await supabase
      .from("processed_webhooks")
      .insert({
        nomba_transaction_id: nombaTransactionId,
        event_type: eventType,
        payload,
      });

    if (claimError) {
      if (claimError.code === "23505") {
        // Another request claimed it
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

    // 6️⃣ Dispatch by event type
    //     NOTE: replace the pseudo-handlers below with your real service calls.
    try {
      switch (eventType) {
        case "payout.success":
        case "payout.failed": {
          const pendingTxId =
            tx?.pending_transaction_id || data?.pending_transaction_id;
          if (pendingTxId) {
            const result = await handlePayoutWebhook({
              pendingTxId,
              success: eventType === "payout.success",
              nombaTransactionId,
              nombaFee: Number(tx?.fee || 0),
              failureReason: tx?.failure_reason,
            });
            if (!result.ok) {
              console.error("[webhook] Payout handler failed:", result.message);
            }
          }
          break;
        }

        case "virtual_account.deposit":
        case "virtual_account.credit": {
          const userId = tx?.userId || data?.userId;
          const amount = Number(tx?.amount || data?.amount || 0);
          if (userId && amount > 0) {
            const result = await handleVirtualAccountDeposit({
              userId,
              netAmount: Number(tx?.net_amount || amount),
              grossAmount: amount,
              nombaFee: Number(tx?.fee || 0),
              nombaTransactionId,
              senderName: tx?.sender_name || data?.senderName,
              senderBank: tx?.sender_bank || data?.senderBank,
              narration: tx?.narration || data?.narration,
            });
            if (!result.ok) {
              console.error("[webhook] VA deposit handler failed:", result.message);
            }
          }
          break;
        }

        case "invoice.payment":
        case "invoice.paid": {
          const userId = tx?.userId || data?.userId;
          const invoiceId = tx?.invoice_id || data?.invoice_id;
          const amount = Number(tx?.amount || data?.amount || 0);
          if (userId && invoiceId && amount > 0) {
            const result = await handleInvoicePayment({
              userId,
              amount,
              transactionReference: nombaTransactionId,
              invoiceId,
              invoiceReference: tx?.invoice_reference || data?.invoice_reference,
              payerEmail: tx?.payer_email || data?.payerEmail,
              externalResponse: { payload },
            });
            if (!result.ok) {
              console.error(
                "[webhook] Invoice payment handler failed:",
                result.message
              );
            }
          }
          break;
        }

        default:
          console.log(`[webhook] Unhandled event type: ${eventType}`);
      }
    } catch (handlerError: any) {
      console.error("[webhook] Handler threw:", handlerError);
      // Non-fatal: row is claimed, business logic may be reconciled manually.
      // Returning 200 prevents Nomba from retrying (which would be blocked
      // by the claimed row anyway).
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err: any) {
    console.error("[webhook] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}