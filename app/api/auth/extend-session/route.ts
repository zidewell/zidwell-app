// app/api/auth/extend-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  SESSION_TIMEOUT_MS,
  SESSION_TIMEOUT_DISABLED,
} from "@/lib/session-config";

export async function POST(req: NextRequest) {
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

    // ✅ Only check that the cookie matches a DB row.
    //    Do NOT check current_session_expires_at here.
    //
    //    Rationale:
    //      extend-session is called when the user is ACTIVE.
    //      Activity is the whole point of extending.
    //      Rejecting an extend because the previous window passed
    //      breaks the entire idle-based model: a user who comes back
    //      after 3 minutes idle would be unable to extend a 2-minute
    //      window, and would be logged out — even though they just
    //      made a request, which proves they are active.
    //
    //    Expiry is enforced exclusively by /api/auth/validate-session,
    //    which runs on the heartbeat and compares NOW against the
    //    DB expiry. If the DB expiry has passed, validate-session
    //    returns { valid: false } and the client redirects to
    //    /auth/session-timeout.
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("current_session_id", sessionId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    const newExpiresAt = new Date(
      Date.now() + SESSION_TIMEOUT_MS,
    ).toISOString();

    await supabase
      .from("users")
      .update({ current_session_expires_at: newExpiresAt })
      .eq("id", userData.id);

    return NextResponse.json({ success: true, expiresAt: newExpiresAt });
  } catch (error) {
    console.error("Extend session error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}