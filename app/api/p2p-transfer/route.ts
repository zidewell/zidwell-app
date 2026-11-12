// app/api/p2p-transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────────────────────
// Compensating refund helper
//
// Creates a NEW refund transaction row and credits the wallet back via
// mutate_wallet_balance. This is deliberately separate from the original
// debit tx so the debit row's balance_before / balance_after / deducted_at
// are NOT overwritten by the rollback (the bug in the old code).
// ─────────────────────────────────────────────────────────────────────────────
async function compensateRefund({
  userId,
  amount,
  reason,
  originalRef,
}: {
  userId: string;
  amount: number;
  reason: string;
  originalRef: string;
}) {
  const refundRef = `P2P_REFUND_${originalRef}`;

  const { data: refundTx, error: insertErr } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      type: "refund",
      amount,
      status: "pending",
      reference: refundRef,
      description: `Compensating refund — ${reason}`,
    })
    .select("id")
    .single();

  if (insertErr || !refundTx) {
    console.error("[p2p] Failed to create refund tx:", insertErr);
    return;
  }

  const { error: refundErr } = await supabaseAdmin.rpc(
    "mutate_wallet_balance",
    {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_id: refundTx.id,
      p_reason: reason,
      p_idempotency_key: `${reason}_${originalRef}`,
    },
  );

  if (refundErr) {
    console.error("[p2p] Refund RPC failed:", refundErr);
    await supabaseAdmin
      .from("transactions")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", refundTx.id);
    return;
  }

  await supabaseAdmin
    .from("transactions")
    .update({ status: "success", updated_at: new Date().toISOString() })
    .eq("id", refundTx.id);
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      sender_id,
      receiver_email,
      amount,
      pin,                 // ✅ NEW — required, same as transfer-balance
      narration,
      invoice_reference,
      invoicePaymentData,
      invoiceTxRef,
    } = body;

    // ─────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────
    if (!sender_id || !receiver_email || !amount) {
      return NextResponse.json(
        { error: "sender_id, receiver_email, and amount are required" },
        { status: 400 },
      );
    }

    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return NextResponse.json(
        { error: "Valid transaction PIN is required" },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────────
    // SENDER LOOKUP + FREEZE CHECK
    // ─────────────────────────────────────────────────────────────
    const { data: sender, error: senderError } = await supabaseAdmin
      .from("users")
      .select("id, email, wallet_balance, wallet_frozen, wallet_freeze_reason")
      .eq("id", sender_id)
      .single();

    if (senderError || !sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    if (sender.wallet_frozen) {
      return NextResponse.json(
        {
          error:
            sender.wallet_freeze_reason ||
            "Your wallet is frozen. Please contact support.",
          walletFrozen: true,
        },
        { status: 403 },
      );
    }

    // ─────────────────────────────────────────────────────────────
    // RECEIVER LOOKUP + FREEZE CHECK
    // ─────────────────────────────────────────────────────────────
    const { data: receiver, error: receiverError } = await supabaseAdmin
      .from("users")
      .select("id, email, wallet_balance, wallet_frozen")
      .eq("email", receiver_email)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    if (sender.id === receiver.id) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 },
      );
    }

    if (receiver.wallet_frozen) {
      return NextResponse.json(
        { error: "Receiver's wallet is frozen. Cannot send to this user." },
        { status: 403 },
      );
    }

    // ─────────────────────────────────────────────────────────────
    // FEE CALCULATION
    // ─────────────────────────────────────────────────────────────
    const isInvoicePayment = !!invoicePaymentData;
    const platformFee = isInvoicePayment ? parsedAmount * 0.02 : 0;
    const transferRef =
      invoiceTxRef || `P2P_${Date.now()}_${sender.id.slice(0, 8)}`;

    // ─────────────────────────────────────────────────────────────
    // 1️⃣ DEBIT SENDER — atomic, PIN-checked, freeze-checked, idempotent
    // ─────────────────────────────────────────────────────────────
    const { data: debitResult, error: debitError } = await supabaseAdmin.rpc(
      "deduct_wallet_balance",
      {
        p_user_id: sender.id,
        p_amount: parsedAmount,
        p_transaction_type: "p2p_transfer",
        p_reference: transferRef,
        p_description: narration || `Transfer to ${receiver_email}`,
        p_pin: String(pin),
        p_idempotency_key: `p2p_debit_${transferRef}`,
      },
    );

    if (debitError) {
      console.error("[p2p] debit RPC error:", debitError);
      return NextResponse.json(
        { error: "Wallet deduction failed", detail: debitError.message },
        { status: 500 },
      );
    }

    if (!debitResult || debitResult.status !== "OK") {
      const statusMap: Record<string, string> = {
        INSUFFICIENT_FUNDS: "Insufficient wallet balance",
        INVALID_PIN: "Invalid transaction PIN",
        PIN_LOCKED: "PIN is locked. Try again later or reset it.",
        WALLET_FROZEN: "Your wallet is frozen.",
      };
      const httpStatus =
        debitResult?.status === "PIN_LOCKED" ? 429 : 400;
      return NextResponse.json(
        {
          error: statusMap[debitResult?.status] || "Transfer failed",
          status: debitResult?.status,
        },
        { status: httpStatus },
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2️⃣ CREATE RECEIVER TX (pending) + CREDIT VIA mutate
    // ─────────────────────────────────────────────────────────────
    const receiverCreditAmount = isInvoicePayment
      ? parsedAmount - platformFee
      : parsedAmount;

    const { data: receiverTx, error: receiverTxError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: receiver.id,
        type: "p2p_received",
        amount: receiverCreditAmount,
        status: "pending",
        reference: `${transferRef}_credit`,
        description: narration || `Transfer from ${sender.email}`,
      })
      .select("id")
      .single();

    if (receiverTxError || !receiverTx) {
      console.error("[p2p] failed to create receiver tx:", receiverTxError);

      // 🔁 Compensating refund — separate row, original debit untouched
      await compensateRefund({
        userId: sender.id,
        amount: parsedAmount,
        reason: "p2p_transfer_rollback",
        originalRef: transferRef,
      });

      return NextResponse.json(
        { error: "Failed to credit receiver. Sender refunded." },
        { status: 500 },
      );
    }

    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
      "mutate_wallet_balance",
      {
        p_user_id: receiver.id,
        p_amount: receiverCreditAmount,
        p_transaction_id: receiverTx.id,
        p_reason: "p2p_transfer_credit",
        p_idempotency_key: `p2p_credit_${transferRef}`,
      },
    );

    if (creditError || creditResult === null) {
      console.error("[p2p] credit RPC error:", creditError);

      // 🔁 Compensating refund
      await compensateRefund({
        userId: sender.id,
        amount: parsedAmount,
        reason: "p2p_credit_failed",
        originalRef: transferRef,
      });

      // Mark the orphan receiver tx as failed
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", receiverTx.id);

      return NextResponse.json(
        { error: "Failed to credit receiver. Sender refunded." },
        { status: 500 },
      );
    }

    // Mark receiver tx success
    await supabaseAdmin
      .from("transactions")
      .update({ status: "success", updated_at: new Date().toISOString() })
      .eq("id", receiverTx.id);

    // ─────────────────────────────────────────────────────────────
    // 3️⃣ PLATFORM FEE (invoice payments only)
    // ─────────────────────────────────────────────────────────────
    if (platformFee > 0) {
      const { error: feeError } = await supabaseAdmin.rpc(
        "deduct_wallet_balance",
        {
          p_user_id: receiver.id,
          p_amount: platformFee,
          p_transaction_type: "platform_fee",
          p_reference: `PLATFORM_FEE_${transferRef}`,
          p_description: `2% platform fee for invoice ${
            invoicePaymentData.invoice_reference || invoiceTxRef
          }`,
          p_pin: null, // platform fee is forced — no user PIN required
          p_idempotency_key: `platform_fee_${transferRef}`,
        },
      );

      if (feeError) {
        // Non-fatal: money already moved. Log for ops reconciliation.
        console.error("[p2p] platform fee deduction failed:", feeError);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4️⃣ RESPONSE
    // ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      transfer_reference: transferRef,
      sender_transaction_id: debitResult.tx_id,
      receiver_transaction_id: receiverTx.id,
      amount_sent: parsedAmount,
      platform_fee: platformFee,
      amount_received: receiverCreditAmount,
      sender_new_balance: debitResult.new_balance,
      receiver_new_balance: creditResult,
    });
  } catch (err: any) {
    console.error("[p2p] transfer error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 },
    );
  }
}