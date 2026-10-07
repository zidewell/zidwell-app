// app/api/verify/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const debug = (label: string, data?: any) =>
  console.log(`[/verify/pin] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  debug("=== PIN setup request received ===");

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
    const { pin, confirmPin } = body;

    // ─── 3. Validate ───
    if (!pin || !confirmPin) {
      return NextResponse.json(
        {
          error: "Please enter and confirm your PIN.",
          code: "MISSING_PIN",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        {
          error: "Your PIN must be exactly 4 digits.",
          code: "INVALID_PIN_FORMAT",
        },
        { status: 400 }
      );
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        {
          error: "The two PINs don't match. Please try again.",
          code: "PIN_MISMATCH",
        },
        { status: 400 }
      );
    }

    // ─── 4. Hash ───
    let hashed: string;
    try {
      hashed = await bcrypt.hash(pin, 10);
    } catch (hashErr: any) {
      console.error("[/verify/pin] bcrypt hash failed:", hashErr.message);
      return NextResponse.json(
        {
          error:
            "We couldn't secure your PIN. Please try again in a moment.",
          code: "HASH_FAILED",
          retryable: true,
        },
        { status: 500 }
      );
    }

    // ─── 5. Load current state (for snapshot) ───
    const supabase = getSupabaseAdmin();

    const { data: existing, error: loadErr } = await supabase
      .from("users")
      .select("id, transaction_pin, pin_set, pin_attempts, pin_locked_until")
      .eq("id", userId)
      .single();

    if (loadErr || !existing) {
      debug("User lookup failed", loadErr);
      return NextResponse.json(
        {
          error:
            "We couldn't load your profile. Please refresh the page and try again.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Snapshot for rollback
    const snapshot = {
      transaction_pin: existing.transaction_pin,
      pin_set: existing.pin_set,
      pin_attempts: existing.pin_attempts,
      pin_locked_until: existing.pin_locked_until,
    };

    debug("Snapshot captured", snapshot);

    // ─── 6. Update user ───
    const update: UserUpdate = {
      transaction_pin: hashed,
      pin_set: true,
      pin_attempts: 0,
      pin_locked_until: null,
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(update)
      .eq("id", userId);

    if (updateError) {
      console.error("[/verify/pin] DB update failed:", updateError.message);

      // Rollback: restore prior state
      try {
        debug("Rolling back PIN snapshot");
        await supabase.from("users").update(snapshot).eq("id", userId);
      } catch (rollbackErr: any) {
        console.error(
          "[/verify/pin] Rollback failed — manual intervention needed:",
          { userId, snapshot, error: rollbackErr.message }
        );
      }

      return NextResponse.json(
        {
          error:
            "We couldn't save your PIN. Your progress is safe — please try again.",
          code: "DB_UPDATE_FAILED",
          retryable: true,
        },
        { status: 500 }
      );
    }

    debug("PIN saved successfully", { userId });

    // ─── 7. Respond ───
    const responseBody = { success: true };

    if (newTokens) {
      return createAuthResponse(responseBody, { status: 200, newTokens });
    }
    return NextResponse.json(responseBody);
  } catch (err: any) {
    console.error("[/verify/pin] Unhandled exception:", {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error:
          "Something unexpected happened while saving your PIN. Please try again.",
        code: "UNEXPECTED_ERROR",
        retryable: true,
      },
      { status: 500 }
    );
  }
}