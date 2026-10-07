// app/api/activate-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { processActivation } from "@/lib/activation";

const debug = (label: string, data?: any) =>
  console.log(`[/activate] ${label}`, data ?? "");

export async function POST(req: NextRequest) {
  debug("=== Manual activation check received ===");

  try {
    // ─── 1. Authenticate ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      debug("Auth failed");
      return NextResponse.json(
        {
          error: "Your session has expired. Please log in again.",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    debug("Authenticated", { userId });

    const supabase = getSupabaseAdmin();

    // ─── 2. Load profile ───
    const { data: profile, error: userErr } = await supabase
      .from("users")
      .select(
        "id, wallet_balance, activation_paid, bank_account_number, wallet_id"
      )
      .eq("id", userId)
      .single();

    if (userErr || !profile) {
      debug("Profile lookup failed", userErr);
      return NextResponse.json(
        {
          error:
            "We couldn't load your profile. Please refresh and try again.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    debug("Profile loaded", {
      walletBalance: profile.wallet_balance,
      activationPaid: profile.activation_paid,
      hasAccountNumber: !!profile.bank_account_number,
    });

    // ─── 3. Already activated ───
    if (profile.activation_paid) {
      debug("Already activated");
      const body = {
        success: true,
        activation: {
          activated: true,
          reason: "Already activated",
        },
      };
      if (newTokens) {
        return createAuthResponse(body, { status: 200, newTokens });
      }
      return NextResponse.json(body);
    }

    // ─── 4. No bank account yet ───
    if (!profile.bank_account_number) {
      return NextResponse.json(
        {
          error:
            "You haven't completed verification yet. Please finish the identity steps first.",
          code: "NOT_VERIFIED",
          step: "identity",
        },
        { status: 400 }
      );
    }

    // ─── 5. Run activation against current wallet balance ───
    debug("Running processActivation with current balance", {
      currentBalance: profile.wallet_balance,
    });

    const result = await processActivation({
      userId,
      inflowAmount: Number(profile.wallet_balance || 0),
      inflowReference: `manual_check_${userId}_${Date.now()}`,
    });

    debug("Activation result", result);

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason ||
            "We couldn't check your activation status. Please try again.",
          code: "ACTIVATION_CHECK_FAILED",
          retryable: true,
        },
        { status: 500 }
      );
    }

    // ─── 6. Respond ───
    const body = {
      success: true,
      activation: result,
    };

    if (newTokens) {
      return createAuthResponse(body, { status: 200, newTokens });
    }
    return NextResponse.json(body);
  } catch (err: any) {
    console.error("[/activate] Unhandled exception:", {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error:
          "Something unexpected happened. Please try again or contact support if this persists.",
        code: "UNEXPECTED_ERROR",
        retryable: true,
      },
      { status: 500 }
    );
  }
}