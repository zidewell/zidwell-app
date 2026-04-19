// app/api/payment-page/withdraw/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(request: Request) {
  try {
    const { pageId, amount } = await request.json();

    if (!pageId || !amount || amount < 1000) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount. Minimum ₦1,000" },
        { status: 400 }
      );
    }

    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json({ error: "Please login to withdraw funds", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // Call the withdraw function
    const { data: result, error: withdrawError } = await supabase.rpc(
      "withdraw_page_to_main_wallet",
      {
        p_page_id: pageId,
        p_user_id: user.id,
        p_amount: amount,
      }
    );

    if (withdrawError) {
      console.error("Withdrawal error:", withdrawError);
      return NextResponse.json(
        { error: withdrawError.message },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      withdrawal: result,
    });

    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  } catch (error: any) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}