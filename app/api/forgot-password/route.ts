import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";




const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    // const { error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: `${baseUrl}/auth/password-reset/update-password`,
    // });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}