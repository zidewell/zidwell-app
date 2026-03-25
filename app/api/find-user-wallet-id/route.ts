// app/api/get-user-by-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { accNumber } = await req.json();

    if (!accNumber) {
      return NextResponse.json({ error: "Account Number is required" }, { status: 400 });
    }

    const { data: foundUser, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, wallet_id, full_name")
      .eq("bank_account_number", accNumber)
      .single();

    if (error || !foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fixed: Properly construct receiver name with proper fallback
    const receiverName = foundUser.full_name 
      ? foundUser.full_name 
      : `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim() || "Unknown User";

    const responseData = {
      receiverId: foundUser.id,
      receiverName: receiverName,
      walletId: foundUser.wallet_id,
    };
    
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}