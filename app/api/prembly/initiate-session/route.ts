// app/api/prembly/initiate-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

const PREMBLY_BACKEND = "https://backend.prembly.com";

interface UserProfileRow {
  full_name: string | null;
  email: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await isAuthenticatedWithRefresh(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await req.json().catch(() => ({}));
    const redirectUrl: string | undefined = reqBody?.redirectUrl;

    const supabase = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const p = profile as UserProfileRow;

    if (!p.full_name || !p.email) {
      return NextResponse.json(
        { error: "User profile incomplete" },
        { status: 400 }
      );
    }

    const nameParts = p.full_name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const premblyBody: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      email: p.email,
      widget_id: process.env.NEXT_PUBLIC_PREMBLY_WIDGET_ID!,
      widget_key: process.env.NEXT_PUBLIC_PREMBLY_WIDGET_KEY!,
    };

    if (redirectUrl) {
      premblyBody.redirect_url = redirectUrl;
    }

    const res = await fetch(
      `${PREMBLY_BACKEND}/api/v1/checker-widget/sdk/sessions/initiate/`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(premblyBody),
      }
    );

    const data = await res.json();

    if (!res.ok || !data?.status || !data?.data?.session?.session_id) {
      return NextResponse.json(
        {
          error:
            data?.message || "Failed to initiate Prembly verification session",
        },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: data.data.session.session_id,
      redirectUrl: data.data.session.redirect_url,
    });
  } catch (err: any) {
    console.error("[/api/prembly/initiate-session] Exception:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}