// app/api/verify/identity/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPremblySession, extractIdentityNumbers } from "@/lib/prembly";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const debug = (label: string, data?: any) =>
  console.log(`[/verify/identity] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  debug("=== Identity verification request received ===");

  try {
    // ─── 1. Authenticate ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      debug("Auth failed — no valid session");
      return NextResponse.json(
        {
          error:
            "Your session has expired. Please log in again and retry verification.",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    debug("Authenticated", { userId });

    // ─── 2. Parse payload ───
    const body = await req.json().catch(() => ({}));
    const premblyResponse = body?.premblyResponse;

    debug("Prembly payload received", {
      code: premblyResponse?.code,
      status: premblyResponse?.status,
      sessionId: premblyResponse?.session_id,
    });

    if (!premblyResponse) {
      return NextResponse.json(
        {
          error:
            "We didn't receive your verification result. Please try the identity step again.",
          code: "MISSING_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const isSuccess =
      premblyResponse.code === "00" && premblyResponse.status === "success";

    if (!isSuccess) {
      debug("Prembly returned non-success", {
        code: premblyResponse.code,
        status: premblyResponse.status,
        message: premblyResponse.message,
      });

      // Translate Prembly cancel / fail codes into user-friendly messages
      if (premblyResponse.code === "E02") {
        return NextResponse.json(
          {
            error:
              "You cancelled the verification. You can retry whenever you're ready.",
            code: "VERIFICATION_CANCELLED",
          },
          { status: 400 }
        );
      }

      if (premblyResponse.code === "E01") {
        return NextResponse.json(
          {
            error:
              premblyResponse.message ||
              "Verification failed. Please double-check your details and try again.",
            code: "VERIFICATION_FAILED",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            premblyResponse.message ||
            "We couldn't complete your verification. Please try again.",
          code: "VERIFICATION_FAILED",
        },
        { status: 400 }
      );
    }

    // ─── 3. Resolve identity fields ───
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

    debug("Stage 1 (SDK) extraction", {
      bvn: extractedBvn || "(not found)",
      nin: extractedNin || "(not found)",
    });

    // Stage 2 — enrich from session fetch
    const sessionId = premblyResponse?.session_id;
    let sessionResult: Awaited<ReturnType<typeof getPremblySession>> | null =
      null;

    if (!extractedBvn && !extractedNin && sessionId) {
      debug("Fetching full session from Prembly", sessionId);

      try {
        sessionResult = await getPremblySession(sessionId);
      } catch (sessionErr: any) {
        console.error(
          "[/verify/identity] Session fetch threw:",
          sessionErr.message
        );
        sessionResult = null;
      }

      if (sessionResult?.ok && sessionResult.session) {
        const s = sessionResult.session;

        // Channel from metadata
        const metaChannel =
          s?.metadata?.sdk_verification_details?.data?.channel ||
          s?.verification_data?.last_verification_channel ||
          "";
        channel = channel || (metaChannel || "").toUpperCase();

        // Reference
        reference =
          reference ||
          s?.verification?.reference ||
          s.session_id ||
          null;

        // Verified data
        if (Object.keys(verifiedData || {}).length === 0) {
          verifiedData = s.verification_data || s.data || {};
        }

        // Extract IDs
        const sessionIds = extractIdentityNumbers(s);
        extractedBvn = extractedBvn || sessionIds.bvn;
        extractedNin = extractedNin || sessionIds.nin;

        debug("Stage 2 (session) extraction", {
          bvn: extractedBvn || "(not found)",
          nin: extractedNin || "(not found)",
          metaChannel,
        });
      } else {
        debug("Session fetch failed or returned no session", {
          ok: sessionResult?.ok,
          error: sessionResult?.error,
        });
      }
    } else if (!sessionId) {
      debug("No session_id in payload — skipping session fetch");
    }

    channel = channel || "BVN";
    reference = reference || sessionId || null;

    debug("Final resolved values", {
      channel,
      reference,
      hasBvn: !!extractedBvn,
      hasNin: !!extractedNin,
    });

    // ─── 4. Require at least one verified ID ───
    if (!extractedBvn && !extractedNin) {
      return NextResponse.json(
        {
          error:
            "We couldn't read your identity from the verification. Please re-enter your BVN or NIN and try again.",
          code: "NO_IDENTITY_CAPTURED",
          step: "identity",
        },
        { status: 400 }
      );
    }

    // ─── 5. Load user row ───
    const supabase = getSupabaseAdmin();

    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, verification_logs, bvn_data")
      .eq("id", userId)
      .single();

    if (userError || !existingUser) {
      debug("User lookup failed", userError);
      return NextResponse.json(
        {
          error:
            "We couldn't load your profile. Please refresh the page and try again.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // ─── 6. Build update ───
    const mergedBvnData = {
      ...((existingUser.bvn_data as any) || {}),
      ...(verifiedData || {}),
      ...(extractedBvn ? { bvn: extractedBvn } : {}),
      ...(extractedNin ? { nin: extractedNin } : {}),
    };

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

    debug("Updating user record", {
      channel,
      hasBvn: !!extractedBvn,
      hasNin: !!extractedNin,
    });

    // ─── 7. Persist ───
    const { error: updateError } = await supabase
      .from("users")
      .update(update)
      .eq("id", userId);

    if (updateError) {
      console.error(
        "[/verify/identity] DB update failed:",
        updateError.message
      );
      return NextResponse.json(
        {
          error:
            "We couldn't save your verification. Please try again in a moment.",
          code: "DB_UPDATE_FAILED",
          retryable: true,
        },
        { status: 500 }
      );
    }

    debug("Identity verified and saved", { userId, channel });

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
    console.error("[/verify/identity] Unhandled exception:", {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error:
          "Something unexpected happened during verification. Your progress is safe — please try again.",
        code: "UNEXPECTED_ERROR",
        retryable: true,
      },
      { status: 500 }
    );
  }
}