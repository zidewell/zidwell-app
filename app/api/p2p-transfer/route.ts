// app/api/p2p-transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      narration,
      invoice_reference,
      invoicePaymentData,
      invoiceTxRef,
    } = body;

    if (!sender_id || !receiver_email || !amount) {
      return NextResponse.json(
        { error: "sender_id, receiver_email, and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Verify sender exists
    const { data: sender, error: senderError } = await supabaseAdmin
      .from("users")
      .select("id, email, wallet_balance")
      .eq("id", sender_id)
      .single();

    if (senderError || !sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    // Find receiver by email
    const { data: receiver, error: receiverError } = await supabaseAdmin
      .from("users")
      .select("id, email, wallet_balance")
      .eq("email", receiver_email)
      .single();

    if (receiverError || !receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    if (sender.id === receiver.id) {
      return NextResponse.json(
        { error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    // 🆕 Determine if this is an invoice payment (platform fee applies)
    const isInvoicePayment = !!invoicePaymentData;
    const platformFee = isInvoicePayment ? amount * 0.02 : 0;

    const transferRef = invoiceTxRef || `P2P_${Date.now()}_${sender.id.slice(0, 8)}`;

    // 1️⃣ Debit sender atomically (with idempotency)
    const { data: debitResult, error: debitError } = await supabaseAdmin.rpc(
      "deduct_wallet_balance",
      {
        p_user_id: sender.id,
        p_amount: amount,
        p_transaction_type: "p2p_transfer",
        p_reference: transferRef,
        p_description: narration || `Transfer to ${receiver_email}`,
        p_pin: null, // PIN validated at route level above
        p_idempotency_key: `p2p_debit_${transferRef}`,
      }
    );

    if (debitError) {
      console.error("P2P debit RPC error:", debitError);
      return NextResponse.json(
        { error: "Wallet deduction failed", detail: debitError.message },
        { status: 500 }
      );
    }

    if (!debitResult || debitResult.status !== "OK") {
      const status =
        debitResult?.status === "INSUFFICIENT_FUNDS"
          ? "INSUFFICIENT_FUNDS"
          : debitResult?.status === "INVALID_PIN"
          ? "INVALID_PIN"
          : "FAILED";

      return NextResponse.json(
        {
          error:
            status === "INSUFFICIENT_FUNDS"
              ? "Insufficient wallet balance"
              : status === "INVALID_PIN"
              ? "Invalid transaction PIN"
              : "Transfer failed",
          status,
        },
        { status: 400 }
      );
    }

    // 2️⃣ Credit receiver atomically (with idempotency)
    //    Receiver gets: amount - platformFee (if invoice payment)
    const receiverCreditAmount = isInvoicePayment
      ? amount - platformFee
      : amount;

    // Create a pending transaction record for receiver before crediting
    const { data: receiverTx, error: receiverTxError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: receiver.id,
        type: "p2p_received",
        amount: receiverCreditAmount,
        status: "success",
        reference: `${transferRef}_credit`,
        description: narration || `Transfer from ${sender.email}`,
        balance_before: receiver.wallet_balance,
        balance_after: receiver.wallet_balance,
      })
      .select()
      .single();

    if (receiverTxError || !receiverTx) {
      console.error("Failed to create receiver tx:", receiverTxError);
      // Rollback sender debit manually (best-effort)
      await supabaseAdmin.rpc("mutate_wallet_balance", {
        p_user_id: sender.id,
        p_amount: amount,
        p_transaction_id: debitResult.tx_id,
        p_reason: "p2p_transfer_rollback",
        p_idempotency_key: `p2p_rollback_${transferRef}`,
      });
      return NextResponse.json(
        { error: "Failed to credit receiver. Sender refunded." },
        { status: 500 }
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
      }
    );

    if (creditError || creditResult === null) {
      console.error("P2P credit RPC error:", creditError);
      // Rollback sender debit
      await supabaseAdmin.rpc("mutate_wallet_balance", {
        p_user_id: sender.id,
        p_amount: amount,
        p_transaction_id: debitResult.tx_id,
        p_reason: "p2p_transfer_rollback",
        p_idempotency_key: `p2p_rollback_${transferRef}`,
      });
      return NextResponse.json(
        { error: "Failed to credit receiver. Sender refunded." },
        { status: 500 }
      );
    }

    // 3️⃣ Deduct platform fee from receiver if invoice payment
    if (platformFee > 0) {
      const { error: feeError } = await supabaseAdmin.rpc(
        "deduct_wallet_balance",
        {
          p_user_id: receiver.id,
          p_amount: platformFee,
          p_transaction_type: "debit",
          p_reference: `PLATFORM_FEE_${invoiceTxRef || transferRef}`,
          p_description: `2% platform fee for invoice ${
            invoicePaymentData.invoice_reference || invoiceTxRef
          }`,
          p_pin: null,
          p_idempotency_key: `platform_fee_${invoiceTxRef || transferRef}`,
        }
      );

      if (feeError) {
        console.error("Platform fee deduction failed:", feeError);
        // Non-fatal: money already moved. Log for ops reconciliation.
      }
    }

    return NextResponse.json({
      success: true,
      transfer_reference: transferRef,
      sender_transaction_id: debitResult.tx_id,
      receiver_transaction_id: receiverTx.id,
      amount_sent: amount,
      platform_fee: platformFee,
      amount_received: receiverCreditAmount,
      sender_new_balance: debitResult.new_balance,
      receiver_new_balance: creditResult,
    });
  } catch (err: any) {
    console.error("P2P transfer error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}