// app/api/buy-airtime/route.ts
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
      userId,
      network,
      phoneNumber,
      amount,
      pin,
      merchantTxRef: providedRef,
    } = body;

    // Validation
    if (!userId || !network || !phoneNumber || !amount) {
      return NextResponse.json(
        {
          error:
            "userId, network, phoneNumber, and amount are required",
        },
        { status: 400 }
      );
    }

    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return NextResponse.json(
        { error: "Valid transaction PIN is required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Generate a deterministic, globally-unique merchant ref
    const finalMerchantTxRef =
      providedRef ||
      `AIRTIME_${Date.now()}_${userId.slice(0, 8)}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    // 1️⃣ Atomically deduct wallet with PIN validation + idempotency
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "deduct_wallet_balance",
      {
        p_user_id: userId,
        p_amount: parsedAmount,
        p_transaction_type: "airtime",
        p_reference: finalMerchantTxRef,
        p_description: `Airtime on ${network} for ${phoneNumber}`,
        p_pin: String(pin),
        p_idempotency_key: `airtime_${finalMerchantTxRef}`,
      }
    );

    if (rpcError) {
      console.error("Airtime deduction RPC error:", rpcError);
      return NextResponse.json(
        {
          error: "Transaction failed during processing",
          detail: rpcError.message,
        },
        { status: 500 }
      );
    }

    if (!rpcResult || rpcResult.status !== "OK") {
      const status = rpcResult?.status;
      const messages: Record<string, string> = {
        INSUFFICIENT_FUNDS: "Insufficient wallet balance",
        INVALID_PIN: "Invalid transaction PIN",
      };
      return NextResponse.json(
        {
          error: messages[status] || "Transaction failed",
          status,
        },
        { status: 400 }
      );
    }

    const transactionId = rpcResult.tx_id;

    // 2️⃣ Call Nomba airtime API (pseudocode — replace with your real call)
    //    On failure, refund via mutate_wallet_balance.
    try {
      // const nombaResult = await callNombaAirtime({ network, phoneNumber, amount });
      // if (!nombaResult.success) throw new Error(nombaResult.message);

      // 3️⃣ Mark tx success
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "success",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

      return NextResponse.json({
        success: true,
        transaction_id: transactionId,
        reference: finalMerchantTxRef,
        new_balance: rpcResult.new_balance,
        message: "Airtime purchase successful",
      });
    } catch (apiError: any) {
      console.error("Airtime provider error:", apiError);

      // 🔁 Refund the user (idempotent)
      const { data: refundTx } = await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: userId,
          type: "refund",
          amount: parsedAmount,
          status: "success",
          reference: `REFUND_${finalMerchantTxRef}`,
          description: `Refund for failed airtime purchase ${finalMerchantTxRef}`,
        })
        .select()
        .single();

      if (refundTx) {
        await supabaseAdmin.rpc("mutate_wallet_balance", {
          p_user_id: userId,
          p_amount: parsedAmount,
          p_transaction_id: refundTx.id,
          p_reason: "airtime_provider_failure_refund",
          p_idempotency_key: `airtime_refund_${finalMerchantTxRef}`,
        });
      }

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: apiError.message },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId);

      return NextResponse.json(
        { error: "Airtime provider failed. Refunded.", detail: apiError.message },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Airtime route error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}