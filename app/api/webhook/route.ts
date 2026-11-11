// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNombaSignature } from "./helpers/signature-verification";
import { processVirtualAccountDeposit } from "./services/virtual-account.service";
import { handleInvoicePayment } from "./services/invoice-payment.service";
import { handlePayoutWebhook } from "./services/payout.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizeEventType(raw: string): string {
  return String(raw || "").trim().toLowerCase().replace(/[.\-]/g, "_");
}

export async function POST(req: NextRequest) {
  let nombaTransactionId: string | null = null;
  let claimed = false;

  try {
    // ============================================================
    // STEP 1: Read body exactly once
    // ============================================================
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    // ============================================================
    // STEP 2: Extract signature headers
    // ============================================================
    const signature =
      req.headers.get("nomba-signature") ||
      req.headers.get("nomba-sig-value") ||
      "";
    const timestamp = req.headers.get("nomba-timestamp") || "";

    console.log("[webhook] Raw body length:", rawBody.length);

    // ============================================================
    // STEP 3: Parse JSON
    // ============================================================
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 },
      );
    }

    // ============================================================
    // STEP 4: Verify signature
    // ============================================================
    const isValid = await verifyNombaSignature(payload, timestamp, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }
    console.log("[webhook] ✅ Signature valid");

    // ============================================================
    // STEP 5: Extract event details
    // ============================================================
    const rawEventType: string =
      payload?.event_type || payload?.eventType || payload?.type || "";
    const normalizedEvent = normalizeEventType(rawEventType);

    const data = payload?.data || {};
    const tx = data?.transaction || {};
    const merchant = data?.merchant || {};
    const customer = data?.customer || {};

    nombaTransactionId =
      tx?.transactionId || tx?.transaction_id || payload?.requestId;

    if (!nombaTransactionId) {
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 },
      );
    }

    console.log(
      `[webhook] event="${rawEventType}" (norm="${normalizedEvent}") ` +
        `txId=${nombaTransactionId} type="${tx?.type || "?"}"`,
    );

    // ============================================================
    // STEP 6: Replay protection
    // ============================================================
    const { data: existing } = await supabase
      .from("processed_webhooks")
      .select("id")
      .eq("nomba_transaction_id", nombaTransactionId)
      .maybeSingle();

    if (existing) {
      console.log(`[webhook] ${nombaTransactionId} already processed`);
      return NextResponse.json({
        success: true,
        message: "Webhook already processed",
      });
    }

    // ============================================================
    // STEP 7: Atomic claim
    // ============================================================
    const { error: claimErr } = await supabase
      .from("processed_webhooks")
      .insert({
        nomba_transaction_id: nombaTransactionId,
        event_type: rawEventType,
        payload,
      });

    if (claimErr) {
      if (claimErr.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Webhook already processed",
        });
      }
      console.error("[webhook] Claim failed:", claimErr);
      return NextResponse.json(
        { error: "Webhook processing error" },
        { status: 500 },
      );
    }
    claimed = true;

    // ============================================================
    // STEP 8: Dispatch by event type
    // ============================================================
    let handled = false;

    // ---------- VIRTUAL ACCOUNT DEPOSIT (vact_transfer) ----------
    if (tx?.type === "vact_transfer") {
      const aliasAccountReference = tx?.aliasAccountReference;
      const transactionAmount = Number(tx?.transactionAmount ?? 0);
      const nombaFee = Number(tx?.fee ?? 0);

      console.log(
        `[webhook] → VA deposit: user=${aliasAccountReference} ` +
          `gross=₦${transactionAmount} fee=₦${nombaFee}`,
      );

      if (!aliasAccountReference) {
        throw new Error(
          "vact_transfer missing aliasAccountReference (cannot identify user)",
        );
      }

      if (transactionAmount <= 0) {
        throw new Error(`Invalid deposit amount: ${transactionAmount}`);
      }

      const result = await processVirtualAccountDeposit(payload, {
        aliasAccountReference,
        nombaTransactionId,
        transactionAmount,
        nombaFee,
        customer,
        tx,
      });

      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }

      console.log(
        `[webhook] ✅ VA deposit handled: ${JSON.stringify(result)}`,
      );
      handled = true;
    }
    // ---------- PAYOUT / TRANSFER / WITHDRAWAL ----------
    else if (
      normalizedEvent.includes("payout") ||
      normalizedEvent.includes("transfer") ||
      normalizedEvent.includes("withdrawal")
    ) {
      const merchantTxRef = tx?.merchantTxRef || data?.merchantTxRef;
      const isSuccess =
        normalizedEvent.includes("success") ||
        tx?.responseCode === "00" ||
        String(tx?.status || "").toUpperCase() === "SUCCESS";

      let pendingTxId: string | null = null;

      if (merchantTxRef) {
        const { data: byMerchantRef } = await supabase
          .from("transactions")
          .select("id")
          .eq("merchant_tx_ref", merchantTxRef)
          .maybeSingle();
        pendingTxId = byMerchantRef?.id || null;
      }

      if (!pendingTxId) {
        const { data: byNombaId } = await supabase
          .from("transactions")
          .select("id")
          .eq(
            "external_response->>nomba_transaction_id",
            nombaTransactionId,
          )
          .maybeSingle();
        pendingTxId = byNombaId?.id || null;
      }

      if (pendingTxId) {
        const result = await handlePayoutWebhook({
          pendingTxId,
          success: isSuccess,
          nombaTransactionId,
          nombaFee: Number(tx?.fee || 0),
          failureReason: tx?.failure_reason || tx?.responseMessage,
        });

        if (!result.ok) {
          throw new Error(result.message);
        }
        console.log(`[webhook] ✅ Payout handled: ${result.message}`);
      } else {
        console.warn(
          `[webhook] ⚠️ Payout webhook has no matching transaction: ` +
            `merchantTxRef=${merchantTxRef} nombaTxId=${nombaTransactionId}`,
        );
      }
      handled = true;
    }
    // ---------- INVOICE / GENERIC PAYMENT ----------
    else if (
      normalizedEvent.includes("invoice") ||
      normalizedEvent === "payment_success" ||
      normalizedEvent.includes("payment")
    ) {
      console.log(
        `[webhook] → Invoice/payment handler: type="${tx?.type}" ` +
          `amount=${tx?.transactionAmount ?? tx?.amount}`,
      );

      const userId = tx?.aliasAccountReference;
      const invoiceId = tx?.invoice_id || data?.invoice_id;
      const amount = Number(tx?.transactionAmount ?? tx?.amount ?? 0);

      if (userId && invoiceId && amount > 0) {
        const result = await handleInvoicePayment({
          userId,
          amount,
          transactionReference: nombaTransactionId,
          invoiceId,
          invoiceReference:
            tx?.invoice_reference || data?.invoice_reference,
          payerEmail: customer?.email || tx?.payer_email,
          externalResponse: { payload },
        });

        if (!result.ok) {
          throw new Error(result.message);
        }
        console.log(`[webhook] ✅ Invoice handled: ${result.message}`);
      } else {
        console.warn(
          `[webhook] ⚠️ Invoice event missing fields: ` +
            `userId=${userId} invoiceId=${invoiceId} amount=${amount}`,
        );
      }
      handled = true;
    }

    // ---------- UNHANDLED ----------
    if (!handled) {
      console.warn(
        `[webhook] ⚠️ Unhandled event="${rawEventType}" type="${tx?.type}"`,
      );

      await supabase
        .from("processed_webhooks")
        .delete()
        .eq("nomba_transaction_id", nombaTransactionId);

      return NextResponse.json(
        { error: `Unhandled: ${rawEventType}/${tx?.type}` },
        { status: 501 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (err: any) {
    console.error("[webhook] ❌ Error:", err);

    if (claimed && nombaTransactionId) {
      try {
        await supabase
          .from("processed_webhooks")
          .delete()
          .eq("nomba_transaction_id", nombaTransactionId);
        console.log(`[webhook] 🔙 Rolled back claim`);
      } catch (rollbackErr) {
        console.error("[webhook] Rollback failed:", rollbackErr);
      }
    }

    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 },
    );
  }
}