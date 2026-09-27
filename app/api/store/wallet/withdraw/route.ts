// app/api/store/wallet/withdraw/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WITHDRAWAL_FEE = 0;

export async function POST(request: Request) {
  try {
    // ─── 1. Parse body ───
    const body = await request.json();
    const numericAmount = Number(body.amount);

    if (
      !body.amount ||
      isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Please enter a valid amount" },
        { status: 400 }
      );
    }

    // ─── 2. Auth ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(
      request as any
    );

    if (!user) {
      const response = NextResponse.json(
        { error: "Please login to withdraw funds", logout: true },
        { status: 401 }
      );
      if (newTokens)
        return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── 3. BVN verification ───
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("bvn_verification")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.bvn_verification !== "verified") {
      return NextResponse.json(
        {
          error: "BVN verification required to withdraw funds",
          requiresBvnVerification: true,
        },
        { status: 403 }
      );
    }

    // ─── 4. Call wallet-withdrawal RPC ───
    const { data: result, error: withdrawError } = await supabase.rpc(
      "withdraw_from_store_wallet",
      {
        p_user_id: user.id,
        p_amount: numericAmount,
        p_fee: WITHDRAWAL_FEE,
      }
    );

    if (withdrawError) {
      console.error("Withdrawal error:", withdrawError);

      const message = withdrawError.message || "";

      if (message.includes("Insufficient wallet balance")) {
        return NextResponse.json(
          { error: message.replace(/^.*?:\s*/, "") },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: message || "Withdrawal failed" },
        { status: 400 }
      );
    }

    // ─── 5. Success ───
    const responseData = {
      success: true,
      message: `Withdrawal of ₦${numericAmount.toLocaleString()} completed successfully!`,
      withdrawal: {
        amount: numericAmount,
        fee: WITHDRAWAL_FEE,
        netAmount: numericAmount,
        reference: result?.reference || `WDR-${Date.now()}`,
      },
      wallet: {
        new_balance: Number(result?.new_balance) || 0,
      },
    };

    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}