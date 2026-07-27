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
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
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
        is_business_registered:
          purpose === "business" ? isRegistered || false : false,
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
            <div style="background: #f3f4f6; padding: 20px; font-family: Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
                <div style="background: #FDC020; padding: 20px; text-align: center;">
                  <h2 style="color: #191919; margin: 0;">Welcome to Zidwell 🎉</h2>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #333;">Hi ${fullName},</h2>
                  <p style="color: #666; line-height: 1.6;">Congratulations! Your Zidwell account is ready.</p>
                  <p style="color: #666; line-height: 1.6;">Please complete your KYC verification to unlock all features.</p>
                  <p style="color: #666; line-height: 1.6;">Here's what you get with your free trial:</p>
                  <ul style="color: #666; line-height: 1.6;">
                    <li>✨ <strong>10 Free Invoices</strong> to get started</li>
                    <li>✨ <strong>10 Free Receipts</strong> for your records</li>
                    <li>✨ <strong>30-day free trial</strong> of Tax Calculator</li>
                    <li>✨ <strong>₦20 Zidcoin</strong> welcome bonus 🎁</li>
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/dashboard" 
                       style="background: #FDC020; color: #191919; padding: 12px 24px; border-radius: 8px; 
                              text-decoration: none; display: inline-block; font-weight: bold;">
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              </div>
            </div>
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
        message:
          "Registration successful. Please check your email for verification.",
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
