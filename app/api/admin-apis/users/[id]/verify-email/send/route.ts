// app/api/admin-apis/users/[id]/verify-email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { transporter } from "@/lib/node-mailer";
import { emailShell, esc, ui } from "@/lib/email/ui";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ═════════════════════════════════════════════════════════════
// GUARD 1 — Reject if `public.users.email_verified` is already true.
// GUARD 2 — Reject if `auth.users.email_confirmed_at` is set
//           (user confirmed via magic link but DB drifted).
// GUARD 3 — Reject if a recent token (< 60s old) was already sent
//           (prevents accidental double-send / email spam).
// GUARD 4 — Reject if the user has no valid email.
// ═════════════════════════════════════════════════════════════

const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const { id } = await params;

    // ── Load current user record ─────────────────────────────
    const { data: user, error: fetchErr } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, full_name, email_verified, email_verification_token, email_verification_token_expires, updated_at",
      )
      .eq("id", id)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── GUARD 4: Must have an email ─────────────────────────
    if (!user.email || !user.email.includes("@")) {
      return NextResponse.json(
        { error: "User has no valid email address on file" },
        { status: 400 },
      );
    }

    // ── GUARD 1: Already verified in public.users ───────────
    if (user.email_verified === true) {
      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "verify_email_send_blocked",
        resourceType: "User",
        resourceId: id,
        description: `Blocked verification email send — already verified: ${user.email}`,
        metadata: {
          targetUserId: id,
          targetEmail: user.email,
          reason: "already_verified_in_db",
          performedBy: adminUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json(
        {
          error: "This email is already verified. No verification needed.",
          alreadyVerified: true,
          reason: "already_verified_in_db",
        },
        { status: 400 },
      );
    }

    // ── GUARD 2: Confirmed in Supabase Auth (magic-link case) ─
    // This is the exact bug from your CSV: auth says confirmed,
    // but public.users.email_verified is still false.
    try {
      const { data: authLookup } =
        await supabaseAdmin.auth.admin.getUserById(id);

      if (authLookup?.user?.email_confirmed_at) {
        // Self-heal: flip the DB flag right now
        await supabaseAdmin
          .from("users")
          .update({
            email_verified: true,
            email_verification_token: null,
            email_verification_token_expires: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        await createAuditLog({
          userId: adminUser.id,
          userEmail: adminUser.email,
          action: "verify_email_send_blocked",
          resourceType: "User",
          resourceId: id,
          description: `Blocked verification email send — Supabase Auth already confirmed. DB flag self-healed for ${user.email}`,
          metadata: {
            targetUserId: id,
            targetEmail: user.email,
            reason: "already_confirmed_in_auth",
            authConfirmedAt: authLookup.user.email_confirmed_at,
            dbFlagHealed: true,
            performedBy: adminUser.email,
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });

        return NextResponse.json(
          {
            error:
              "This email was already confirmed via Supabase Auth. The database flag has been auto-synced. No verification email sent.",
            alreadyVerified: true,
            reason: "already_confirmed_in_auth",
            dbFlagHealed: true,
          },
          { status: 400 },
        );
      }
    } catch (e: any) {
      // If lookup fails, log but don't block — treat as unconfirmed
      console.warn(
        "[verify-email-send] auth lookup failed (continuing):",
        e?.message,
      );
    }

    // ── GUARD 3: Cooldown — don't spam resends ──────────────
    if (user.updated_at && user.email_verification_token) {
      const lastSentAt = new Date(user.updated_at).getTime();
      const elapsed = (Date.now() - lastSentAt) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return NextResponse.json(
          {
            error: `Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting another verification email.`,
            retryAfterSeconds: wait,
            reason: "cooldown",
          },
          { status: 429 },
        );
      }
    }

    // ── All guards passed — generate fresh token ────────────
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update({
        email_verification_token: token,
        email_verification_token_expires: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[verify-email-send] token update failed:", updateErr);
      return NextResponse.json(
        { error: `Failed to create verification token: ${updateErr.message}` },
        { status: 500 },
      );
    }

    // ── Send email via Nodemailer ───────────────────────────
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    const verificationLink = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(
      user.email,
    )}`;

    try {
      await transporter.sendMail({
        from: `"Zidwell" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify your Zidwell email address",
        html: emailShell({
          title: "Verify your email",
          preheader: "Click the button below to verify your Zidwell email.",
          content: `
            ${ui.h1("Verify your email address")}
            ${ui.p(`Hi ${esc(user.full_name || "there")},`)}
            ${ui.p(
              "An administrator has requested a fresh verification link for your Zidwell account. Click the button below to verify your email.",
            )}
            ${ui.cta("Verify email address", verificationLink)}
            ${ui.muted("This link expires in 24 hours.")}
            ${ui.divider()}
            ${ui.h3("Trouble with the button?")}
            <p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666663; word-break:break-all;">
              <a href="${esc(verificationLink)}" style="color:#2563EB;">${esc(verificationLink)}</a>
            </p>
            ${ui.muted(
              "If you didn't expect this email, contact <a href='mailto:support@zidwell.com' style='color:#2563EB;'>support@zidwell.com</a>.",
            )}
            ${ui.signature()}
          `,
        }),
      });
    } catch (mailErr: any) {
      console.error("[verify-email-send] email failed:", mailErr);

      // Roll back the token so we don't leave a stale one
      await supabaseAdmin
        .from("users")
        .update({
          email_verification_token: null,
          email_verification_token_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json(
        { error: `Email send failed: ${mailErr?.message ?? "unknown"}` },
        { status: 500 },
      );
    }

    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "send_verification_email",
      resourceType: "User",
      resourceId: id,
      description: `Sent verification email to ${user.email}`,
      metadata: {
        targetUserId: id,
        targetEmail: user.email,
        tokenExpiresAt: expiresAt.toISOString(),
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: `Verification email sent to ${user.email}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Send verification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}