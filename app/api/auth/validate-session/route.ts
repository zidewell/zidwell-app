// app/api/auth/validate-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Always returns 200. The client reads `data.valid`.
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const sessionId = req.cookies.get("sb-session-id")?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json(
        {
          valid: false,
          reason: !accessToken
            ? "missing_access_token"
            : "missing_session_id",
        },
        { status: 200 },
      );
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json(
        { valid: false, reason: "invalid_access_token" },
        { status: 200 },
      );
    }

    const { data: userData } = await supabase
      .from("users")
      .select("current_session_id, current_session_expires_at")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { valid: false, reason: "user_not_found" },
        { status: 200 },
      );
    }

    if (userData.current_session_id !== sessionId) {
      return NextResponse.json(
        { valid: false, reason: "session_id_mismatch" },
        { status: 200 },
      );
    }

    if (userData.current_session_expires_at) {
      const expiresAt = new Date(userData.current_session_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { valid: false, reason: "session_expired_in_db" },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { valid: false, reason: "validation_error" },
      { status: 200 },
    );
  }
}