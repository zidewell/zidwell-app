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

    if (!accessToken) {
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

    // Check if user is blocked by admin
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('current_session_expires_at, is_blocked')
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

    // BEST PRACTICE: Removed concurrent login check.
    // Modern users expect to be logged in on phone + laptop + tablet simultaneously.
    // The Supabase JWT is the source of truth for session validity.

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