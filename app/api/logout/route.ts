// // app/api/logout/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";
// import { cookies } from "next/headers";

// const getSupabaseAdmin = () =>
//   createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
//     auth: { autoRefreshToken: false, persistSession: false },
//   });

// export async function POST(req: NextRequest) {
//   try {
//     const cookieStore = await cookies();
//     const accessToken = cookieStore.get("sb-access-token")?.value;

//     if (accessToken) {
//       const supabase = getSupabaseAdmin();
//       const { data: userData } = await supabase.auth.getUser(accessToken);
//       const user = userData?.user;

//       if (user) {
//         // Update login history
//         const { data: latestSession } = await supabase
//           .from("login_history")
//           .select("id")
//           .eq("user_id", user.id)
//           .is("logout_time", null)
//           .order("login_time", { ascending: false })
//           .limit(1)
//           .single();

//         if (latestSession?.id) {
//           await supabase
//             .from("login_history")
//             .update({ logout_time: new Date().toISOString() })
//             .eq("id", latestSession.id);
//         }

//         // Clear session in database
//         await supabase
//           .from("users")
//           .update({
//             current_session_id: null,
//             current_session_expires_at: null,
//           })
//           .eq("id", user.id);
//       }
//     }

//     // Create response
//     const res = NextResponse.json(
//       { success: true, message: "Logged out successfully" },
//       { status: 200 }
//     );

//     // Clear all cookies
//     const cookiesToClear = [
//       "sb-access-token",
//       "sb-refresh-token",
//       "verified",
//       "sb-client-session",
//       "sb-login-time",
//       "sb-session-risk",
//       "sb-user-data",
//       "sb-session-id",
//     ];

//     cookiesToClear.forEach((name) => {
//       res.cookies.set(name, "", {
//         path: "/",
//         maxAge: 0,
//         httpOnly: name !== "sb-client-session" && name !== "sb-login-time",
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "lax",
//       });
//     });

//     return res;
//   } catch (error) {
//     console.error("Logout error:", error);
    
//     // Still clear cookies even on error
//     const res = NextResponse.json(
//       { success: true, message: "Logged out" },
//       { status: 200 }
//     );

//     [
//       "sb-access-token",
//       "sb-refresh-token",
//       "verified",
//       "sb-client-session",
//       "sb-login-time",
//       "sb-session-risk",
//       "sb-session-id",
//     ].forEach((name) => res.cookies.set(name, "", { path: "/", maxAge: 0 }));

//     return res;
//   }
// }



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
    }
  );

/**
 * Cookies we always clear explicitly, on top of any `sb-*` prefixed
 * cookies the sweep discovers. Keep this list as the canonical source
 * of "everything we set on login".
 */
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

    // ─────────────────────────────────────────────────────────
    // 1. Server-side cleanup (login history + active session)
    // ─────────────────────────────────────────────────────────
    if (accessToken) {
      const supabase = getSupabaseAdmin();
      const { data: userData } = await supabase.auth.getUser(accessToken);
      const user = userData?.user;

      if (user) {
        // Close the latest open login_history row
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

        // Null out the current session on the user record
        await supabase
          .from("users")
          .update({
            current_session_id: null,
            current_session_expires_at: null,
          })
          .eq("id", user.id);

        // ────────────────────────────────────────────────────
        // 2. Delete the abandoned unpaid store (if any) so the
        //    "Pending Activation" banner cannot reappear on the
        //    next login. Guarded so we never delete a live store.
        // ────────────────────────────────────────────────────
        const { error: deleteError } = await supabase
          .from("online_stores")
          .delete()
          .eq("owner_id", user.id)
          .eq("is_active", false)
          .eq("activation_paid", false);

        if (deleteError) {
          console.error(
            "Failed to clear abandoned unpaid store on logout:",
            deleteError
          );
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. Build response and clear EVERY cookie we can see
    // ─────────────────────────────────────────────────────────
    const res = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Collect every cookie name present on the incoming request
    // so we can wipe anything Supabase or our app may have set.
    const incomingCookies = req.cookies.getAll().map((c) => c.name);

    // Start with the explicit known list, then merge in anything
    // else we spotted. `Set` deduplicates automatically.
    const namesToClear = new Set<string>([
      ...KNOWN_COOKIES_TO_CLEAR,
      ...incomingCookies,
    ]);

    // Also sweep for any cookie whose name begins with "sb-" so
    // future Supabase releases (or chunked cookie variants) don't
    // slip past us.
    incomingCookies.forEach((name) => {
      if (name.startsWith("sb-")) namesToClear.add(name);
    });

    const isProduction = process.env.NODE_ENV === "production";

    namesToClear.forEach((name) => {
      // Two variants — with and without SameSite — to maximize the
      // chance of matching whatever attributes the browser stored.
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

    // ─────────────────────────────────────────────────────────
    // Fail-safe path: still clear whatever cookies we can so the
    // user is not stuck in a logged-in limbo state.
    // ─────────────────────────────────────────────────────────
    const res = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
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