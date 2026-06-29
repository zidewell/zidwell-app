// app/api/find-user-wallet-id/route.ts
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
      return NextResponse.json(
        { error: "Account Number is required" }, 
        { status: 400 }
      );
    }

    // Query user by bank_account_number
    const { data: foundUser, error } = await supabase
      .from("users")
      .select("id, full_name, wallet_id, first_name, last_name, bank_account_number")
      .eq("bank_account_number", accNumber)
      .single();

    if (error || !foundUser) {
      console.error("User lookup error:", error);
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Check if user is trying to transfer to themselves
    if (foundUser.id === user.id) {
      return NextResponse.json(
        { error: "You cannot transfer to your own account" },
        { status: 400 }
      );
    }

    // Get display name with proper fallback
    let receiverName = foundUser.full_name;
    
    // If full_name is null or empty, try to construct from first_name and last_name
    if (!receiverName || receiverName.trim() === '') {
      const firstName = foundUser.first_name || '';
      const lastName = foundUser.last_name || '';
      const constructedName = `${firstName} ${lastName}`.trim();
      receiverName = constructedName || 'Zidwell User';
    }

    const responseData = {
      walletId: foundUser.wallet_id,
      receiverId: foundUser.id,
      receiverName: receiverName,
      full_name: receiverName, // For backward compatibility
      accountNumber: foundUser.bank_account_number,
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
  return NextResponse.json(
    { error: "Method not allowed. Use POST." }, 
    { status: 405 }
  );
}