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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      password,
      region,
      purpose,
      heardFrom,
      attractions,
      bvn,
      nin,
      isRegistered,
      businessName,
      cacNumber,
      businessAddress,
      mapUrl,
      businessDescription,
      transactionPin,
      businessCategory,
      businessType,
      businessIndustry,
      businessEmail,
      businessPhone,
      businessWebsite,
    } = body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Full name, email, phone, and password are required" },
        { status: 400 },
      );
    }

    // Check existing user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
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

    // Generate email verification token (optional - if you want custom verification)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Create auth user with email_confirm: true (Supabase handles email verification)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true, // Supabase sends verification email
        user_metadata: {
          full_name: fullName,
          phone: phone,
        },
      });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    const userId = authData.user.id;
    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Insert user with all fields
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        full_name: fullName,
        first_name: fullName.split(" ")[0],
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        email: email.toLowerCase(),
        phone: phone,
        transaction_pin: hashedPin,
        pin_set: !!hashedPin,
        wallet_balance: 0,
        zidcoin_balance: 20,
        referral_code: generatedReferral,
        referred_by: null,
        // Verification fields
        bvn_verification: bvn ? "pending" : "not_submitted",
        nin_verification: nin ? "pending" : "not_submitted",
        nin: nin || null,
        is_business_registered: purpose === "business" ? (isRegistered || false) : false,
        // Email verification
        email_verified: false,
        email_verification_token: verificationToken,
        email_verification_token_expires: tokenExpiry.toISOString(),
        // Onboarding
        onboarding_completed: true,
        onboarding_step: 6,
        // User metadata
        region: region || null,
        purpose: purpose || null,
        heard_from: heardFrom || null,
        attractions: attractions || null,
        date_of_birth: null,
        city: null,
        state: null,
        address: null,
        country: null,
        profile_picture: null,
        // Bank fields
        bank_name: null,
        bank_account_name: null,
        bank_account_number: null,
        p_bank_name: null,
        p_bank_code: null,
        p_account_number: null,
        p_account_name: null,
        wallet_id: null,
        wallet_updated_at: null,
        // Admin
        admin_role: null,
        is_blocked: false,
        blocked_at: null,
        block_reason: null,
        // Session
        last_login: null,
        last_logout: null,
        current_login_session: null,
        // Subscription
        subscription_tier: "free",
        subscription_expires_at: null,
        // Notifications
        notification_preferences: {
          sms: false,
          push: true,
          email: true,
          in_app: true,
        },
        // Usage limits
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
        // PIN security
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_token: null,
        pin_reset_token_expires: null,
        // Flags
        is_flagged: false,
        flag_reason: null,
        flag_notes: null,
        flagged_at: null,
        // Wallet
        wallet_frozen: false,
        wallet_freeze_reason: null,
        wallet_frozen_at: null,
        // Limits
        daily_transaction_limit: 0,
        monthly_transaction_limit: 0,
        limit_updated_at: null,
        // KYC
        suspension_duration: null,
        kyc_approved_at: null,
        kyc_approved_by: null,
        kyc_rejected_at: null,
        kyc_rejection_reason: null,
        kyc_rejected_by: null,
        verification_response: null,
        referral_source: null,
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("User insert error:", userError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create user profile: " + userError.message },
        { status: 500 },
      );
    }

    // Create business record if purpose is business
    if (purpose === "business" && businessName && businessName.trim()) {
      const { error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: userId,
          business_name: businessName.trim(),
          business_address: businessAddress || null,
          business_category: businessCategory || null,
          business_type: businessType || null,
          business_industry: businessIndustry || null,
          business_description: businessDescription || null,
          business_email: businessEmail || null,
          business_phone: businessPhone || null,
          business_website: businessWebsite || null,
          is_registered: isRegistered || false,
          cac_number: cacNumber || null,
          map_url: mapUrl || null,
          verification_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (businessError) {
        console.error("Error creating business record:", businessError);
        // Don't fail registration if business creation fails
      }
    }

    // Create trial record
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
        console.error("Error creating tax calculator trial:", taxTrialError);
      }
    } catch (trialError) {
      console.error("Error activating tax calculator trial:", trialError);
    }

    // Create Nomba wallet if BVN provided
    if (bvn) {
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
            console.warn("Nomba wallet creation failed:", wallet);
          }
        }
      } catch (nombaError) {
        console.error("Nomba API error:", nombaError);
      }
    }

    // Send welcome email (async)
    (async () => {
      try {
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_DEV_URL
            : process.env.NEXT_PUBLIC_BASE_URL;

        await transporter.sendMail({
          from: `"Zidwell" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "🎉 Welcome to Zidwell!",
          html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Zidwell</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #fdc020 0%, #f5b800 100%); padding: 32px 24px; text-align: center; }
      .header h1 { font-size: 28px; font-weight: 700; color: #191919; }
      .content { padding: 40px 32px; }
      .greeting { font-size: 20px; font-weight: 600; color: #191919; margin-bottom: 16px; }
      .text { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.7; }
      .features { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .feature { padding: 8px 0; display: flex; align-items: center; gap: 12px; }
      .feature:not(:last-child) { border-bottom: 1px solid #e5e7eb; }
      .button-container { text-align: center; margin: 32px 0; }
      .cta-button { 
        display: inline-block;
        background: linear-gradient(135deg, #fdc020 0%, #f5b800 100%);
        color: #191919;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(253, 192, 32, 0.3);
      }
      .cta-button:hover {
        box-shadow: 0 4px 12px rgba(253, 192, 32, 0.4);
        transform: translateY(-2px);
      }
      .important { 
        background: #fef3c7; 
        border-left: 4px solid #f59e0b; 
        padding: 12px 16px; 
        border-radius: 4px;
        margin: 16px 0;
      }
      .footer { background: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
      @media (max-width: 600px) {
        .content { padding: 24px 16px; }
        .cta-button { padding: 12px 24px; font-size: 14px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Welcome to Zidwell</h1>
      </div>
      <div class="content">
        <p class="greeting">Hi ${fullName},</p>
        <p class="text">
          Congratulations! Your Zidwell account is ready and waiting. We're thrilled to have you on board!
        </p>
        ${businessName ? `<p class="text">Your business "<strong>${businessName}</strong>" has been registered successfully.</p>` : ""}
        
        <div class="important">
          <strong>⚠️ Important:</strong> Please check your email for the verification link sent by Supabase to activate your account.
        </div>

        <p class="text">Here's what you get with your free trial:</p>
        <div class="features">
          <div class="feature">✨ <strong>10 Free Invoices</strong> — Start managing your billing right away</div>
          <div class="feature">📋 <strong>10 Free Receipts</strong> — Keep organized records of all transactions</div>
          <div class="feature">📊 <strong>30-Day Tax Calculator Trial</strong> — Simplify tax planning</div>
          <div class="feature">🎁 <strong>₦20 Zidcoin Welcome Bonus</strong> — Use it on any premium services</div>
        </div>
        <p class="text" style="font-size: 14px; color: #6b7280;">
          Your tax calculator trial starts today and will expire on <strong>${trialEndsAt.toLocaleDateString()}</strong>.
        </p>

        <div class="button-container">
          <a href="${baseUrl}/dashboard" class="cta-button">
            Go to Dashboard
          </a>
        </div>

        <p class="text" style="font-size: 14px; color: #6b7280; margin-top: 16px;">
          Questions? Our support team is here to help. Reply to this email or visit our Help Center.
        </p>
      </div>
      <div class="footer">
        <p>© 2026 Zidwell. All rights reserved.</p>
        <p style="margin-top: 4px;">You're receiving this email because you recently created a Zidwell account.</p>
        <p style="margin-top: 4px; font-size: 11px; color: #9ca3af;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    </div>
  </body>
</html>
          `,
        });

        console.log("Welcome email sent successfully to:", email);
      } catch (mailError) {
        console.error("Email error:", mailError);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email for verification.",
        user: {
          id: userId,
          email: email.toLowerCase(),
          full_name: fullName,
          phone: phone,
          business_name: businessName || null,
          requires_verification: true,
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
    console.error("Unexpected Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 },
    );
  }
}