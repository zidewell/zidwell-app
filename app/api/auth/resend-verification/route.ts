// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import crypto from "crypto";

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
      subject: "🔐 Resend: Verify Your Zidwell Account",
      html: `
        <div style="background: #f4f4f4; padding: 40px 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: #FDC020; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 30px; color: #191919;">Zidwell</h1>
              <p style="margin: 10px 0 0; color: #333333; font-size: 16px;">Secure Business Banking & Payments</p>
            </div>
            <div style="padding: 40px;">
              <h2 style="margin: 0; color: #191919; font-size: 24px;">Verify Your Email Address</h2>
              <p style="margin-top: 25px; color: #555555; font-size: 16px; line-height: 28px;">
                Hi ${user.full_name},
              </p>
              <p style="margin-top: 20px; color: #555555; font-size: 16px; line-height: 28px;">
                We received a request to resend your verification email. Please click the button below to verify your account.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 40px auto;">
                <tr>
                  <td bgcolor="#FDC020" style="border-radius: 6px;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; font-size: 16px; font-weight: bold; color: #191919; text-decoration: none;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 15px; color: #555555; line-height: 26px;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; font-size: 13px; color: #2563eb;">
                <a href="${verificationLink}" style="color: #2563eb; text-decoration: none;">${verificationLink}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 35px 0;">
              <p style="font-size: 14px; color: #999999; line-height: 26px;">
                This verification link expires in <strong>24 hours</strong>.
              </p>
              <p style="font-size: 15px; color: #555555; line-height: 26px;">
                If you did not request this, you can safely ignore this email.
              </p>
            </div>
            <div style="background: #fafafa; padding: 30px; border-top: 1px solid #eeeeee; text-align: center;">
              <p style="margin: 0; color: #777777; font-size: 14px;">© Zidwell. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
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