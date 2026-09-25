// app/api/verify/identity/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import { getPremblySession, extractIdentityNumbers } from "@/lib/prembly";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function POST(req: NextRequest) {
  try {
    // ─── 1. Authenticate ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No valid session found" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ─── 2. Read payload ───
    const body = await req.json().catch(() => ({}));
    const premblyResponse = body?.premblyResponse;

    if (!premblyResponse) {
      return NextResponse.json(
        { error: "premblyResponse is required" },
        { status: 400 }
      );
    }

    const isSuccess =
      premblyResponse.code === "00" && premblyResponse.status === "success";

    if (!isSuccess) {
      return NextResponse.json(
        {
          error:
            premblyResponse.message ||
            "Identity verification was not successful",
        },
        { status: 400 }
      );
    }

    // ─── 3. Resolve channel / reference / data ───
    let channel: string = (premblyResponse.channel || "").toUpperCase();
    let reference: string | null =
      premblyResponse?.verification?.reference || null;
    let verifiedData: any = premblyResponse?.data || {};
    let extractedBvn: string | undefined;
    let extractedNin: string | undefined;

    // Stage 1 — extract from SDK response
    const sdkIds = extractIdentityNumbers(premblyResponse);
    extractedBvn = sdkIds.bvn;
    extractedNin = sdkIds.nin;

    // Stage 2 — enrich from session fetch
    const sessionId = premblyResponse?.session_id;
    let sessionResult: Awaited<ReturnType<typeof getPremblySession>> | null =
      null;

    if (!extractedBvn && !extractedNin && sessionId) {
      sessionResult = await getPremblySession(sessionId);

      if (sessionResult.ok && sessionResult.session) {
        const s = sessionResult.session;

        // ─── CHANNEL from metadata (BVN or NIN) ───
        const metaChannel =
          s?.metadata?.sdk_verification_details?.data?.channel ||
          s?.verification_data?.last_verification_channel ||
          "";
        channel = channel || (metaChannel || "").toUpperCase();

        // ─── REFERENCE ───
        reference =
          reference ||
          s?.verification?.reference ||
          s.session_id ||
          null;

        // ─── VERIFIED DATA (fallback to session's verification_data) ───
        if (Object.keys(verifiedData || {}).length === 0) {
          verifiedData = s.verification_data || s.data || {};
        }

        // ─── Extract BVN/NIN from session ───
        const sessionIds = extractIdentityNumbers(s);
        extractedBvn = extractedBvn || sessionIds.bvn;
        extractedNin = extractedNin || sessionIds.nin;
      }
    }

    channel = channel || "BVN";
    reference = reference || sessionId || null;

    // ─── 4. Load user row ───
    const supabase = getSupabaseAdmin();

    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, verification_logs, bvn_data")
      .eq("id", userId)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ─── 5. Build merged bvn_data payload ───
    const mergedBvnData = {
      ...((existingUser.bvn_data as any) || {}),
      ...(verifiedData || {}),
      ...(extractedBvn ? { bvn: extractedBvn } : {}),
      ...(extractedNin ? { nin: extractedNin } : {}),
    };

    // ─── 6. Build DB update ───
    const existingLogs: any[] = Array.isArray(existingUser.verification_logs)
      ? existingUser.verification_logs
      : [];

    const update: UserUpdate = {
      verification_status: "verified",
      identity_verified: true,
      kyc_level: "verified",
      verified_at: new Date().toISOString(),
      verification_provider: "prembly",
      verification_reference: reference,
      verification_id: reference,
      bvn_data: mergedBvnData,
      verification_logs: [
        ...existingLogs,
        {
          step: "identity",
          provider: "prembly",
          channel,
          status: "success",
          reference,
          session_id: sessionId || null,
          bvn_captured: !!extractedBvn,
          nin_captured: !!extractedNin,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (channel === "NIN") {
      update.nin_verification = "verified";
      if (extractedNin) update.nin = extractedNin;
    } else {
      update.bvn_verification = "verified";
    }

    // ─── 7. Persist ───
    const { error: updateError } = await supabase
      .from("users")
      .update(update)
      .eq("id", userId);

    if (updateError) {
      console.error("[/api/verify/identity] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save identity verification" },
        { status: 500 }
      );
    }

    // ─── 8. Respond ───
    const responseBody = {
      success: true,
      userId,
      channel,
      reference,
      hasBvn: !!extractedBvn,
      hasNin: !!extractedNin,
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/api/verify/identity] Exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}