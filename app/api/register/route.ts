import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, businessName, email, phone, password, bvn, transactionPin } = body;

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
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
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
    const namePart = fullName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedReferral = `${namePart}-${Date.now().toString(36)}`;

    // ✅ 6. Create user in Supabase Auth
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
      console.error("❌ Auth creation error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    const userId = authData.user.id;

    // ✅ 7. Calculate trial dates (30 days from now) - Only for Tax Calculator
    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30-day trial

    // ✅ 8. Create user profile in users table with UPDATED limits (10 invoices/receipts)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        // Core required fields
        id: userId,
        full_name: fullName,
        email: email.toLowerCase(),
        phone: phone,
        
        // Authentication fields
        transaction_pin: hashedPin,
        pin_set: !!hashedPin,
        
        // Balance fields (defaults)
        wallet_balance: 0,
        zidcoin_balance: 20,
        
        // Referral fields
        referral_code: generatedReferral,
        referred_by: null,
        
        // BVN verification
        bvn_verification: bvn ? "pending" : "not_submitted",
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Personal information - all null for new user
        first_name: null,
        last_name: null,
        date_of_birth: null,
        city: null,
        state: null,
        address: null,
        country: null,
        profile_picture: null,
        
        // Bank information - all null initially
        bank_name: null,
        bank_account_name: null,
        bank_account_number: null,
        p_bank_name: null,
        p_bank_code: null,
        p_account_number: null,
        p_account_name: null,
        
        // Wallet information
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
        
        // Subscription defaults
        subscription_tier: 'free',
        subscription_expires_at: null,
        
        // Notification preferences (default JSON)
        notification_preferences: {
          sms: false,
          push: true,
          email: true,
          in_app: true
        },
        
        // Usage tracking - all zero initially
        total_invoices_created: 0,
        invoices_used_monthly: 0,
        receipts_used_monthly: 0,
        contracts_used_monthly: 0,
        invoices_used_lifetime: 0,
        receipts_used_lifetime: 0,
        contracts_used_lifetime: 0,
        
        // UPDATED LIMITS: 10 invoices, 10 receipts, 1 contract
        invoice_lifetime_limit: 10,
        receipt_lifetime_limit: 10,
        contract_lifetime_limit: 1,
        
        // Last usage reset
        last_usage_reset: new Date().toISOString().split('T')[0],
        
        // Referral source
        referral_source: null,
      })
      .select()
      .single();

    if (userError) {
      console.error("❌ User insert error:", userError);
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create user profile: " + userError.message },
        { status: 500 },
      );
    }

    // ✅ 9. Insert business name into businesses table if provided
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
        // Don't fail registration if business creation fails, just log it
      } else {
        console.log(`✅ Created business record for user ${userId}: ${businessName}`);
      }
    }

    // ✅ 10. ACTIVATE 30-DAY TRIAL ONLY FOR TAX CALCULATOR (Bookkeeping trial removed)
    try {
      // Insert tax calculator trial only
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
      } else {
        console.log(`✅ Activated 30-day tax calculator trial for user ${userId} until ${trialEndsAt.toISOString()}`);
      }
    } catch (trialError) {
      console.error("⚠️ Error activating tax calculator trial:", trialError);
      // Don't fail registration if trial creation fails
    }

    // ✅ 11. Handle BVN and virtual account creation if provided
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
            // Update user with wallet information
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

    // ✅ 12. Send welcome email (non-blocking)
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
                <div style="background: #2b825b; padding: 20px; text-align: center;">
                  <h2 style="color: white; margin: 0;">Welcome to Zidwell 🎉</h2>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #333;">Hi ${fullName},</h2>
                  <p style="color: #666; line-height: 1.6;">Congratulations! Your Zidwell account is ready.</p>
                  ${businessName ? `<p style="color: #666; line-height: 1.6;">Your business "${businessName}" has been registered successfully.</p>` : ''}
                  <p style="color: #666; line-height: 1.6;">Here's what you get with your free trial:</p>
                  <ul style="color: #666; line-height: 1.6;">
                    <li>✨ <strong>10 Free Invoices</strong> to get started</li>
                    <li>✨ <strong>10 Free Receipts</strong> for your records</li>
                    <li>✨ <strong>30-day free trial</strong> of Tax Calculator</li>
                    <li>✨ <strong>₦20 Zidcoin</strong> welcome bonus 🎁</li>
                  </ul>
                  <p style="color: #666; line-height: 1.6;">Your tax calculator trial starts today and will expire on <strong>${trialEndsAt.toLocaleDateString()}</strong>.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/dashboard" 
                       style="background: #2b825b; color: white; padding: 12px 24px; border-radius: 8px; 
                              text-decoration: none; display: inline-block; font-weight: bold;">
                      Go to Dashboard
                    </a>
                  </div>
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If you didn't create this account, please ignore this email.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (mailError) {
        console.error("❌ Email error:", mailError);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
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
            duration_days: 30
          }
        }
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