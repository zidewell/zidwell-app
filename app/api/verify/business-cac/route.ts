// app/api/verify/business-cac/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import { verifyCACBasic } from "@/lib/prembly";
import type { Database } from "@/types/supabase";

type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function POST(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { rcNumber, companyName, companyType } = await req.json();

    if (!rcNumber) {
      return NextResponse.json(
        { error: "rcNumber is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, user_id, business_name, verification_logs")
      .eq("user_id", userId)
      .maybeSingle();

    if (bizErr || !business) {
      return NextResponse.json(
        { error: "Business record not found. Complete signup first." },
        { status: 404 }
      );
    }

    const result = await verifyCACBasic({
      rcNumber,
      companyName,
      companyType: companyType || "RC",
    });

    // ─── Failure ───
    if (!result.ok) {
      const logs: any[] = Array.isArray(business.verification_logs)
        ? business.verification_logs
        : [];

      const failedUpdate: BusinessUpdate = {
        verification_logs: [
          ...logs,
          {
            step: "cac",
            provider: "prembly",
            status: "failed",
            message: result.error,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await supabase
        .from("businesses")
        .update(failedUpdate)
        .eq("id", business.id);

      return NextResponse.json(
        { error: result.error || "CAC verification failed" },
        { status: 400 }
      );
    }

    // ─── Success ───
    const data: any = result.data || {};
    const verification = result.verification;
    const reference: string | null = verification?.reference ?? null;

    const logs: any[] = Array.isArray(business.verification_logs)
      ? business.verification_logs
      : [];

    const businessUpdate: BusinessUpdate = {
      cac_number: data.rc_number || rcNumber,
      rc_number: data.rc_number || rcNumber,
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
      console.error("[/api/verify/business-cac] Update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to save CAC data" },
        { status: 500 }
      );
    }

    const userUpdate: UserUpdate = {
      is_business_registered: true,
    };

    await supabase.from("users").update(userUpdate).eq("id", userId);

    const responseBody = {
      success: true,
      companyName: data.company_name,
      rcNumber: data.rc_number || rcNumber,
      reference,
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/api/verify/business-cac] Exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}