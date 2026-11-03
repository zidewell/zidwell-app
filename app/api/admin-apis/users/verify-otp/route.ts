// app/api/admin-apis/users/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { transporter } from "@/lib/node-mailer";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 3;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(payload: { userId: string; targetUserId: string; exp: number }): string {
  // Simple HMAC signature — swap for jose/jwt if you prefer
  const crypto = require("crypto");
  const secret = process.env.ADMIN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string): { userId: string; targetUserId: string; exp: number } | null {
  try {
    const crypto = require("crypto");
    const secret = process.env.ADMIN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const body = await req.json();
    const { action, targetUserId, code } = body;

    if (!action || !targetUserId) {
      return NextResponse.json(
        { error: "action and targetUserId are required" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: targetUser, error: targetErr } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetErr || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── ACTION: SEND ──
    if (action === "send") {
      // Rate limit: max 1 OTP per 60 seconds per (admin, target)
      const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const { count: recentSends } = await supabaseAdmin
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "admin_user_edit_otp_sent")
        .eq("user_id", adminUser?.id)
        .eq("resource_id", targetUserId)
        .gte("created_at", oneMinAgo);

      if ((recentSends ?? 0) > 0) {
        return NextResponse.json(
          { error: "Please wait 60 seconds before requesting another code" },
          { status: 429 }
        );
      }

      const otp = generateOtp();
      const exp = Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;

      // Send email to the ADMIN (not the target user)
      try {
        await transporter.sendMail({
          from: `Zidwell Security <${process.env.EMAIL_USER}>`,
          to: adminUser.email,
          subject: "🔐 Admin Verification Code — Edit User",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #f9fafb;">
              <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #FDC020 0%, #a87e06 100%); border-radius: 12px; color: #0a0a0a; font-weight: 700; font-size: 24px; line-height: 48px; text-align: center;">Z</div>
                </div>
                <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px; text-align: center;">Admin Verification Required</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                  Hi ${adminUser.email?.split("@")[0]}, you're about to edit the account of
                  <strong>${targetUser.email}</strong>. Enter the code below to confirm this action.
                </p>
                <div style="background: #fefce8; border: 1px solid #FDC020; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <div style="font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                </div>
                <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                  This code expires in 5 minutes.<br>
                  If you didn't request this, ignore this email.
                </p>
              </div>
            </div>
          `,
          text: `Admin verification code: ${otp}\n\nYou're about to edit ${targetUser.email}. Code expires in 5 minutes.`,
        });
      } catch (mailErr: any) {
        console.error("[verify-otp] Email send failed:", mailErr);
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      // Store OTP (in audit_logs.metadata for simplicity — no new table needed)
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_user_edit_otp_sent",
        resourceType: "User",
        resourceId: targetUserId,
        description: `OTP sent to ${adminUser.email} for editing ${targetUser.email}`,
        metadata: {
          otp,
          exp,
          attempts: 0,
          targetEmail: targetUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({
        ok: true,
        expiresIn: OTP_TTL_SECONDS,
        message: `Verification code sent to ${adminUser.email}`,
      });
    }

    // ── ACTION: VERIFY ──
    if (action === "verify") {
      if (!code || String(code).length !== 6) {
        return NextResponse.json(
          { error: "Enter a valid 6-digit code" },
          { status: 400 }
        );
      }

      // Find latest OTP log for this admin + target
      const { data: otpLogs } = await supabaseAdmin
        .from("audit_logs")
        .select("id, metadata, created_at")
        .eq("action", "admin_user_edit_otp_sent")
        .eq("user_id", adminUser?.id)
        .eq("resource_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(1);

      const latest = otpLogs?.[0];
      if (!latest) {
        return NextResponse.json(
          { error: "No verification code found. Request a new one." },
          { status: 400 }
        );
      }

      const meta = latest.metadata || {};
      const otp = String(meta.otp || "");
      const exp = Number(meta.exp || 0);
      const attempts = Number(meta.attempts || 0);

      if (attempts >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many attempts. Request a new code." },
          { status: 429 }
        );
      }

      if (exp < Date.now() / 1000) {
        return NextResponse.json(
          { error: "Code expired. Request a new one." },
          { status: 400 }
        );
      }

      if (String(code) !== otp) {
        // Increment attempts
        await supabaseAdmin
          .from("audit_logs")
          .update({
            metadata: { ...meta, attempts: attempts + 1 },
          })
          .eq("id", latest.id);

        return NextResponse.json(
          {
            error: `Incorrect code. ${
              MAX_ATTEMPTS - attempts - 1
            } attempts remaining.`,
          },
          { status: 400 }
        );
      }

      // ✅ Success — issue 3-min token
      const token = signToken({
        userId: adminUser?.id,
        targetUserId,
        exp: Math.floor(Date.now() / 1000) + 180,
      });

      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_user_edit_otp_verified",
        resourceType: "User",
        resourceId: targetUserId,
        description: `OTP verified for editing ${targetUser.email}`,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({
        ok: true,
        token,
        expiresIn: 180,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[verify-otp] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── Helper for other routes to validate the token ──
export function validateEditToken(
  req: NextRequest,
  targetUserId: string
): { ok: true } | { ok: false; error: string } {
  const auth = req.headers.get("x-edit-token");
  if (!auth) {
    return { ok: false, error: "Missing edit verification token" };
  }
  const payload = verifyToken(auth);
  if (!payload) {
    return { ok: false, error: "Invalid or expired edit token" };
  }
  if (payload.targetUserId !== targetUserId) {
    return { ok: false, error: "Token does not match this user" };
  }
  return { ok: true };
}
