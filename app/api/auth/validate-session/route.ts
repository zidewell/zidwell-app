// app/api/auth/validate-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const getSupabaseAdmin = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const sessionIdCookie = cookieStore.get("sb-session-id")?.value;

    if (!accessToken || !sessionIdCookie) {
      return NextResponse.json(
        { valid: false, reason: "missing_session" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json(
        { valid: false, reason: "invalid_token" },
        { status: 401 }
      );
    }

    // Check if session ID matches database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('current_session_id, current_session_expires_at, is_blocked')
      .eq('id', user.id)
      .single();

    if (dbError || !userData) {
      return NextResponse.json(
        { valid: false, reason: "user_not_found" },
        { status: 401 }
      );
    }

    if (userData.is_blocked) {
      return NextResponse.json(
        { valid: false, reason: "account_blocked" },
        { status: 403 }
      );
    }

    // Check expiration
    if (userData.current_session_expires_at && new Date(userData.current_session_expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, reason: "session_expired" },
        { status: 401 }
      );
    }

    // ─── CONCURRENT LOGIN CHECK ───
    if (userData.current_session_id !== sessionIdCookie) {
      console.warn(`🚫 Concurrent login detected for user ${user.email}. Expected: ${userData.current_session_id?.slice(0,8)}..., Got: ${sessionIdCookie.slice(0,8)}...`);
      return NextResponse.json(
        { valid: false, reason: "concurrent_login" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      userId: user.id,
      email: user.email,
    });

  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}