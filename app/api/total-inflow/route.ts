// app/api/total-inflow/route.ts
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
    // Get all transactions
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("type, amount, total_deduction, fee, status, net_amount, gross_amount")
      .eq("user_id", userId);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // Define transaction types
    const inflowTypes = [
      "card_deposit", "credit", "deposit", "p2p_credit",
      "p2p_received", "referral", "referral_reward",
      "virtual_account_deposit", "refund", "cashback",
      "reversal", "salary", "invoice_payment", "bonus"
    ];

    const outflowTypes = [
      "airtime", "contract", "data", "debit", "p2p_transfer",
      "transfer", "withdrawal", "electricity", "cable",
      "bill_payment", "purchase", "subscription", "fee",
      "charge", "bill"
    ];

    const successStatuses = ['success', 'successful', 'completed'];

    let totalInflow = 0;
    let totalOutflow = 0;
    let totalTransactions = 0;

    txData.forEach(tx => {
      const status = tx.status?.toLowerCase() || "";
      const txType = tx.type?.toLowerCase() || "";
      const isSuccess = successStatuses.includes(status);
      
      // Special case: failed_refunded airtime is counted as inflow
      if (txType === 'airtime' && status === 'failed_refunded') {
        const amount = Number(tx.amount || 0);
        if (amount > 0) {
          totalInflow += amount;
          totalTransactions++;
        }
        return;
      }
      
      // Skip if not successful
      if (!isSuccess) return;

      totalTransactions++;
      let amount = 0;

      // INFLOW TRANSACTIONS - These add to lifetime balance
      if (inflowTypes.includes(txType)) {
        // Use net_amount if available, otherwise amount minus fee
        if (tx.net_amount != null && Number(tx.net_amount) > 0) {
          amount = Number(tx.net_amount);
        } else {
          const fee = Number(tx.fee || 0);
          const rawAmount = Number(tx.amount || 0);
          amount = Math.max(0, rawAmount - fee);
        }
        totalInflow += amount;
      }
      // OUTFLOW TRANSACTIONS - These don't affect lifetime balance (only total outflow)
      else if (outflowTypes.includes(txType)) {
        // For withdrawals, ONLY use the amount (fee is NOT deducted from wallet)
        if (txType === 'withdrawal') {
          amount = Math.abs(Number(tx.amount || 0));
        }
        // For airtime and data, use gross_amount
        else if (['airtime', 'data'].includes(txType)) {
          if (tx.gross_amount != null && Number(tx.gross_amount) > 0) {
            amount = Number(tx.gross_amount);
          } else if (tx.total_deduction != null && Number(tx.total_deduction) > 0) {
            amount = Number(tx.total_deduction);
          } else {
            amount = Math.abs(Number(tx.amount || 0));
          }
        }
        // For other outflows, use total_deduction
        else if (tx.total_deduction != null && Number(tx.total_deduction) > 0) {
          amount = Number(tx.total_deduction);
        }
        // Fallback: amount + fee
        else {
          const fee = Number(tx.fee || 0);
          const rawAmount = Number(tx.amount || 0);
          amount = Math.abs(rawAmount) + fee;
        }
        totalOutflow += Math.abs(amount);
      }
      // Unknown transaction types - try to determine by amount sign
      else {
        const rawAmount = Number(tx.amount || 0);
        if (rawAmount > 0) {
          // Treat as inflow
          const fee = Number(tx.fee || 0);
          amount = Math.max(0, rawAmount - fee);
          totalInflow += amount;
        } else if (rawAmount < 0) {
          // Treat as outflow
          const fee = Number(tx.fee || 0);
          amount = Math.abs(rawAmount) + fee;
          totalOutflow += amount;
        }
      }
    });

    return NextResponse.json({
      success: true,
      lifetimeBalance: totalInflow,
      totalInflow: totalInflow,
      totalOutflow: totalOutflow,
      netBalance: totalInflow - totalOutflow,
      totalTransactions: totalTransactions,
    });

  } catch (error: any) {
    console.error("Error calculating transaction stats:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}