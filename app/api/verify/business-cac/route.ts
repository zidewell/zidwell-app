// app/api/verify/business-cac/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyCACBasic } from "@/lib/prembly";
import { compareNames } from "@/lib/name-match";
import { checkAndIncrement, CAC_RATE_LIMIT } from "@/lib/rate-limit-verify";
import type { Database } from "@/types/supabase";

type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const NAME_MATCH_THRESHOLD = 0.6;

const debug = (label: string, data?: any) =>
  console.log(`[/verify/business-cac] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again.", code: "SESSION_EXPIRED" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const { rcNumber } = body as { rcNumber?: string };

    if (!rcNumber || !rcNumber.trim()) {
      return NextResponse.json(
        { error: "Please enter your CAC registration number.", code: "MISSING_RC" },
        { status: 400 }
      );
    }

    const cleanedRc = rcNumber.trim().toUpperCase().replace(/^(RC|BN|IT|LP|LLP)/, "");

    const supabase = getSupabaseAdmin();

    // ─── Load business + idempotency ───
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select(
        "id, user_id, business_name, signup_business_name, cac_verified, verification_logs, cac_number"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (bizErr || !business) {
      return NextResponse.json(
        { error: "Business record not found. Complete signup first.", code: "BUSINESS_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (business.cac_verified) {
      const cachedName = business.business_name || "Business";
      const resp = {
        success: true,
        verifiedBusinessName: cachedName,
        nameMatched: true,
        nameMismatch: false,
        cached: true,
      };
      if (newTokens) return createAuthResponse(resp, { status: 200, newTokens });
      return NextResponse.json(resp);
    }

    // ─── Rate limit ───
    const rate = await checkAndIncrement(userId, "cac", CAC_RATE_LIMIT);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Too many CAC attempts. Please try again in ${Math.ceil(
            (rate.retryAfterSeconds || 0) / 60
          )} minutes.`,
          code: "RATE_LIMITED",
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // ─── Call Prembly ───
    const result = await verifyCACBasic({ rcNumber: cleanedRc, companyType: "RC" });

    if (!result.ok) {
      debug("CAC failed", result.error);

      const logs: any[] = Array.isArray(business.verification_logs)
        ? business.verification_logs
        : [];
      await supabase
        .from("businesses")
        .update({
          verification_logs: [
            ...logs,
            {
              step: "cac",
              provider: "prembly",
              status: "failed",
              rc_number: cleanedRc,
              message: result.error,
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq("id", business.id);

      const lowerErr = (result.error || "").toLowerCase();
      let message = "We couldn't verify your CAC number. Please check it and try again.";
      if (lowerErr.includes("not found") || lowerErr.includes("record")) {
        message =
          "We couldn't find a company with that RC number. Check the number on your CAC certificate.";
      } else if (lowerErr.includes("inactive") || lowerErr.includes("dissolved")) {
        message =
          "The company on record appears inactive or dissolved. Please contact support.";
      }

      return NextResponse.json(
        { error: message, code: "CAC_VERIFICATION_FAILED" },
        { status: 400 }
      );
    }

    const data: any = result.data || {};
    const verification = result.verification;
    const reference = verification?.reference ?? null;
    const cacCompanyName = (data.company_name || "").trim();

    // ─── Name reconciliation ───
    const signupName = business.signup_business_name || business.business_name || "";
    const nameResult = compareNames(signupName, cacCompanyName, {
      stripCorporate: true,
      threshold: NAME_MATCH_THRESHOLD,
    });

    debug("CAC name reconciliation", {
      signupName,
      cacCompanyName,
      score: nameResult.score,
      matched: nameResult.matched,
    });

    const verifiedBusinessName = (cacCompanyName || signupName || "").toUpperCase();

    // ─── Save ───
    const logs: any[] = Array.isArray(business.verification_logs)
      ? business.verification_logs
      : [];

    const businessUpdate: BusinessUpdate = {
      cac_number: data.rc_number || cleanedRc,
      rc_number: data.rc_number || cleanedRc,
      company_name: cacCompanyName || null,
      company_status: data.company_status || null,
      business_address: data.company_address || null,
      cac_data: data,
      cac_verified: true,
      verification_status: "verified",
      verification_completed: true,
      business_kyc_completed: true,
      verified_at: new Date().toISOString(),
      verification_reference: reference,
      verification_id: reference,
      is_registered: true,
      // Overwrite with CAC-verified name
      business_name: verifiedBusinessName,
      // Preserve original for audit
      signup_business_name: business.signup_business_name || business.business_name,
      name_mismatch: !nameResult.matched,
      verification_logs: [
        ...logs,
        {
          step: "cac",
          provider: "prembly",
          status: "success",
          rc_number: data.rc_number || cleanedRc,
          reference,
          signup_business_name: signupName,
          cac_verified_name: cacCompanyName,
          name_match_score: Number(nameResult.score.toFixed(3)),
          name_matched: nameResult.matched,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const { error: updateErr } = await supabase
      .from("businesses")
      .update(businessUpdate)
      .eq("id", business.id);

    if (updateErr) {
      console.error("[/verify/business-cac] Update error:", updateErr);
      return NextResponse.json(
        { error: "We couldn't save your CAC verification. Please try again.", code: "DB_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    // ─── Mirror on users ───
    const userUpdate: UserUpdate = { is_business_registered: true };
    await supabase.from("users").update(userUpdate).eq("id", userId);

    const responseBody = {
      success: true,
      verifiedBusinessName,
      companyStatus: data.company_status || null,
      nameMatched: nameResult.matched,
      nameMismatch: !nameResult.matched,
      reference,
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/verify/business-cac] Exception:", err.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}