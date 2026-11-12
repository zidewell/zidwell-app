// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import crypto from "crypto";
import {
  emailShell,
  ui,
  esc,
  EMAIL_BRAND,
} from "@/lib/email/ui";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user (using your schema column names)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, email_verified")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

    // Update user with new token (using your schema column names)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verification_token: verificationToken,
        email_verification_token_expires: verificationExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error updating verification token:", updateError);
      return NextResponse.json(
        { error: "Failed to resend verification email" },
        { status: 500 }
      );
    }

    // Send verification email
    const baseUrl = process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL
      : process.env.NEXT_PUBLIC_BASE_URL;

    const verificationLink = `${baseUrl}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: `"Zidwell" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your Zidwell account",
      html: emailShell({
        title: "Verify your Zidwell account",
        preheader: "One click to activate your Zidwell account.",
        content: `
          ${ui.h1("Verify your email address")}
          ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
          ${ui.p(
            "Thanks for signing up to Zidwell. Confirm your email address to activate your account."
          )}
          ${ui.cta("Verify email address", verificationLink)}
          ${ui.muted("This link expires in 24 hours.")}
          ${ui.divider()}
          ${ui.h3("Trouble clicking the button?")}
          <p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.5; color:#666663; word-break:break-all;">
            <a href="${esc(verificationLink)}" style="color:#2563EB; text-decoration:none;">${esc(verificationLink)}</a>
          </p>
          ${ui.signature()}
        `,
      }),
    });
    
    return NextResponse.json({
      success: true,
      message: "Verification email resent successfully",
    });

  } catch (error: any) {
    console.error("❌ Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}