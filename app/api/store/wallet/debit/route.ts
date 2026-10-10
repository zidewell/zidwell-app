// app/api/store/wallet/debit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to withdraw", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, purpose, description, reference, bankDetails } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₦1,000" },
        { status: 400 }
      );
    }

    // Check if user has verified BVN
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

    // Check wallet balance first
    const { data: walletBalance, error: balanceError } = await supabase.rpc(
      "get_store_owner_wallet_balance",
      { p_user_id: user.id }
    );

    if (balanceError || !walletBalance) {
      return NextResponse.json(
        { error: "Unable to check wallet balance" },
        { status: 500 }
      );
    }

    const availableBalance = Number(walletBalance?.available_balance || 0);

    if (availableBalance < amount) {
      return NextResponse.json(
        { 
          error: "Insufficient balance",
          available: availableBalance,
          requested: amount,
          shortfall: amount - availableBalance,
        },
        { status: 400 }
      );
    }

    // Debit wallet using RPC
    const { data: result, error } = await supabase.rpc(
      "debit_store_owner_wallet",
      {
        p_user_id: user.id,
        p_amount: amount,
        p_purpose: purpose || "withdrawal",
        p_description: description || `Withdrawal to ${bankDetails?.bankName || 'bank'}`,
        p_reference: reference || `WDR-${Date.now()}`,
      }
    );

    if (error) {
      console.error("Error debiting wallet:", error);
      return NextResponse.json(
        { error: error.message || "Failed to process withdrawal" },
        { status: 500 }
      );
    }

    // Here you would call your bank transfer API
    // const transferResult = await initiateBankTransfer({...});

    const responseData = {
      success: true,
      message: "Withdrawal processed successfully",
      data: {
        amount: result?.amount || amount,
        fee: result?.fee || 0,
        net_amount: result?.net_amount || 0,
        new_balance: result?.new_balance || 0,
        total_withdrawn: result?.total_withdrawn || 0,
        wallet_id: result?.wallet_id,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in debit wallet API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}