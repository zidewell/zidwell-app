// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { transporter } from "@/lib/node-mailer";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import crypto from "crypto";
import { emailShell, ui, esc } from "@/lib/email/ui";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateTemporaryPassword(): string {
  return crypto.randomBytes(15).toString("base64").slice(0, 20) + "Aa1!";
}

const ALLOWED_ADMIN_ROLES = [
  "user",
  "super_admin",
  "operations_admin",
  "finance_admin",
  "support_admin",
  "legal_admin",
  "blog_admin",
];

const VALID_ACCOUNT_TIERS = ["tier_1", "tier_2", "tier_3"] as const;
type AccountTier = (typeof VALID_ACCOUNT_TIERS)[number];

// ═════════════════════════════════════════════════════════════
// 🔍 SHARED HELPER — Is this user truly verified?
//
// A user is "truly verified" if EITHER:
//   • public.users.email_verified === true  (canonical flag), OR
//   • auth.users.email_confirmed_at is set  (magic-link drift case)
//
// We check auth because a user who confirmed via Supabase magic link
// has email_confirmed_at set but public.users.email_verified often
// remains false — the exact bug we've been fixing.
// ═════════════════════════════════════════════════════════════
async function isUserTrulyVerified(
  userId: string,
  dbEmailVerified: boolean | null | undefined,
): Promise<{ verified: boolean; authConfirmedAt: string | null }> {
  if (dbEmailVerified === true) {
    return { verified: true, authConfirmedAt: null };
  }

  try {
    const { data: authLookup } =
      await supabase.auth.admin.getUserById(userId);
    const confirmedAt = authLookup?.user?.email_confirmed_at ?? null;

    if (confirmedAt) {
      // Self-heal the DB flag so future checks don't need the auth lookup
      await supabase
        .from("users")
        .update({
          email_verified: true,
          email_verification_token: null,
          email_verification_token_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      console.log(
        `🩹 Self-healed email_verified=true for ${userId} (auth confirmed)`,
      );
      return { verified: true, authConfirmedAt: confirmedAt };
    }
  } catch (e: any) {
    console.warn(
      `[register] auth lookup failed for ${userId} (assuming unverified):`,
      e?.message,
    );
  }

  return { verified: false, authConfirmedAt: null };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAdminCreation = body.isAdminCreation === true;

    if (isAdminCreation) {
      return await handleAdminCreation(req, body);
    }

    return await handlePublicSignup(req, body);
  } catch (error: any) {
    console.error("❌ Unexpected Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 },
    );
  }
}

// ═════════════════════════════════════════════════════════════
// 🧑‍💼 ADMIN CREATION HANDLER
// ═════════════════════════════════════════════════════════════
async function handleAdminCreation(req: NextRequest, body: any) {
  // 1. Verify current admin
  const adminUser = await requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;

  const allowedAdminRoles = ["super_admin", "operations_admin"];
  if (!allowedAdminRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json(
      { error: "Insufficient permissions to create users" },
      { status: 403 },
    );
  }

  const clientInfo = getClientInfo(req.headers);

  const {
    fullName,
    email,
    phone,
    role = "user",
    businessName,
    sendWelcomeEmail = true,
    accountTier = "tier_3",
    customOutflowPercent,
    customOutflowMin,
    customFeeNote,
  } = body;

  // 2. Validate inputs
  if (!fullName || !email || !phone) {
    return NextResponse.json(
      { error: "Full name, email, and phone are required" },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
    return NextResponse.json(
      { error: "Phone must be 10-11 digits" },
      { status: 400 },
    );
  }

  const requestedRole = String(role || "user").toLowerCase().trim();
  if (!ALLOWED_ADMIN_ROLES.includes(requestedRole)) {
    return NextResponse.json(
      {
        error: `Invalid role "${role}". Allowed: ${ALLOWED_ADMIN_ROLES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 3. Validate account tier
  const requestedTier = String(accountTier || "tier_3").toLowerCase().trim();
  if (!VALID_ACCOUNT_TIERS.includes(requestedTier as AccountTier)) {
    return NextResponse.json(
      {
        error: `Invalid account_tier "${accountTier}". Allowed: ${VALID_ACCOUNT_TIERS.join(", ")}`,
      },
      { status: 400 },
    );
  }
  const finalTier = requestedTier as AccountTier;

  // 4. Validate custom outflow overrides
  const hasCustomPercent =
    customOutflowPercent != null && customOutflowPercent !== "";
  const hasCustomMin = customOutflowMin != null && customOutflowMin !== "";

  let parsedCustomPercent: number | null = null;
  let parsedCustomMin: number | null = null;

  if (hasCustomPercent) {
    const pct = Number(customOutflowPercent);
    if (isNaN(pct) || pct < 0 || pct > 1) {
      return NextResponse.json(
        {
          error:
            "customOutflowPercent must be between 0 and 1 (e.g. 0.001 = 0.1%)",
        },
        { status: 400 },
      );
    }
    parsedCustomPercent = pct;
  }

  if (hasCustomMin) {
    const min = Number(customOutflowMin);
    if (isNaN(min) || min < 0) {
      return NextResponse.json(
        { error: "customOutflowMin must be ≥ 0" },
        { status: 400 },
      );
    }
    parsedCustomMin = min;
  }

  // 5. Role privilege check
  if (
    requestedRole === "super_admin" &&
    adminUser.admin_role !== "super_admin"
  ) {
    return NextResponse.json(
      { error: "Only super admins can create other super admins" },
      { status: 403 },
    );
  }

  // 6. Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email, full_name, email_verified, admin_role, account_tier")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // ── Existing user path ──
  if (existingUser) {
    const { verified } = await isUserTrulyVerified(
      existingUser.id,
      existingUser.email_verified,
    );

    // Upgrade path — only if the user is NOT verified AND has no admin role
    if (
      !verified &&
      requestedRole !== "user" &&
      !existingUser.admin_role
    ) {
      const { error: upgradeError } = await supabase
        .from("users")
        .update({
          admin_role: requestedRole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id);

      if (upgradeError) {
        return NextResponse.json(
          { error: `Failed to upgrade user: ${upgradeError.message}` },
          { status: 500 },
        );
      }

      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "upgrade_user_via_admin_add",
        resourceType: "User",
        resourceId: existingUser.id,
        description: `Upgraded ${existingUser.email} to ${requestedRole}`,
        metadata: {
          targetEmail: existingUser.email,
          previousRole: existingUser.admin_role,
          newRole: requestedRole,
          performedBy: adminUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json(
        {
          success: true,
          action: "upgraded",
          message: `${existingUser.email} has been upgraded to ${requestedRole}`,
          user: {
            id: existingUser.id,
            email: existingUser.email,
            full_name: existingUser.full_name,
            admin_role: requestedRole,
            account_tier: existingUser.account_tier,
          },
          welcomeEmailSent: false,
        },
        { status: 200 },
      );
    }

    // Already verified user → refuse cleanly
    if (verified) {
      return NextResponse.json(
        {
          error:
            "A verified account with this email already exists. Use the Edit action on the Users table to modify it.",
          code: "email_already_registered",
          existingUserId: existingUser.id,
          hint: existingUser.admin_role
            ? "This user already has an admin role"
            : "Use the Edit action on the users table to modify this user",
        },
        { status: 409 },
      );
    }

    // Unverified existing user, role="user" requested → refuse
    // (Admin should use "Resend verification" instead of creating a dup)
    return NextResponse.json(
      {
        error:
          "An unverified account with this email already exists. Use 'Send verification email' on the existing user instead of creating a new one.",
        code: "email_exists_unverified",
        existingUserId: existingUser.id,
        hint: "Open the existing user and click 'Send verification'",
      },
      { status: 409 },
    );
  }

  // ── New user path ──
  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const namePart = fullName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const generatedReferral = `${namePart}-${Date.now().toString(36)}`;

  const verificationToken = generateVerificationToken();
  const verificationExpiresAt = new Date();
  verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

  // 7. Create Supabase Auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: temporaryPassword,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        phone: phone,
        created_by_admin: true,
        created_by: adminUser.email,
        account_tier: finalTier,
      },
    });

  if (authError || !authData.user) {
    console.error("❌ Auth creation error:", authError);
    return NextResponse.json(
      { error: authError?.message || "Failed to create auth user" },
      { status: 500 },
    );
  }

  const userId = authData.user.id;

  const trialStartsAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  // 8. Create users row — matches schema EXACTLY + tier fields
  const { data: newUser, error: userError } = await supabase
    .from("users")
    .insert({
      id: userId,
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone,
      transaction_pin: hashedPassword,
      pin_set: false,
      wallet_balance: 0,
      zidcoin_balance: 20,
      referral_code: generatedReferral,
      referred_by: null,
      bvn_verification: "not_submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      date_of_birth: null,
      city: null,
      state: null,
      address: null,
      country: null,
      profile_picture: null,
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      p_bank_name: null,
      p_bank_code: null,
      p_account_number: null,
      p_account_name: null,
      wallet_id: null,
      wallet_updated_at: null,
      admin_role: requestedRole === "user" ? null : requestedRole,
      is_blocked: false,
      blocked_at: null,
      block_reason: null,
      last_login: null,
      last_logout: null,
      current_login_session: null,
      current_session_id: null,
      current_session_ip: null,
      current_session_device: null,
      current_session_expires_at: null,
      subscription_tier: "free",
      subscription_expires_at: null,
      notification_preferences: {
        sms: false,
        push: true,
        email: true,
        in_app: true,
      },
      total_invoices_created: 0,
      invoices_used_monthly: 0,
      receipts_used_monthly: 0,
      contracts_used_monthly: 0,
      invoices_used_lifetime: 0,
      receipts_used_lifetime: 0,
      contracts_used_lifetime: 0,
      invoice_lifetime_limit: 10,
      receipt_lifetime_limit: 10,
      contract_lifetime_limit: 1,
      last_usage_reset: new Date().toISOString().split("T")[0],
      referral_source: "admin_created",
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_token_expires: verificationExpiresAt.toISOString(),
      bvn_data: null,
      verification_completed: false,
      verification_step: 0,
      identity_verified: false,
      kyc_level: "unverified",
      verification_status: "pending",
      is_flagged: false,
      wallet_frozen: false,
      daily_transaction_limit: 0,
      monthly_transaction_limit: 0,
      onboarding_step: 0,
      onboarding_completed: false,
      bank78_verified: false,
      primary_provider: "nomba",
      wallet_provider: "nomba",
      face_liveness_verified: false,
      face_comparison_verified: false,
      has_business_account_pro: false,
      // ═══════════════════════════════════════════════════
      // ✅ NEW — Account tier + custom fee overrides
      // ═══════════════════════════════════════════════════
      account_tier: finalTier,
      custom_outflow_percent: parsedCustomPercent,
      custom_outflow_min: parsedCustomMin,
      custom_fee_note: customFeeNote?.trim() || null,
    })
    .select()
    .single();

  if (userError) {
    console.error("❌ User insert error:", userError);
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create user profile: " + userError.message },
      { status: 500 },
    );
  }

  // 9. Business
  if (businessName && businessName.trim()) {
    await supabase.from("businesses").insert({
      user_id: userId,
      business_name: businessName.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 10. Trial
  try {
    await supabase.from("user_trials").insert({
      user_id: userId,
      feature_key: "tax_calculator_access",
      starts_at: trialStartsAt.toISOString(),
      ends_at: trialEndsAt.toISOString(),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (trialError) {
    console.error("⚠️ Trial creation failed:", trialError);
  }

  // 11. Welcome email
  let welcomeEmailSent = false;
  if (sendWelcomeEmail) {
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_DEV_URL
          : process.env.NEXT_PUBLIC_BASE_URL;

      const verificationLink = `${baseUrl}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      const roleDisplay =
        requestedRole === "user"
          ? "User"
          : requestedRole
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

      const tierDisplay =
        finalTier === "tier_1"
          ? "Tier 1 (Enterprise)"
          : finalTier === "tier_2"
            ? "Tier 2 (Business)"
            : "Tier 3 (Standard)";

      await transporter.sendMail({
        from: `"Zidwell" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 Your Zidwell account is ready",
        html: emailShell({
          title: "Your Zidwell account is ready",
          preheader: "An account was created for you on Zidwell.",
          content: `
            ${ui.h1(`Welcome, ${esc(fullName)}!`)}
            ${ui.p(
              "An account has been created for you on Zidwell. Verify your email to get started.",
            )}
            ${ui.kvCard([
              { label: "Email", value: esc(email) },
              { label: "Account Tier", value: tierDisplay },
            ])}
            ${ui.cta("Verify email & set password", verificationLink)}
            ${ui.p("After clicking the button you can:")}
            ${ui.ul([
              "Verify your email address",
              "Set your own secure password",
              "Access your Zidwell dashboard",
            ])}
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

      welcomeEmailSent = true;
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (mailError) {
      console.error("❌ Welcome email error:", mailError);
    }
  }

  // 12. Audit log
  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    action: "create_user_via_admin",
    resourceType: "User",
    resourceId: userId,
    description: `Created new ${requestedRole} account (${finalTier}): ${email}`,
    metadata: {
      targetUserId: userId,
      targetEmail: email,
      targetRole: requestedRole,
      targetPhone: phone,
      targetAccountTier: finalTier,
      customOutflowPercent: parsedCustomPercent,
      customOutflowMin: parsedCustomMin,
      customFeeNote: customFeeNote?.trim() || null,
      businessName: businessName || null,
      welcomeEmailSent,
      performedBy: adminUser.email,
    },
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
  });

  return NextResponse.json(
    {
      success: true,
      action: "created",
      message: `User ${email} created successfully`,
      user: {
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone,
        admin_role: requestedRole,
        email_verified: false,
        business_name: businessName || null,
        account_tier: finalTier,
        custom_outflow_percent: parsedCustomPercent,
        custom_outflow_min: parsedCustomMin,
      },
      welcomeEmailSent,
      trial: {
        tax_calculator_access: {
          starts_at: trialStartsAt.toISOString(),
          ends_at: trialEndsAt.toISOString(),
          duration_days: 30,
        },
      },
    },
    { status: 201 },
  );
}

// ═════════════════════════════════════════════════════════════
// 🌍 PUBLIC SIGNUP HANDLER — CORRECTED
//
// The old version deleted any user whose public.users.email_verified
// was false — catastrophic when the user confirmed via Supabase
// magic link (auth confirmed but DB flag still false).
//
// New version: auth-check first. Only delete truly abandoned signups.
// ═════════════════════════════════════════════════════════════
async function handlePublicSignup(req: NextRequest, body: any) {
  const {
    fullName,
    businessName,
    email,
    phone,
    password,
    bvn,
    transactionPin,
  } = body;

  if (!fullName || !email || !phone || !password) {
    return NextResponse.json(
      { error: "Full name, email, phone, and password are required" },
      { status: 400 },
    );
  }

  const clientInfo = getClientInfo(req.headers);

  // ── Existing-user check — MUST consult auth before deleting ──
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email_verified, email, admin_role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    const { verified } = await isUserTrulyVerified(
      existingUser.id,
      existingUser.email_verified,
    );

    if (verified) {
      // Never delete a verified account. Reject with a clear message.
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. If you can't log in, use 'Forgot password'.",
          code: "email_already_registered",
        },
        { status: 409 },
      );
    }

    // Safe to delete abandoned, unverified signup
    console.log(
      `🧹 Deleting abandoned unverified signup for ${existingUser.email} (${existingUser.id})`,
    );

    const { error: authDelErr } = await supabase.auth.admin.deleteUser(
      existingUser.id,
    );
    if (authDelErr) {
      console.warn(
        "[register] auth delete failed, will still try public.users:",
        authDelErr.message,
      );
    }

    const { error: dbDelErr } = await supabase
      .from("users")
      .delete()
      .eq("id", existingUser.id);

    if (dbDelErr) {
      console.error(
        "[register] failed to delete abandoned signup from public.users:",
        dbDelErr.message,
      );
      // Don't fail the request — we'll proceed to create the new one,
      // but the user will get a 409 from auth.createUser below if the
      // old auth row survived.
    }

    // Audit log the cleanup
    try {
      await createAuditLog({
        userId: undefined, // public signup — no admin actor
        userEmail: existingUser.email,
        action: "delete_abandoned_signup",
        resourceType: "User",
        resourceId: existingUser.id,
        description: `Deleted abandoned unverified signup for ${existingUser.email} to allow re-registration`,
        metadata: {
          email: existingUser.email,
          reason: "unverified_re_signup",
          authDeleteFailed: !!authDelErr,
          dbDeleteFailed: !!dbDelErr,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    } catch (auditErr) {
      console.warn("[register] audit log failed:", auditErr);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let hashedPin = null;
  if (transactionPin) {
    if (!/^\d{4}$/.test(transactionPin)) {
      return NextResponse.json(
        { error: "Transaction PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }
    hashedPin = await bcrypt.hash(transactionPin, 10);
  }

  const namePart = fullName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const generatedReferral = `${namePart}-${Date.now().toString(36)}`;

  const verificationToken = generateVerificationToken();
  const verificationExpiresAt = new Date();
  verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        phone: phone,
      },
    });

  if (authError || !authData.user) {
    console.error("❌ Auth creation error:", authError);

    // Translate the common "already registered" case into a friendly message
    const msg = String(authError?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. If you can't log in, use 'Forgot password'.",
          code: "email_already_registered",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: authError?.message || "Failed to create user" },
      { status: 500 },
    );
  }

  const userId = authData.user.id;

  const trialStartsAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      id: userId,
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone,
      transaction_pin: hashedPin,
      pin_set: !!hashedPin,
      wallet_balance: 0,
      zidcoin_balance: 20,
      referral_code: generatedReferral,
      referred_by: null,
      bvn_verification: bvn ? "pending" : "not_submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      date_of_birth: null,
      city: null,
      state: null,
      address: null,
      country: null,
      profile_picture: null,
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      p_bank_name: null,
      p_bank_code: null,
      p_account_number: null,
      p_account_name: null,
      wallet_id: null,
      wallet_updated_at: null,
      admin_role: "user",
      is_blocked: false,
      blocked_at: null,
      block_reason: null,
      last_login: null,
      last_logout: null,
      current_login_session: null,
      current_session_id: null,
      current_session_ip: null,
      current_session_device: null,
      current_session_expires_at: null,
      subscription_tier: "free",
      subscription_expires_at: null,
      notification_preferences: {
        sms: false,
        push: true,
        email: true,
        in_app: true,
      },
      total_invoices_created: 0,
      invoices_used_monthly: 0,
      receipts_used_monthly: 0,
      contracts_used_monthly: 0,
      invoices_used_lifetime: 0,
      receipts_used_lifetime: 0,
      contracts_used_lifetime: 0,
      invoice_lifetime_limit: 10,
      receipt_lifetime_limit: 10,
      contract_lifetime_limit: 1,
      last_usage_reset: new Date().toISOString().split("T")[0],
      referral_source: null,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_token_expires: verificationExpiresAt.toISOString(),
      bvn_data: null,
      verification_completed: false,
      verification_step: 0,
      identity_verified: false,
      kyc_level: "unverified",
      verification_status: "pending",
      is_flagged: false,
      wallet_frozen: false,
      daily_transaction_limit: 0,
      monthly_transaction_limit: 0,
      onboarding_step: 0,
      onboarding_completed: false,
      bank78_verified: false,
      primary_provider: "nomba",
      wallet_provider: "nomba",
      face_liveness_verified: false,
      face_comparison_verified: false,
      has_business_account_pro: false,
      // Public signup always gets tier_3
      account_tier: "tier_3",
    })
    .select()
    .single();

  if (userError) {
    console.error("❌ User insert error:", userError);
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create user profile: " + userError.message },
      { status: 500 },
    );
  }

  if (businessName && businessName.trim()) {
    await supabase.from("businesses").insert({
      user_id: userId,
      business_name: businessName.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  try {
    await supabase.from("user_trials").insert({
      user_id: userId,
      feature_key: "tax_calculator_access",
      starts_at: trialStartsAt.toISOString(),
      ends_at: trialEndsAt.toISOString(),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (trialError) {
    console.error("⚠️ Trial creation failed:", trialError);
  }

  if (bvn && transactionPin) {
    try {
      const token = await getNombaToken();
      if (token) {
        const nombaRes = await fetch(
          `${process.env.NOMBA_URL}/v1/accounts/virtual`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              accountId: process.env.NOMBA_ACCOUNT_ID!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountName: fullName,
              accountRef: userId,
              bvn: bvn,
            }),
          },
        );

        const wallet = await nombaRes.json();

        if (nombaRes.ok && wallet?.data) {
          await supabase
            .from("users")
            .update({
              bank_name: wallet.data.bankName,
              bank_account_name: wallet.data.bankAccountName,
              bank_account_number: wallet.data.bankAccountNumber,
              wallet_id: wallet.data.accountRef,
              bvn_verification: "verified",
              wallet_updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      }
    } catch (nombaError) {
      console.error("⚠️ Nomba API error:", nombaError);
    }
  }

  (async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
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
            ${ui.p(`Hi ${esc(fullName)},`)}
            ${ui.p(
              "Thanks for creating your Zidwell account. Verify your email to access your dashboard.",
            )}
            ${ui.cta("Verify email address", verificationLink)}
            ${ui.muted("This link expires in 24 hours.")}
            ${ui.divider()}
            ${ui.h3("Trouble with the button?")}
            <p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#666663; word-break:break-all;">
              <a href="${esc(verificationLink)}" style="color:#2563EB;">${esc(verificationLink)}</a>
            </p>
            ${ui.signature()}
          `,
        }),
      });
    } catch (mailError) {
      console.error("❌ Verification email error:", mailError);
    }
  })();

  return NextResponse.json(
    {
      success: true,
      message: "Registration successful. Please verify your email.",
      requiresVerification: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone,
        business_name: businessName || null,
        account_tier: "tier_3",
      },
      trial: {
        tax_calculator_access: {
          starts_at: trialStartsAt.toISOString(),
          ends_at: trialEndsAt.toISOString(),
          duration_days: 30,
        },
      },
    },
    { status: 201 },
  );
}