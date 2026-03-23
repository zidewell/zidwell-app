// app/api/profile/validate-pin-reset-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Missing token or user ID" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("pin_reset_token, pin_reset_token_expires")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid user" },
        { status: 404 }
      );
    }

    if (user.pin_reset_token !== token) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 401 }
      );
    }

    if (new Date(user.pin_reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Validation failed: " + error.message },
      { status: 500 }
    );
  }
}