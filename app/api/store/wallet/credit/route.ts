// app/api/store/wallet/credit/route.ts

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
        { error: "Please login to credit wallet", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, source, sourceId, description } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Credit wallet using RPC
    const { data: result, error } = await supabase.rpc(
      "credit_store_owner_wallet",
      {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source || "manual",
        p_source_id: sourceId || null,
        p_description: description || "Manual credit",
      }
    );

    if (error) {
      console.error("Error crediting wallet:", error);
      return NextResponse.json(
        { error: error.message || "Failed to credit wallet" },
        { status: 500 }
      );
    }

    const responseData = {
      success: true,
      message: "Wallet credited successfully",
      data: {
        amount: result?.amount || amount,
        new_balance: result?.new_balance || 0,
        total_earned: result?.total_earned || 0,
        wallet_id: result?.wallet_id,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in credit wallet API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}