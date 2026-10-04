// app/api/auth/validate-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Always return 200. The client reads `data.valid`.
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const sessionId = req.cookies.get("sb-session-id")?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("current_session_id, current_session_expires_at")
      .eq("id", user.id)
      .single();

    if (!userData || userData.current_session_id !== sessionId) {
      return NextResponse.json(
        { valid: false, reason: "Session invalidated" },
        { status: 200 },
      );
    }

    if (userData.current_session_expires_at) {
      const expiresAt = new Date(userData.current_session_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { valid: false, reason: "Session expired due to inactivity" },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}