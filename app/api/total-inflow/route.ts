// app/api/total-inflow/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//  1. Adds authentication — the original allowed any caller to read any
//     user's transaction stats by passing an arbitrary userId.
//  2. Forces the query to the authenticated user's ID (ignores any
//     userId in the body that doesn't match).
//  3. Supports token refresh via createAuthResponse.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to view transaction stats", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedUserId = body.userId;

    // ✅ FIX: Only allow reading your own stats
    if (requestedUserId && requestedUserId !== user.id) {
      const response = NextResponse.json(
        { error: "Unauthorized: Cannot read another user's stats" },
        { status: 403 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const userId = user.id;

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select(
        "type, amount, total_deduction, fee, status, net_amount, gross_amount"
      )
      .eq("user_id", userId);

    if (txError) {
      const response = NextResponse.json(
        { error: txError.message },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const inflowTypes = [
      "card_deposit", "credit", "deposit", "p2p_credit",
      "p2p_received", "referral", "referral_reward",
      "virtual_account_deposit", "refund", "cashback",
      "reversal", "salary", "invoice_payment", "bonus",
    ];

    const outflowTypes = [
      "airtime", "contract", "data", "debit", "p2p_transfer",
      "transfer", "withdrawal", "electricity", "cable",
      "bill_payment", "purchase", "subscription", "fee",
      "charge", "bill",
    ];

    const successStatuses = ["success", "successful", "completed"];

    let totalInflow = 0;
    let totalOutflow = 0;
    let totalTransactions = 0;

    for (const tx of txData || []) {
      const status = tx.status?.toLowerCase() || "";
      const txType = tx.type?.toLowerCase() || "";
      const isSuccess = successStatuses.includes(status);

      // Special case: failed_refunded airtime counts as inflow
      if (txType === "airtime" && status === "failed_refunded") {
        const amount = Number(tx.amount || 0);
        if (amount > 0) {
          totalInflow += amount;
          totalTransactions++;
        }
        continue;
      }

      if (!isSuccess) continue;
      totalTransactions++;
      let amount = 0;

      if (inflowTypes.includes(txType)) {
        if (tx.net_amount != null && Number(tx.net_amount) > 0) {
          amount = Number(tx.net_amount);
        } else {
          const fee = Number(tx.fee || 0);
          const rawAmount = Number(tx.amount || 0);
          amount = Math.max(0, rawAmount - fee);
        }
        totalInflow += amount;
      } else if (outflowTypes.includes(txType)) {
        if (txType === "withdrawal") {
          amount = Math.abs(Number(tx.amount || 0));
        } else if (["airtime", "data"].includes(txType)) {
          if (tx.gross_amount != null && Number(tx.gross_amount) > 0) {
            amount = Number(tx.gross_amount);
          } else if (
            tx.total_deduction != null &&
            Number(tx.total_deduction) > 0
          ) {
            amount = Number(tx.total_deduction);
          } else {
            amount = Math.abs(Number(tx.amount || 0));
          }
        } else if (
          tx.total_deduction != null &&
          Number(tx.total_deduction) > 0
        ) {
          amount = Number(tx.total_deduction);
        } else {
          const fee = Number(tx.fee || 0);
          const rawAmount = Number(tx.amount || 0);
          amount = Math.abs(rawAmount) + fee;
        }
        totalOutflow += Math.abs(amount);
      } else {
        const rawAmount = Number(tx.amount || 0);
        if (rawAmount > 0) {
          const fee = Number(tx.fee || 0);
          amount = Math.max(0, rawAmount - fee);
          totalInflow += amount;
        } else if (rawAmount < 0) {
          const fee = Number(tx.fee || 0);
          amount = Math.abs(rawAmount) + fee;
          totalOutflow += amount;
        }
      }
    }

    const responseData = {
      success: true,
      lifetimeBalance: totalInflow,
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      totalTransactions,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error calculating transaction stats:", error);
    const errResponse = {
      success: false,
      error: error.message,
    };
    if (newTokens) return createAuthResponse(errResponse, newTokens);
    return NextResponse.json(errResponse, { status: 500 });
  }
}