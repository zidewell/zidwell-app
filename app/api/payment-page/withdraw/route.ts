// app/api/payment-page/withdraw/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Updated constants
const MIN_WITHDRAWAL = 1000;
const WITHDRAWAL_FEE = 0;

export async function POST(request: Request) {
  try {
    const { pageId, amount } = await request.json();

    if (!pageId || !amount || amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Invalid withdrawal amount. Minimum ₦${MIN_WITHDRAWAL.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json(
        { error: "Please login to withdraw funds", logout: true },
        { status: 401 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // Check BVN verification
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("bvn_verification")
      .eq("id", user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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

    // ✅ Check store owner wallet balance
    const { data: wallet, error: walletError } = await supabase.rpc(
      "get_store_owner_wallet_balance",
      { p_user_id: user.id }
    );

    const availableBalance = Number(wallet?.available_balance || 0);

    if (availableBalance < amount) {
      return NextResponse.json(
        {
          error: "Insufficient balance in store owner wallet",
          available: availableBalance,
          requested: amount,
          shortfall: amount - availableBalance,
        },
        { status: 400 }
      );
    }

    // ✅ Call the withdraw function - NO FEE
    const { data: result, error: withdrawError } = await supabase.rpc(
      "withdraw_page_to_main_wallet",
      {
        p_page_id: pageId,
        p_user_id: user.id,
        p_amount: amount,
        p_fee: WITHDRAWAL_FEE, // ✅ 0 - FREE
      }
    );

    if (withdrawError) {
      console.error("Withdrawal error:", withdrawError);
      return NextResponse.json(
        { error: withdrawError.message || "Withdrawal failed" },
        { status: 400 }
      );
    }

    // ✅ Get updated wallet balance
    const { data: updatedWallet, error: updatedWalletError } = await supabase.rpc(
      "get_store_owner_wallet_balance",
      { p_user_id: user.id }
    );

    const responseData = {
      success: true,
      message: `Withdrawal of ₦${amount.toLocaleString()} completed successfully!`,
      withdrawal: {
        amount: amount,
        fee: WITHDRAWAL_FEE, // ✅ 0 - FREE
        netAmount: amount,
        reference: result?.reference || `WDR-${Date.now()}`,
      },
      wallet: {
        new_balance: updatedWallet?.available_balance || 0,
        total_withdrawn: updatedWallet?.total_withdrawn || 0,
      },
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
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