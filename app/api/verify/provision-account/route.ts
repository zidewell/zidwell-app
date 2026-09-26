// app/api/verify/provision-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import { createBank78Wallet } from "@/lib/bank78";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function POST(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, purpose, is_business_registered, bvn_data, pin_set"
      )
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!profile.pin_set) {
      return NextResponse.json(
        { error: "Transaction PIN must be set before creating an account" },
        { status: 400 }
      );
    }

    const isBusiness =
      profile.purpose === "business" &&
      profile.is_business_registered === true;

    const { first, last } = splitName(profile.full_name || "Zidwell User");
    const bvnData = (profile.bvn_data as any) || {};
    const bvn: string | undefined = bvnData.bvn;
    const nin: string | undefined = bvnData.nin;

    if (!bvn && !nin) {
      return NextResponse.json(
        {
          error:
            "We couldn't find your BVN/NIN from verification. Please contact support.",
          code: "MISSING_IDENTITY",
        },
        { status: 400 }
      );
    }

    let accountName = profile.full_name || "Zidwell User";
    if (isBusiness) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name, company_name")
        .eq("user_id", user.id)
        .maybeSingle();
      accountName = biz?.company_name || biz?.business_name || accountName;
    }

    const result = await createBank78Wallet({
      userId: profile.id,
      firstName: first,
      lastName: last,
      email: profile.email,
      phone: profile.phone,
      bvn,
      nin,
      accountName,
      accountType: 1,
    });

    if (!result.ok || !result.wallet) {
      console.error("[provision] Bank78 failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Bank78 wallet creation failed" },
        { status: 500 }
      );
    }

    const w = result.wallet;

    const update: Record<string, any> = {
      bank78_verified: true,
      bank78_verified_at: new Date().toISOString(),
      primary_provider: "bank78",
      wallet_provider: "bank78",
      verification_completed: true,
      verification_status: "verified",
      kyc_level: "verified",
    };

    if (isBusiness) {
      update.bank78_business_account_id = w.accountReference;
      update.bank78_business_account_number = w.accountNumber;
      update.bank78_business_account_name = w.accountName;
      update.bank78_business_bank_name = w.bankName;
    } else {
      update.bank78_personal_account_id = w.accountReference;
      update.bank78_personal_account_number = w.accountNumber;
      update.bank78_personal_account_name = w.accountName;
      update.bank78_personal_bank_name = w.bankName;
    }

    await supabase.from("users").update(update).eq("id", user.id);

    if (isBusiness) {
      await supabase
        .from("businesses")
        .update({
          bank78_account_id: w.accountReference,
          bank78_account_number: w.accountNumber,
          bank78_account_name: w.accountName,
          bank78_bank_name: w.bankName,
        })
        .eq("user_id", user.id);
    }

    const responseBody = {
      success: true,
      provider: "bank78",
      accountType: isBusiness ? "business" : "personal",
      account: {
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        bankName: w.bankName,
        bankCode: w.bankCode,
      },
    };

    if (newTokens) return createAuthResponse(responseBody, { status: 200, newTokens });
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[provision] exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}