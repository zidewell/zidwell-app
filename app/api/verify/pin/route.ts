// app/api/verify/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";
import bcrypt from "bcryptjs";
import type { Database } from "@/types/supabase";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function POST(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin, confirmPin } = await req.json();

    if (!pin || !confirmPin) {
      return NextResponse.json(
        { error: "pin and confirmPin are required" },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }
    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: "PINs do not match" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(pin, 10);
    const supabase = getSupabaseAdmin();

    const update: UserUpdate = {
      transaction_pin: hashed,
      pin_set: true,
      pin_attempts: 0,
      pin_locked_until: null,
    };

    const { error } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id);

    if (error) {
      console.error("[/api/verify/pin] Update error:", error);
      return NextResponse.json(
        { error: "Failed to save PIN" },
        { status: 500 }
      );
    }

    const body = { success: true };
    if (newTokens) {
      return createAuthResponse(body, { status: 200, newTokens });
    }
    return NextResponse.json(body);
  } catch (err: any) {
    console.error("[/api/verify/pin] Exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}