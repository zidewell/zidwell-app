// app/api/auth/validate-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const sessionId = req.cookies.get("sb-session-id")?.value;

    if (!accessToken || !sessionId) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Check if session ID matches database
    const { data: userData } = await supabase
      .from("users")
      .select("current_session_id")
      .eq("id", user.id)
      .single();

    if (!userData || userData.current_session_id !== sessionId) {
      return NextResponse.json({ 
        valid: false, 
        reason: "Session invalidated" 
      }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}