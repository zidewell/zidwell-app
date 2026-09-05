// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const getSupabaseAdmin = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      const supabase = getSupabaseAdmin();
      const { data: userData } = await supabase.auth.getUser(accessToken);
      const user = userData?.user;

      if (user) {
        // Update login history
        const { data: latestSession } = await supabase
          .from("login_history")
          .select("id")
          .eq("user_id", user.id)
          .is("logout_time", null)
          .order("login_time", { ascending: false })
          .limit(1)
          .single();

        if (latestSession?.id) {
          await supabase
            .from("login_history")
            .update({ logout_time: new Date().toISOString() })
            .eq("id", latestSession.id);
        }

        // Clear session in database
        await supabase
          .from("users")
          .update({
            current_session_id: null,
            current_session_expires_at: null,
          })
          .eq("id", user.id);
      }
    }

    // Create response
    const res = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear all cookies
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "verified",
      "sb-client-session",
      "sb-login-time",
      "sb-session-risk",
      "sb-user-data",
      "sb-session-id",
    ];

    cookiesToClear.forEach((name) => {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        httpOnly: name !== "sb-client-session" && name !== "sb-login-time",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    return res;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Still clear cookies even on error
    const res = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    [
      "sb-access-token",
      "sb-refresh-token",
      "verified",
      "sb-client-session",
      "sb-login-time",
      "sb-session-risk",
      "sb-session-id",
    ].forEach((name) => res.cookies.set(name, "", { path: "/", maxAge: 0 }));

    return res;
  }
}