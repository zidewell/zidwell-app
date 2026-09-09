// app/api/store/wallet/transactions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to view transactions", logout: true },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .in("type", ["store_wallet_credit", "store_wallet_debit"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type === "credit" ? "store_wallet_credit" : "store_wallet_debit");
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    const responseData = {
      success: true,
      transactions: transactions || [],
      pagination: {
        limit,
        offset,
        total: count || transactions?.length || 0,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in transactions API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}