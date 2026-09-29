// app/api/auth/extend-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("sb-session-id")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session" },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Find the user with this session
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

    // Do not extend an already expired session
    if (userData.current_session_expires_at) {
      const expiresAt = new Date(userData.current_session_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { success: false, error: "Session expired" },
          { status: 401 },
        );
      }
    }

    // Extend session expiration
    const newExpiresAt = new Date(Date.now() + SESSION_TIMEOUT).toISOString();
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
