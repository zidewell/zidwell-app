// app/api/verify/provision-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import { createBank78Account } from "@/lib/bank78";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];

function splitName(fullName: string): { first: string; last: string } {
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

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    const { data: profile, error: userErr } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, purpose, is_business_registered, bvn_data, pin_set"
      )
      .eq("id", userId)
      .single();

    if (userErr || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  [provision] profile.bvn_data as stored in DB            ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log(JSON.stringify(profile.bvn_data, null, 2));
    console.log("");

    if (!profile.pin_set) {
      return NextResponse.json(
        { error: "Transaction PIN must be set before creating an account" },
        { status: 400 }
      );
    }

    const isRegisteredBusiness =
      profile.purpose === "business" &&
      profile.is_business_registered === true;

    const { first, last } = splitName(profile.full_name || "Zidwell User");

    const bvnData = (profile.bvn_data as any) || {};
    const extractedBvn: string | undefined = bvnData.bvn;
    const extractedNin: string | undefined = bvnData.nin;

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  [provision] Extracted identity                          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("extractedBvn:", extractedBvn || "(not found)");
    console.log("extractedNin:", extractedNin || "(not found)");
    console.log("");

    if (!extractedBvn && !extractedNin) {
      return NextResponse.json(
        {
          error:
            "We couldn't find your BVN from the verification. Please contact support.",
          code: "MISSING_IDENTITY",
        },
        { status: 400 }
      );
    }

    // Resolve the account name. For business accounts we prefer the
    // registered company name; for personal accounts we use the user's
    // full name.
    let accountName = profile.full_name || "Zidwell User";

    if (isRegisteredBusiness) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name, company_name")
        .eq("user_id", userId)
        .maybeSingle();
      accountName =
        biz?.company_name || biz?.business_name || profile.full_name;
    }

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  [provision] Bank78 Virtual NUBAN request                ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log(
      JSON.stringify(
        {
          accountReference: `ZIDWELL-${profile.id}`,
          accountName,
          firstName: first,
          lastName: last,
          email: profile.email,
          phone: profile.phone,
          accountType: 1, // static
          bvn: extractedBvn || "(missing)",
          nin: extractedNin || "(missing)",
        },
        null,
        2
      )
    );
    console.log("");

    const result = await createBank78Account({
      userId: profile.id,
      firstName: first,
      lastName: last,
      email: profile.email,
      phone: profile.phone,
      bvn: extractedBvn,
      nin: extractedNin,
      accountName,
      accountType: 1, // static virtual NUBAN = permanent wallet account
    });

    if (!result.ok || !result.account) {
      console.error(
        "[/api/verify/provision-account] Bank78 failed:",
        result.error
      );
      return NextResponse.json(
        { error: result.error || "Bank78 account creation failed" },
        { status: 500 }
      );
    }

    const acc = result.account;

    const update: UserUpdate = {
      bank78_verified: true,
      bank78_verified_at: new Date().toISOString(),
      primary_provider: "bank78",
      wallet_provider: "bank78",
      verification_completed: true,
      verification_status: "verified",
      kyc_level: "verified",
    };

    if (isRegisteredBusiness) {
      // NOTE: Bank78's Virtual NUBAN API does not return a userId, so we
      // store our own internal id / accountReference instead.
      update.bank78_business_account_id = acc.accountReference ?? profile.id;
      update.bank78_business_account_number = acc.accountNumber;
      update.bank78_business_account_name = acc.accountName;
      update.bank78_business_bank_name = acc.bankName;
    } else {
      update.bank78_personal_account_id = acc.accountReference ?? profile.id;
      update.bank78_personal_account_number = acc.accountNumber;
      update.bank78_personal_account_name = acc.accountName;
      update.bank78_personal_bank_name = acc.bankName;
    }

    await supabase.from("users").update(update).eq("id", userId);

    if (isRegisteredBusiness) {
      const bizUpdate: BusinessUpdate = {
        bank78_account_id: acc.accountReference ?? profile.id,
        bank78_account_number: acc.accountNumber,
        bank78_account_name: acc.accountName,
        bank78_bank_name: acc.bankName,
      };

      await supabase
        .from("businesses")
        .update(bizUpdate)
        .eq("user_id", userId);
    }

    const responseBody = {
      success: true,
      provider: "bank78",
      accountType: isRegisteredBusiness ? "business" : "personal",
      account: {
        accountNumber: acc.accountNumber,
        accountName: acc.accountName,
        bankName: acc.bankName,
        bankCode: acc.bankCode,
      },
      updates: {
        verificationCompleted: true,
        identityVerified: true,
        bvnVerification: "verified",
        bank78Verified: true,
        bankName: acc.bankName,
        bankAccountName: acc.accountName,
        bankAccountNumber: acc.accountNumber,
      },
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/api/verify/provision-account] Exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}