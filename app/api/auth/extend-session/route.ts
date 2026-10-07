// app/api/auth/extend-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  SESSION_TIMEOUT_MS,
  SESSION_TIMEOUT_DISABLED,
} from "@/lib/session-config";

export async function POST(req: NextRequest) {
  // Dev without TEST_MODE → no-op.
  if (SESSION_TIMEOUT_DISABLED) {
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    const sessionId = req.cookies.get("sb-session-id")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session" },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, current_session_expires_at")
      .eq("current_session_id", sessionId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    if (userData.current_session_expires_at) {
      const expiresAt = new Date(userData.current_session_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { success: false, error: "Session expired" },
          { status: 401 },
        );
      }
    }

    // Timeout comes from lib/session-config.ts — no local constant.
    const newExpiresAt = new Date(
      Date.now() + SESSION_TIMEOUT_MS,
    ).toISOString();

    await supabase
      .from("users")
      .update({ current_session_expires_at: newExpiresAt })
      .eq("id", userData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Extend session error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}