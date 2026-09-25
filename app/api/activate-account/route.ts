// app/api/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import { processActivation } from "@/lib/activation";
import { getBank78Token } from "@/lib/bank78";

export async function POST(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin() as any;

    // ─── Load account number + activation state ───
    const { data: profile } = await supabase
      .from("users")
      .select(
        "bank78_personal_account_number, bank78_business_account_number, activation_paid"
      )
      .eq("id", user.id)
      .single();

    if (profile?.activation_paid) {
      const body = { success: true, activation: { activated: true } };
      if (newTokens) {
        return createAuthResponse(body, { status: 200, newTokens });
      }
      return NextResponse.json(body);
    }

    const accountNumber =
      profile?.bank78_business_account_number ||
      profile?.bank78_personal_account_number;

    if (!accountNumber) {
      return NextResponse.json(
        { error: "No Bank78 account found for this user" },
        { status: 400 }
      );
    }

    // ─── Ask Bank78 for the current balance ───
    const token = await getBank78Token();

    const balanceRes = await fetch(
      `${process.env.BANK78_BASE_URL}/sub-account/api/v1/accounts/${accountNumber}/balance`,
      {
        headers: {
          "x-api-key": process.env.BANK78_API_KEY!,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!balanceRes.ok) {
      const errText = await balanceRes.text();
      console.error("[/api/activate] Balance fetch failed:", errText);
      return NextResponse.json(
        { error: "Could not fetch balance from provider" },
        { status: 502 }
      );
    }

    const balanceData = await balanceRes.json();
    const balance = Number(
      balanceData?.result?.balance ?? balanceData?.data?.balance ?? 0
    );

    const result = await processActivation({
      userId: user.id,
      inflowAmount: balance,
      inflowReference: `manual_check_${user.id}_${Date.now()}`,
    });

    const body = { success: true, activation: result };
    if (newTokens) {
      return createAuthResponse(body, { status: 200, newTokens });
    }
    return NextResponse.json(body);
  } catch (err: any) {
    console.error("[/api/activate] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}