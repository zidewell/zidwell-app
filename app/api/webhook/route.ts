// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNombaSignature } from "./helpers/signature-verification";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// EVENT TYPE NORMALIZATION
// Nomba sends underscored event types: payout_success, transfer_success, etc.
// We normalize to a canonical form for the switch below.
// ============================================================
function normalizeEventType(raw: string): string {
  return String(raw || "").trim().toLowerCase().replace(/[.\-]/g, "_");
}

// Detect success/failure from event type + transaction payload
function isSuccessEvent(normalized: string, tx: any, data: any): boolean {
  if (/(_success|_successful|_completed)$/.test(normalized)) return true;
  if (/(_failed|_failure|_reversed|_declined|_cancelled|_error)$/.test(normalized)) return false;

  // Fallback heuristics from payload
  const status = String(
    tx?.status || data?.status || data?.transaction?.status || ""
  ).toUpperCase();
  if (["SUCCESS", "SUCCESSFUL", "COMPLETED"].includes(status)) return true;
  if (["FAILED", "REVERSED", "DECLINED", "CANCELLED", "ERROR"].includes(status)) return false;

  const code = String(tx?.responseCode || data?.responseCode || "").trim();
  if (code === "00" || code === "0") return true;

  return false; // default to failure-safe
}

export async function POST(req: NextRequest) {
  try {
    // ============================================================
    // STEP 1: Read body once
    // ============================================================
    const rawBody = await req.text();
    if (!rawBody || rawBody.length === 0) {
      console.error("[webhook] Empty body");
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    // ============================================================
    // STEP 2: Extract signature headers
    // Nomba sends BOTH nomba-sig-value AND nomba-signature (same value).
    // Also nomba-signature-algorithm, nomba-signature-version, nomba-timestamp
    // ============================================================
    const signature =
      req.headers.get("nomba-signature") ||
      req.headers.get("nomba-sig-value") ||
      "";

    const timestamp =
      req.headers.get("nomba-timestamp") ||
      "";

    console.log("[webhook] Raw body length:", rawBody.length);

    // ============================================================
    // STEP 3: Parse JSON
    // ============================================================
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("[webhook] Invalid JSON:", parseErr);
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
      console.error("[webhook] ❌ Signature invalid");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("[webhook] ✅ Signature valid");

    // ============================================================
    // STEP 5: Extract identifiers from payload
    // ============================================================
    const rawEventType: string =
      payload?.event_type || payload?.eventType || payload?.type || "";

    const normalizedEventType = normalizeEventType(rawEventType);

    const data = payload?.data || {};
    const merchant = data?.merchant || {};
    const tx = data?.transaction || {};

    const nombaTransactionId: string | undefined =
      tx?.transactionId ||
      tx?.transaction_id ||
      tx?.id ||
      tx?.reference ||
      payload?.requestId;

    // Nomba often includes merchantTxRef — the SAME reference your app
    // used when initiating the transaction.
    const merchantTxRef: string | undefined =
      tx?.merchantTxRef ||
      data?.merchantTxRef ||
      data?.merchant_tx_ref ||
      payload?.merchantTxRef;

    if (!nombaTransactionId) {
      console.error("[webhook] Missing transaction ID");
      return NextResponse.json(
        { error: "Missing transaction identifier" },
        { status: 400 }
      );
    }

    console.log(
      `[webhook] event="${rawEventType}" (normalized="${normalizedEventType}") ` +
        `txId=${nombaTransactionId} merchantTxRef=${merchantTxRef || "?"}`
    );

    // ============================================================
    // STEP 6: Replay protection
    // ============================================================
    const { data: existing, error: existingErr } = await supabase
      .from("processed_webhooks")
      .select("id")
      .eq("nomba_transaction_id", nombaTransactionId)
      .maybeSingle();

    if (existingErr) {
      console.error("[webhook] Dedupe lookup failed:", existingErr);
      return NextResponse.json(
        { error: "Webhook dedupe error" },
        { status: 500 }
      );
    }

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
        { status: 500 }
      );
    }

    // ============================================================
    // STEP 8: Dispatch based on normalized event type
    // ============================================================
    try {
      // ---------- PAYOUT / TRANSFER ----------
      if (
        normalizedEventType.includes("payout") ||
        normalizedEventType.includes("transfer") ||
        normalizedEventType.includes("withdrawal")
      ) {
        await handlePayoutLikeEvent({
          nombaTransactionId,
          merchantTxRef,
          tx,
          isSuccess: isSuccessEvent(normalizedEventType, tx, data),
        });
      }
      // ---------- VIRTUAL ACCOUNT DEPOSIT ----------
      else if (
        normalizedEventType.includes("deposit") ||
        normalizedEventType.includes("virtual_account") ||
        normalizedEventType.includes("credit")
      ) {
        console.log(
          `[webhook] Deposit event received — amount=${tx?.amount}`
        );
        // TODO: await handleVirtualAccountDeposit({...})
      }
      // ---------- INVOICE PAYMENT ----------
      else if (
        normalizedEventType.includes("invoice") ||
        normalizedEventType.includes("payment")
      ) {
        console.log(
          `[webhook] Payment/invoice event received — amount=${tx?.amount}`
        );
        // TODO: await handleInvoicePayment({...})
      }
      // ---------- UNKNOWN ----------
      else {
        console.warn(
          `[webhook] ⚠️ Unknown event type: "${rawEventType}" (normalized="${normalizedEventType}")`
        );
      }
    } catch (handlerErr: any) {
      console.error("[webhook] Handler threw:", handlerErr);
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

// ============================================================
// HELPER: Handle payout/transfer/withdrawal events
// Looks up the transaction by merchant_tx_ref (preferred) or
// nomba_transaction_id, then updates status + accounting correctly.
// ============================================================
async function handlePayoutLikeEvent({
  nombaTransactionId,
  merchantTxRef,
  tx,
  isSuccess,
}: {
  nombaTransactionId: string;
  merchantTxRef?: string;
  tx: any;
  isSuccess: boolean;
}): Promise<void> {
  // ------------------------------------------------
  // Find the transaction by merchant_tx_ref (best) or fallback to nomba_tx_id
  // ------------------------------------------------
  let matchedTx: any = null;

  if (merchantTxRef) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("merchant_tx_ref", merchantTxRef)
      .maybeSingle();
    if (error) {
      console.error("[payout] Lookup by merchant_tx_ref failed:", error);
    } else if (data) {
      matchedTx = data;
    }
  }

  if (!matchedTx) {
    // Fallback: search by nomba_transaction_id inside external_response
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .or(
        `external_response->>nomba_transaction_id.eq.${nombaTransactionId},` +
          `external_response->nomba_request->data->>id.eq.${nombaTransactionId}`
      )
      .maybeSingle();

    if (error) {
      console.error("[payout] Lookup by nomba_tx_id failed:", error);
    } else if (data) {
      matchedTx = data;
    }
  }

  if (!matchedTx) {
    console.error(
      `[payout] ❌ No transaction matched merchantTxRef=${merchantTxRef} nombaTxId=${nombaTransactionId}`
    );
    return;
  }

  console.log(
    `[payout] Matched transaction ${matchedTx.id} (current status=${matchedTx.status})`
  );

  // ------------------------------------------------
  // Already finalized? Nothing to do.
  // ------------------------------------------------
  if (matchedTx.status === "success" || matchedTx.status === "failed") {
    console.log(`[payout] Transaction ${matchedTx.id} already finalized`);
    return;
  }

  const totalDeduction =
    Number(matchedTx.total_deduction) ||
    Number(matchedTx.amount) ||
    0;

  const userId = matchedTx.user_id;

  // ------------------------------------------------
  // SUCCESS PATH
  // ------------------------------------------------
  if (isSuccess) {
    console.log(
      `[payout] SUCCESS for ${matchedTx.id}. Verifying deduction...`
    );

    // Verify the wallet was actually deducted (the bug we fixed)
    // A properly deducted tx has deducted_at IS NOT NULL
    // AND balance_before / balance_after populated
    const isDeducted =
      matchedTx.deducted_at != null &&
      matchedTx.balance_before != null &&
      matchedTx.balance_after != null;

    if (!isDeducted && totalDeduction > 0) {
      console.warn(
        `[payout] ⚠️ Tx ${matchedTx.id} succeeded but was never deducted! Deducting now...`
      );
      await deductIfNeeded({
        userId,
        transactionId: matchedTx.id,
        amount: totalDeduction,
        merchantTxRef: matchedTx.merchant_tx_ref || merchantTxRef,
      });
    }

    // Mark success
    const { error: updateErr } = await supabase
      .from("transactions")
      .update({
        status: "success",
        updated_at: new Date().toISOString(),
        external_response: {
          ...(matchedTx.external_response || {}),
          nomba_webhook_status: "SUCCESS",
          nomba_webhook_received_at: new Date().toISOString(),
        },
      })
      .eq("id", matchedTx.id);

    if (updateErr) {
      console.error(`[payout] Update to success failed:`, updateErr);
    } else {
      console.log(`[payout] ✅ Transaction ${matchedTx.id} marked success`);
    }
    return;
  }

  // ------------------------------------------------
  // FAILURE PATH — refund the user
  // ------------------------------------------------
  console.log(`[payout] FAILURE for ${matchedTx.id}. Refunding...`);

  // Only refund if the original was deducted (otherwise user never lost money)
  const wasDeducted =
    matchedTx.deducted_at != null && matchedTx.balance_before != null;

  if (wasDeducted && totalDeduction > 0) {
    // Create refund transaction
    const { data: refundTx, error: refundInsertErr } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "refund",
        amount: totalDeduction,
        status: "pending",
        reference: `REFUND_${matchedTx.merchant_tx_ref || matchedTx.id}`,
        description: `Refund for failed withdrawal ${
          matchedTx.merchant_tx_ref || matchedTx.id
        }`,
      })
      .select()
      .single();

    if (refundInsertErr || !refundTx) {
      console.error(`[payout] Refund insert failed:`, refundInsertErr);
    } else {
      // Credit wallet via RPC (atomic + idempotent)
      const { error: creditErr } = await supabase.rpc(
        "mutate_wallet_balance",
        {
          p_user_id: userId,
          p_amount: totalDeduction,
          p_transaction_id: refundTx.id,
          p_reason: "payout_failure_refund",
          p_idempotency_key: `refund_${matchedTx.id}`,
        }
      );

      if (creditErr) {
        console.error(`[payout] Refund credit failed:`, creditErr);
        await supabase
          .from("transactions")
          .update({ status: "failed" })
          .eq("id", refundTx.id);
      } else {
        await supabase
          .from("transactions")
          .update({
            status: "success",
            updated_at: new Date().toISOString(),
          })
          .eq("id", refundTx.id);
        console.log(
          `[payout] ✅ Refunded ₦${totalDeduction} to user ${userId}`
        );
      }
    }
  } else {
    console.log(
      `[payout] Tx ${matchedTx.id} was never deducted — no refund needed`
    );
  }

  // Mark original as failed
  const { error: failErr } = await supabase
    .from("transactions")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
      external_response: {
        ...(matchedTx.external_response || {}),
        nomba_webhook_status: "FAILED",
        nomba_webhook_received_at: new Date().toISOString(),
        refund_applied: wasDeducted,
      },
    })
    .eq("id", matchedTx.id);

  if (failErr) {
    console.error(`[payout] Update to failed failed:`, failErr);
  } else {
    console.log(`[payout] ✅ Transaction ${matchedTx.id} marked failed`);
  }
}

// ============================================================
// HELPER: If a successful payout was never deducted, deduct now
// Uses mutate_wallet_balance with negative amount (atomic + idempotent)
// ============================================================
async function deductIfNeeded({
  userId,
  transactionId,
  amount,
  merchantTxRef,
}: {
  userId: string;
  transactionId: string;
  amount: number;
  merchantTxRef?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("mutate_wallet_balance", {
    p_user_id: userId,
    p_amount: -amount, // negative = debit
    p_transaction_id: transactionId,
    p_reason: "payout_webhook_retroactive_deduction",
    p_idempotency_key: `payout_retro_deduct_${transactionId}`,
  });

  if (error) {
    console.error(
      `[payout] ❌ Retroactive deduction failed for ${transactionId}:`,
      error
    );
    throw error;
  }

  console.log(
    `[payout] ✅ Retroactive deduction ₦${amount} applied to ${transactionId}`
  );
}