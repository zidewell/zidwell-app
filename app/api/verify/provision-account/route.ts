// app/api/verify/provision-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createNombaAccount } from "@/lib/nomba";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

const debug = (label: string, data?: any) =>
  console.log(`[/provision] ${label}`, data ?? "");

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
        "id, full_name, email, phone, purpose, is_business_registered, bvn_data, pin_set, bank_account_number"
      )
      .eq("id", userId)
      .single();

    if (userErr || !profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Idempotency: already provisioned
    if (profile.bank_account_number) {
      debug("Already provisioned — returning cached");
      const resp = { success: true, alreadyProvisioned: true };
      if (newTokens) return createAuthResponse(resp, { status: 200, newTokens });
      return NextResponse.json(resp);
    }

    if (!profile.pin_set) {
      return NextResponse.json(
        { error: "Please set your transaction PIN first.", code: "PIN_NOT_SET", step: "pin" },
        { status: 400 }
      );
    }

    const isBusiness = profile.purpose === "business";
    const isRegisteredBusiness =
      isBusiness && profile.is_business_registered === true;

    const bvnData = (profile.bvn_data as any) || {};
    const extractedBvn: string | undefined = bvnData.bvn;
    if (!extractedBvn) {
      return NextResponse.json(
        {
          error: "A BVN is required. Please verify your identity first.",
          code: "MISSING_BVN",
          step: "identity",
        },
        { status: 400 }
      );
    }

    let businessName: string | undefined;
    if (isBusiness) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name, company_name")
        .eq("user_id", userId)
        .maybeSingle();
      businessName = biz?.company_name || biz?.business_name || undefined;
    }

    const accountName =
      isRegisteredBusiness && businessName ? businessName : profile.full_name;

    debug("Creating Nomba account", { accountName, isRegisteredBusiness });

    const nombaResult = await createNombaAccount({
      accountName,
      accountRef: profile.id,
      bvn: extractedBvn,
    });

    if (!nombaResult.ok || !nombaResult.account) {
      console.error("[/provision] Nomba failed:", nombaResult.error);
      return NextResponse.json(
        { error: nombaResult.error || "Account creation failed.", code: "NOMBA_FAILED" },
        { status: 500 }
      );
    }

    const acc = nombaResult.account;

    const update: UserUpdate = {
      bank_name: acc.bankName,
      bank_account_name: acc.bankAccountName,
      bank_account_number: acc.bankAccountNumber,
      wallet_id: acc.accountRef,
      wallet_updated_at: new Date().toISOString(),
      primary_provider: "nomba",
      wallet_provider: "nomba",
      verification_completed: true,
      verification_status: "verified",
      kyc_level: "verified",
    };

    await supabase.from("users").update(update).eq("id", userId);

    if (isRegisteredBusiness) {
      const bizUpdate: BusinessUpdate = {
        bank_name: acc.bankName,
        bank_account_name: acc.bankAccountName,
        bank_account_number: acc.bankAccountNumber,
      };
      await supabase.from("businesses").update(bizUpdate).eq("user_id", userId);
    }

    const responseBody = {
      success: true,
      provider: "nomba",
      accountType: isRegisteredBusiness ? "business" : "personal",
      account: {
        accountNumber: acc.bankAccountNumber,
        accountName: acc.bankAccountName,
        bankName: acc.bankName,
      },
      updates: {
        verificationCompleted: true,
        identityVerified: true,
        bvnVerification: "verified",
        bankName: acc.bankName,
        bankAccountName: acc.bankAccountName,
        bankAccountNumber: acc.bankAccountNumber,
      },
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/provision] Exception:", err.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}