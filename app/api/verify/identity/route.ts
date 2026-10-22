// app/api/verify/identity/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyBVNWithFace, verifyNINWithFace } from "@/lib/prembly";
import { validateBase64Image } from "@/lib/face-validation";
import { compareNames, buildIdVerifiedName } from "@/lib/name-match";
import {
  checkAndIncrement,
  IDENTITY_RATE_LIMIT,
} from "@/lib/rate-limit-verify";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const FACE_CONFIDENCE_THRESHOLD = 70;
const NAME_MATCH_THRESHOLD = 0.6;

const debug = (label: string, data?: any) =>
  console.log(`[/verify/identity] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  try {
    // ─── 1. Authenticate ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again.", code: "SESSION_EXPIRED" },
        { status: 401 }
      );
    }

    const userId = user.id;
    debug("Authenticated", { userId });

    // ─── 2. Parse + validate input ───
    const body = await req.json().catch(() => ({}));
    const { idType, idNumber, imageBase64 } = body as {
      idType?: string;
      idNumber?: string;
      imageBase64?: string;
    };

    if (!idType || !idNumber || !imageBase64) {
      return NextResponse.json(
        {
          error: "ID type, ID number, and a selfie are required.",
          code: "MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    const normalizedType = idType.toLowerCase();
    if (normalizedType !== "bvn" && normalizedType !== "nin") {
      return NextResponse.json(
        { error: "ID type must be BVN or NIN.", code: "INVALID_ID_TYPE" },
        { status: 400 }
      );
    }

    if (!/^\d{11}$/.test(idNumber)) {
      return NextResponse.json(
        { error: `${normalizedType.toUpperCase()} must be exactly 11 digits.`, code: "INVALID_ID_NUMBER" },
        { status: 400 }
      );
    }

    const imageCheck = validateBase64Image(imageBase64);
    if (!imageCheck.ok) {
      return NextResponse.json(
        { error: imageCheck.error, code: "INVALID_IMAGE" },
        { status: 400 }
      );
    }

    // ─── 3. Load user + idempotency guard ───
    const supabase = getSupabaseAdmin();

    const { data: existing, error: loadErr } = await supabase
      .from("users")
      .select(
        "id, full_name, bvn_verification, nin_verification, verification_logs, bvn_data"
      )
      .eq("id", userId)
      .single();

    if (loadErr || !existing) {
      debug("User lookup failed", loadErr);
      return NextResponse.json(
        { error: "User not found.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const alreadyVerified =
      normalizedType === "bvn"
        ? existing.bvn_verification === "verified"
        : existing.nin_verification === "verified";

    if (alreadyVerified) {
      debug("Already verified — returning cached");
      const cachedName =
        (existing.bvn_data as any)?.data?.firstName
          ? buildIdVerifiedName(
              (existing.bvn_data as any)?.data?.firstName,
              (existing.bvn_data as any)?.data?.middleName,
              (existing.bvn_data as any)?.data?.lastName
            )
          : existing.full_name;

      const resp = {
        success: true,
        verifiedName: cachedName,
        faceConfidence: null,
        nameMatched: true,
        nameMismatch: false,
        cached: true,
      };
      if (newTokens) return createAuthResponse(resp, { status: 200, newTokens });
      return NextResponse.json(resp);
    }

    // ─── 4. Rate limit ───
    const rate = await checkAndIncrement(userId, "identity", IDENTITY_RATE_LIMIT);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Too many attempts. Please try again in ${Math.ceil(
            (rate.retryAfterSeconds || 0) / 60
          )} minutes.`,
          code: "RATE_LIMITED",
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    debug("Calling Prembly face endpoint", {
      idType: normalizedType,
      idPrefix: idNumber.slice(0, 3) + "****",
    });

    // ─── 5. Call Prembly ───
    const premblyResult =
      normalizedType === "bvn"
        ? await verifyBVNWithFace({ number: idNumber, imageBase64 })
        : await verifyNINWithFace({ number: idNumber, imageBase64 });

    debug("Prembly result", {
      ok: premblyResult.ok,
      faceMatched: premblyResult.faceMatched,
      faceConfidence: premblyResult.faceConfidence,
      verifiedName: premblyResult.verifiedName,
      error: premblyResult.error,
    });

    if (!premblyResult.ok) {
      return NextResponse.json(
        {
          error:
            premblyResult.error ||
            `${normalizedType.toUpperCase()} verification failed. Please check the number and try again.`,
          code: "VERIFICATION_FAILED",
        },
        { status: 400 }
      );
    }

    // ─── 6. Face match gate ───
    if (!premblyResult.faceMatched) {
      return NextResponse.json(
        {
          error:
            premblyResult.faceMessage ||
            "We couldn't match your selfie to the photo on your ID. Please retake the selfie in good lighting.",
          code: "FACE_MISMATCH",
        },
        { status: 400 }
      );
    }

    if (
      typeof premblyResult.faceConfidence === "number" &&
      premblyResult.faceConfidence < FACE_CONFIDENCE_THRESHOLD
    ) {
      return NextResponse.json(
        {
          error:
            "The face match confidence was too low. Please retake the selfie with better lighting and a clear view of your face.",
          code: "FACE_LOW_CONFIDENCE",
          confidence: premblyResult.faceConfidence,
        },
        { status: 400 }
      );
    }

    // ─── 7. Name reconciliation (soft signal) ───
    const idName = premblyResult.verifiedName || existing.full_name || "";
    const nameResult = compareNames(existing.full_name || "", idName, {
      threshold: NAME_MATCH_THRESHOLD,
    });

    debug("Name reconciliation", {
      signupName: existing.full_name,
      idName,
      score: nameResult.score,
      matched: nameResult.matched,
    });

    // ─── 8. Build update ───
    const normalizedIdName = (idName || existing.full_name || "").toUpperCase();

    const update: UserUpdate = {
      verification_status: "verified",
      identity_verified: true,
      kyc_level: "verified",
      verified_at: new Date().toISOString(),
      verification_provider: "prembly",
      verification_reference: premblyResult.reference || null,
      verification_id: premblyResult.reference || null,
      bvn_data: premblyResult.data || null,
      // Overwrite full_name with the ID-verified version
      full_name: normalizedIdName,
      // Face match fields
      face_match_verified: true,
      face_comparison_verified: true,
      face_comparison_score: premblyResult.faceConfidence ?? null,
      // Name mismatch flag
      name_mismatch: !nameResult.matched,
      id_verified_name: normalizedIdName,
    };

    if (normalizedType === "bvn") {
      update.bvn_verification = "verified";
    } else {
      update.nin_verification = "verified";
      update.nin = idNumber;
    }

    // Append audit log
    const existingLogs: any[] = Array.isArray(existing.verification_logs)
      ? existing.verification_logs
      : [];

    update.verification_logs = [
      ...existingLogs,
      {
        step: "identity",
        provider: "prembly",
        method: "face_match",
        channel: normalizedType.toUpperCase(),
        status: "success",
        reference: premblyResult.reference || null,
        face_confidence: premblyResult.faceConfidence ?? null,
        signup_name: existing.full_name,
        id_verified_name: normalizedIdName,
        name_match_score: Number(nameResult.score.toFixed(3)),
        name_matched: nameResult.matched,
        timestamp: new Date().toISOString(),
      },
    ];

    // ─── 9. Persist ───
    const { error: updateErr } = await supabase
      .from("users")
      .update(update)
      .eq("id", userId);

    if (updateErr) {
      console.error("[/verify/identity] Update error:", updateErr);
      return NextResponse.json(
        {
          error: "We couldn't save your verification. Please try again.",
          code: "DB_UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    debug("Identity verified", { userId, nameMatched: nameResult.matched });

    // ─── 10. Respond ───
    const responseBody = {
      success: true,
      verifiedName: normalizedIdName,
      faceConfidence: premblyResult.faceConfidence ?? null,
      nameMatched: nameResult.matched,
      nameMismatch: !nameResult.matched,
      channel: normalizedType.toUpperCase(),
    };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/verify/identity] Exception:", err.message);
    return NextResponse.json(
      {
        error: "Something went wrong during verification. Please try again.",
        code: "UNEXPECTED_ERROR",
      },
      { status: 500 }
    );
  }
}