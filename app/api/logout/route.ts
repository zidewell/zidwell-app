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
    console.log("🔵 Secure logout API called");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      const supabase = getSupabaseAdmin();
      const { data: userData } = await supabase.auth.getUser(accessToken);
      const user = userData?.user;

      if (user) {
        // ─── FIX: Fetch latest open session, then update by ID ───
        const { data: latestSession, error: fetchErr } = await supabase
          .from("login_history")
          .select("id")
          .eq("user_id", user.id)
          .is("logout_time", null)
          .order("login_time", { ascending: false })
          .limit(1)
          .single();

        if (fetchErr) {
          console.error("Error fetching latest session:", fetchErr);
        }

        if (latestSession?.id) {
          const { error: updateErr } = await supabase
            .from("login_history")
            .update({ logout_time: new Date().toISOString() })
            .eq("id", latestSession.id);

          if (updateErr) {
            console.error("Error updating login_history:", updateErr);
          }
        }

        // ─── INVALIDATE SESSION IN DB ───
        const { error: userUpdateErr } = await supabase
          .from("users")
          .update({
            current_session_id: null,
            current_session_expires_at: null,
          })
          .eq("id", user.id);

        if (userUpdateErr) {
          console.error("Error clearing user session:", userUpdateErr);
        }
      }
    }

    const res = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

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

    cookiesToClear.forEach((cookieName) => {
      res.cookies.set(cookieName, "", {
        path: "/",
        maxAge: 0,
        httpOnly:
          cookieName !== "sb-client-session" && cookieName !== "sb-login-time",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    console.log("✅ Secure logout successful");
    return res;
  } catch (error) {
    console.error("Logout error:", error);

    const res = NextResponse.json(
      {
        success: true,
        message: "Logged out",
        warning: "Error during server logout",
      },
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