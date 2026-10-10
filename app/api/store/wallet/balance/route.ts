// app/api/store/wallet/balance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);

    if (!user) {
      return NextResponse.json(
        { error: "Please login to view wallet", logout: true },
        { status: 401 }
      );
    }

    // ─── 1. Fetch ONLY completed payments ───
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_page_payments")
      .select("payment_page_id, net_amount, amount, total_fee, paid_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return NextResponse.json(
        { error: "Failed to compute wallet balance" },
        { status: 500 }
      );
    }

    // ─── 2. Sum per page ───
    const pageTotals: Record<string, number> = {};
    let totalEarned = 0;
    let lifetimeGross = 0;
    let lastActivityAt: string | null = null;

    (payments || []).forEach((p) => {
      const net = Number(p.net_amount) || 0;
      const gross = Number(p.amount) || 0;

      totalEarned += net;
      lifetimeGross += gross;

      const id = p.payment_page_id;
      pageTotals[id] = (pageTotals[id] || 0) + net;

      const ts = p.paid_at || p.created_at;
      if (ts && (!lastActivityAt || ts > lastActivityAt)) {
        lastActivityAt = ts;
      }
    });

    // ─── 3. Fetch withdrawals (completed + processing) ───
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("page_withdrawals")
      .select("amount, net_amount, status, created_at")
      .eq("user_id", user.id)
      .in("status", ["completed", "processing"]);

    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError);
    }

    let totalWithdrawn = 0;
    (withdrawals || []).forEach((w) => {
      totalWithdrawn += Number(w.net_amount) || Number(w.amount) || 0;
    });

    // ─── 4. Available balance = completed payments − withdrawals ───
    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    // ─── 5. Response ───
    const responseData = {
      success: true,
      wallet: {
        available_balance: Math.round(availableBalance * 100) / 100,
        pending_balance: 0,
        total_earned: Math.round(totalEarned * 100) / 100,
        total_withdrawn: Math.round(totalWithdrawn * 100) / 100,
        lifetime_gross: Math.round(lifetimeGross * 100) / 100,
        page_totals: pageTotals, // ← per-page sums from completed payments
        last_activity_at: lastActivityAt,
        created_at: null,
        updated_at: new Date().toISOString(),
      },
    };

    if (newTokens) {
      return NextResponse.json(responseData);
    }
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in wallet balance API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}