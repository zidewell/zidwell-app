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
      const { data: userData } = await supabase.auth.getUser(accessToken);
      const user = userData?.user;

      if (user) {
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

        await supabase
          .from("users")
          .update({
            current_session_id: null,
            current_session_expires_at: null,
          })
          .eq("id", user.id);

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
    }

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