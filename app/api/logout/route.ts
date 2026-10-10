// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const getSupabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

const KNOWN_COOKIES_TO_CLEAR = [
  "sb-access-token",
  "sb-refresh-token",
  "sb-client-session",
  "sb-login-time",
  "sb-session-risk",
  "sb-session-id",
  "sb-user-data",
  "verified",
  "payment_processed",
];

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      const supabase = getSupabaseAdmin();

      // ─── 1. Revoke the session at Supabase ───
      // signOut() with the current access token revokes that specific
      // session's refresh token. We scope it to "local" because the
      // admin client can't call global signOut on behalf of a user
      // without the user's own session — the local revoke is enough
      // for a single-device logout, and the cookies are cleared next.
      try {
        const { data: userData } = await supabase.auth.getUser(accessToken);
        const user = userData?.user;

        if (user) {
          // Revoke the refresh token associated with this session.
          // The admin API lets us do this by user ID + session scope.
          await supabase.auth.admin.signOut(user.id, "local").catch(() => {
            // If the admin signOut API is unavailable or the user is
            // already signed out, we still proceed with cookie cleanup.
          });

          // ─── 2. Close the login_history row ───
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

          // ─── 3. Null out the current session on the user record ───
          await supabase
            .from("users")
            .update({
              current_session_id: null,
              current_session_expires_at: null,
            })
            .eq("id", user.id);

          // ─── 4. Clean up abandoned unpaid stores ───
          const { error: deleteError } = await supabase
            .from("online_stores")
            .delete()
            .eq("owner_id", user.id)
            .eq("is_active", false)
            .eq("activation_paid", false);

          if (deleteError) {
            console.error(
              "Failed to clear abandoned unpaid store on logout:",
              deleteError,
            );
          }
        }
      } catch (e) {
        // Non-fatal — we still clear cookies below.
        console.warn("Supabase signOut failed (non-fatal):", e);
      }
    }

    // ─── 5. Build response and clear all cookies ───
    const res = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 },
    );

    const incomingCookies = req.cookies.getAll().map((c) => c.name);
    const namesToClear = new Set<string>([
      ...KNOWN_COOKIES_TO_CLEAR,
      ...incomingCookies,
    ]);
    incomingCookies.forEach((name) => {
      if (name.startsWith("sb-")) namesToClear.add(name);
    });

    const isProduction = process.env.NODE_ENV === "production";

    namesToClear.forEach((name) => {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly:
          name !== "sb-client-session" &&
          name !== "sb-login-time" &&
          name !== "sb-user-data" &&
          name !== "payment_processed",
        secure: isProduction,
        sameSite: "lax",
      });
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    });

    return res;
  } catch (error) {
    console.error("Logout error:", error);

    const res = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 },
    );

    const incomingCookies = req.cookies.getAll().map((c) => c.name);
    const namesToClear = new Set<string>([
      ...KNOWN_COOKIES_TO_CLEAR,
      ...incomingCookies,
    ]);

    namesToClear.forEach((name) => {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    });

    return res;
  }
}