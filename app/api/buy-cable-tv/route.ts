// app/api/buy-cable-tv/route.ts
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
      provider,
      customerId,
      bouquetCode,
      amount,
      pin,
      merchantTxRef: providedRef,
    } = body;

    if (!userId || !provider || !customerId || !bouquetCode || !amount) {
      return NextResponse.json(
        {
          error:
            "userId, provider, customerId, bouquetCode, and amount are required",
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

    const merchantTxRef =
      providedRef ||
      `CABLE_${Date.now()}_${userId.slice(0, 8)}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    // 1️⃣ Atomic deduction with PIN + idempotency
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "deduct_wallet_balance",
      {
        p_user_id: userId,
        p_amount: parsedAmount,
        p_transaction_type: "cable",
        p_reference: merchantTxRef,
        p_description: `Cable TV purchase for ${customerId} (${provider} - ${bouquetCode})`,
        p_pin: String(pin),
        p_idempotency_key: `cable_${merchantTxRef}`,
      }
    );

    if (rpcError) {
      console.error("Cable TV RPC error:", rpcError);
      return NextResponse.json(
        { error: "Wallet deduction failed", detail: rpcError.message },
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
        { error: messages[status] || "Transaction failed", status },
        { status: 400 }
      );
    }

    const transactionId = rpcResult.tx_id;

    // 2️⃣ Call Nomba cable TV API (pseudocode)
    try {
      // const nombaResult = await callNombaCable({ provider, customerId, bouquetCode, amount });
      // if (!nombaResult.success) throw new Error(nombaResult.message);

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
        reference: merchantTxRef,
        new_balance: rpcResult.new_balance,
        message: "Cable TV subscription successful",
      });
    } catch (apiError: any) {
      console.error("Cable TV provider error:", apiError);

      // 🔁 Refund
      const { data: refundTx } = await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: userId,
          type: "refund",
          amount: parsedAmount,
          status: "success",
          reference: `REFUND_${merchantTxRef}`,
          description: `Refund for failed cable TV purchase ${merchantTxRef}`,
        })
        .select()
        .single();

      if (refundTx) {
        await supabaseAdmin.rpc("mutate_wallet_balance", {
          p_user_id: userId,
          p_amount: parsedAmount,
          p_transaction_id: refundTx.id,
          p_reason: "cable_provider_failure_refund",
          p_idempotency_key: `cable_refund_${merchantTxRef}`,
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
        { error: "Cable provider failed. Refunded.", detail: apiError.message },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Cable TV route error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}