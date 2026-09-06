// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { transporter } from "@/lib/node-mailer";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      businessName,
      email,
      phone,
      password,
      bvn,
      transactionPin,
    } = body;

    // ✅ 1. Validate required fields
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Full name, email, phone, and password are required" },
        { status: 400 },
      );
    }

    // ✅ 2. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email_verified")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      // If user exists but not verified, allow re-registration
      if (existingUser.email_verified === false) {
        // Delete the unverified user to allow re-registration
        await supabase.auth.admin.deleteUser(existingUser.id);
        await supabase.from("users").delete().eq("id", existingUser.id);
      } else {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 },
        );
      }
    }

    // ✅ 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 4. Hash PIN if provided
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

    // ✅ 5. Generate referral code
    const namePart = fullName
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const generatedReferral = `${namePart}-${Date.now().toString(36)}`;

    // ✅ 6. Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24); // 24 hours expiry

    // ✅ 7. Create user in Supabase Auth (email_confirm: false)
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
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    const userId = authData.user.id;

    // ✅ 8. Calculate trial dates (30 days from now)
    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // ✅ 9. Create user profile in users table with matching schema
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
        // Personal information
        first_name: null,
        last_name: null,
        date_of_birth: null,
        city: null,
        state: null,
        address: null,
        country: null,
        profile_picture: null,
        // Bank information
        bank_name: null,
        bank_account_name: null,
        bank_account_number: null,
        p_bank_name: null,
        p_bank_code: null,
        p_account_number: null,
        p_account_name: null,
        wallet_id: null,
        wallet_updated_at: null,
        // Admin fields
        admin_role: null,
        // Block status
        is_blocked: false,
        blocked_at: null,
        block_reason: null,
        // Session tracking
        last_login: null,
        last_logout: null,
        current_login_session: null,
        current_session_id: null,
        current_session_ip: null,
        current_session_device: null,
        current_session_expires_at: null,
        // Subscription defaults
        subscription_tier: "free",
        subscription_expires_at: null,
        // Notification preferences
        notification_preferences: {
          sms: false,
          push: true,
          email: true,
          in_app: true,
        },
        // Usage tracking
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
        // ✅ Email verification fields (matching your schema)
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expires: verificationExpiresAt.toISOString(),
        // BVN fields
        bvn_data: null,
        verification_completed: false,
        verification_step: 0,
        identity_verified: false,
        kyc_level: "unverified",
        verification_status: "pending",
        // Other defaults
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

    // ✅ 10. Insert business name
    if (businessName && businessName.trim()) {
      const { error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: userId,
          business_name: businessName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (businessError) {
        console.error("❌ Error creating business record:", businessError);
      }
    }

    // ✅ 11. Activate tax calculator trial
    try {
      const { error: taxTrialError } = await supabase
        .from("user_trials")
        .insert({
          user_id: userId,
          feature_key: "tax_calculator_access",
          starts_at: trialStartsAt.toISOString(),
          ends_at: trialEndsAt.toISOString(),
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (taxTrialError) {
        console.error("❌ Error creating tax calculator trial:", taxTrialError);
      }
    } catch (trialError) {
      console.error("⚠️ Error activating tax calculator trial:", trialError);
    }

    // ✅ 12. Handle BVN and virtual account creation
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
          } else {
            console.warn("⚠️ Nomba wallet creation failed:", wallet);
          }
        }
      } catch (nombaError) {
        console.error("⚠️ Nomba API error:", nombaError);
      }
    }

    // ✅ 13. Send verification email (ONLY this, no welcome email yet)
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
          subject: "🔐 Verify Your Zidwell Account",
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
                    Hi ${fullName},
                  </p>
                  <p style="margin-top: 20px; color: #555555; font-size: 16px; line-height: 28px;">
                    Thank you for creating your Zidwell account. Before you can access your dashboard and start managing your business finances, please verify your email address.
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
                    If you did not create a Zidwell account, you can safely ignore this email.
                  </p>
                  <p style="margin-top: 30px; font-size: 15px; color: #555555; line-height: 26px;">
                    Need help? Contact us anytime at
                    <a href="mailto:support@zidwell.com" style="color: #2563eb;">support@zidwell.com</a>
                  </p>
                </div>
                <div style="background: #fafafa; padding: 30px; border-top: 1px solid #eeeeee; text-align: center;">
                  <p style="margin: 0; color: #777777; font-size: 14px;">© Zidwell. All rights reserved.</p>
                  <p style="margin-top: 10px; color: #999999; font-size: 12px;">This is an automated email. Please do not reply.</p>
                  <p style="margin-top: 12px; color: #999999; font-size: 12px;">Zidwell Technologies Ltd.<br>Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          `,
        });

        console.log(`✅ Verification email sent to ${email}`);
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
  } catch (error: any) {
    console.error("❌ Unexpected Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 },
    );
  }
}