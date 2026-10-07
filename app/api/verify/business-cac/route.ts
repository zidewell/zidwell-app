// app/api/verify/business-cac/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyCACBasic } from "@/lib/prembly";
import type { Database } from "@/types/supabase";

type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const debug = (label: string, data?: any) =>
  console.log(`[/verify/business-cac] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  debug("=== Business CAC verification request received ===");

  try {
    // ─── 1. Authenticate ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      debug("Auth failed — no valid session");
      return NextResponse.json(
        {
          error:
            "Your session has expired. Please log in again and retry.",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    debug("Authenticated", { userId });

    // ─── 2. Parse payload ───
    const body = await req.json().catch(() => ({}));
    const { rcNumber, companyName, companyType } = body;

    if (!rcNumber || !rcNumber.trim()) {
      return NextResponse.json(
        {
          error: "Please enter your CAC registration number.",
          code: "MISSING_RC_NUMBER",
        },
        { status: 400 }
      );
    }

    // Normalize: strip leading RC/BN/IT/LP/LLP if user included it
    const cleanedRc = rcNumber.trim().toUpperCase().replace(/^(RC|BN|IT|LP|LLP)/, "");
    debug("RC number cleaned", { input: rcNumber, cleaned: cleanedRc });

    // ─── 3. Load business record ───
    const supabase = getSupabaseAdmin();

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select(
        "id, user_id, business_name, verification_logs, cac_number, rc_number, company_name, company_status, business_address, cac_data, cac_verified, verification_status, verification_completed, business_kyc_completed, verified_at, verification_reference, verification_id, is_registered"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (bizErr || !business) {
      debug("Business record missing", bizErr);
      return NextResponse.json(
        {
          error:
            "We couldn't find your business profile. Please complete the signup steps first.",
          code: "BUSINESS_NOT_FOUND",
          step: "signup",
        },
        { status: 404 }
      );
    }

    // Snapshot for rollback
    const businessSnapshot: BusinessUpdate = {
      cac_number: business.cac_number,
      rc_number: business.rc_number,
      company_name: business.company_name,
      company_status: business.company_status,
      business_address: business.business_address,
      cac_data: business.cac_data,
      cac_verified: business.cac_verified,
      verification_status: business.verification_status,
      verification_completed: business.verification_completed,
      business_kyc_completed: business.business_kyc_completed,
      verified_at: business.verified_at,
      verification_reference: business.verification_reference,
      verification_id: business.verification_id,
      is_registered: business.is_registered,
    };

    debug("Snapshot captured", businessSnapshot);

    // ─── 4. Call Prembly CAC Basic ───
    debug("Calling Prembly verifyCACBasic", {
      rcNumber: cleanedRc,
      companyType: companyType || "RC",
    });

    let result;
    try {
      result = await verifyCACBasic({
        rcNumber: cleanedRc,
        companyName,
        companyType: companyType || "RC",
      });
    } catch (cacException: any) {
      console.error(
        "[/verify/business-cac] Prembly exception:",
        cacException.message
      );
      return NextResponse.json(
        {
          error:
            "Our verification service is temporarily unavailable. Please try again in a moment.",
          code: "PREMBLY_UNREACHABLE",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ─── 5. Failure path ───
    if (!result.ok) {
      debug("CAC verification failed", result.error);

      // Log the failed attempt
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

      // Translate to user-friendly message
      const lowerErr = (result.error || "").toLowerCase();
      let userMessage = "We couldn't verify your CAC number. Please double-check it and try again.";

      if (lowerErr.includes("not found") || lowerErr.includes("record")) {
        userMessage =
          "We couldn't find a company with that RC number. Please check the number on your CAC certificate and try again.";
      } else if (lowerErr.includes("mismatch")) {
        userMessage =
          "The RC number doesn't match the company on record. Please confirm it's correct.";
      } else if (lowerErr.includes("inactive") || lowerErr.includes("dissolved")) {
        userMessage =
          "The company on record appears inactive or dissolved. Please contact support for assistance.";
      } else if (result.error) {
        userMessage = result.error;
      }

      return NextResponse.json(
        {
          error: userMessage,
          code: "CAC_VERIFICATION_FAILED",
          retryable: true,
        },
        { status: 400 }
      );
    }

    // ─── 6. Success path ───
    const data: any = result.data || {};
    const verification = result.verification;
    const reference: string | null = verification?.reference ?? null;

    debug("CAC verified", {
      companyName: data.company_name,
      rcNumber: data.rc_number,
      status: data.company_status,
      reference,
    });

    const logs: any[] = Array.isArray(business.verification_logs)
      ? business.verification_logs
      : [];

    const businessUpdate: BusinessUpdate = {
      cac_number: data.rc_number || cleanedRc,
      rc_number: data.rc_number || cleanedRc,
      company_name: data.company_name || null,
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
      verification_logs: [
        ...logs,
        {
          step: "cac",
          provider: "prembly",
          status: "success",
          rc_number: data.rc_number || cleanedRc,
          reference,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const { error: updateErr } = await supabase
      .from("businesses")
      .update(businessUpdate)
      .eq("id", business.id);

    if (updateErr) {
      console.error(
        "[/verify/business-cac] Business update failed:",
        updateErr.message
      );

      // Rollback: restore snapshot
      try {
        debug("Rolling back business snapshot");
        await supabase
          .from("businesses")
          .update(businessSnapshot)
          .eq("id", business.id);
      } catch (rollbackErr: any) {
        console.error(
          "[/verify/business-cac] Rollback failed:",
          rollbackErr.message
        );
      }

      return NextResponse.json(
        {
          error:
            "We couldn't save your CAC verification. Your progress is safe — please try again.",
          code: "DB_UPDATE_FAILED",
          retryable: true,
        },
        { status: 500 }
      );
    }

    // ─── 7. Mirror flag on user ───
    const userUpdate: UserUpdate = {
      is_business_registered: true,
    };

    const { error: userUpdateErr } = await supabase
      .from("users")
      .update(userUpdate)
      .eq("id", userId);

    if (userUpdateErr) {
      console.error(
        "[/verify/business-cac] User mirror update failed (non-fatal):",
        userUpdateErr.message
      );
      // Not rolling back — business row is the source of truth
    }

    debug("CAC verified and saved", { businessId: business.id });

    // ─── 8. Respond ───
    const responseBody = {
      success: true,
      companyName: data.company_name,
      rcNumber: data.rc_number || cleanedRc,
      reference,
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/verify/business-cac] Unhandled exception:", {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error:
          "Something unexpected happened during business verification. Please try again.",
        code: "UNEXPECTED_ERROR",
        retryable: true,
      },
      { status: 500 }
    );
  }
}