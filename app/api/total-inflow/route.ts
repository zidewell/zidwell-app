import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // Get current wallet balance directly from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Get transaction totals using SQL aggregation
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("type, amount, total_deduction, status")
      .eq("user_id", userId)
      .eq("status", "success");

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const inflowTypes = [
      "deposit", "virtual_account_deposit", "card_deposit",
      "p2p_received", "p2p_credit", "referral", "referral_reward",
      "invoice_payment", "refund", "cashback", "bonus"
    ];

    const outflowTypes = [
      "withdrawal", "debit", "airtime", "data", "electricity",
      "cable", "transfer", "p2p_transfer", "p2p_debit",
      "bill_payment", "subscription", "fee"
    ];

    let totalInflow = 0;
    let totalOutflow = 0;

    txData.forEach(tx => {
      const amount = Number(tx.amount || 0);
      if (inflowTypes.includes(tx.type)) {
        totalInflow += amount;
      } else if (outflowTypes.includes(tx.type)) {
        const deduction = Number(tx.total_deduction || tx.amount || 0);
        totalOutflow += deduction;
      }
    });

    const lifetimeBalance = totalInflow - totalOutflow;
    const currentBalance = Number(userData.wallet_balance || 0);

    return NextResponse.json({
      totalInflow,
      totalOutflow,
      lifetimeBalance,
      currentBalance,
      totalTransactions: txData.length,
      netFlow: totalInflow - totalOutflow
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}