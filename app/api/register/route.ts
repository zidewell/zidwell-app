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
    } = body;

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Full name, email, phone, and password are required" },
        { status: 400 },
      );
    }

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
        region: region || null,
        purpose: purpose || null,
        heard_from: heardFrom || null,
        attractions: attractions || null,
        nin: nin || null,
        is_business_registered: isRegistered || null,
        cac_number: cacNumber || null,
        business_address: businessAddress || null,
        map_url: mapUrl || null,
        business_description: businessDescription || null,
        onboarding_completed: true,
        onboarding_step: 6,
        account_activated: false,
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
        admin_role: null,
        is_blocked: false,
        blocked_at: null,
        block_reason: null,
        last_login: null,
        last_logout: null,
        current_login_session: null,
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

    if (businessName && businessName.trim() && purpose === "business") {
      const { error: businessError } = await supabase
        .from("businesses")
        .insert({
          user_id: userId,
          business_name: businessName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_registered: isRegistered || false,
          cac_number: cacNumber || null,
          business_address: businessAddress || null,
          map_url: mapUrl || null,
          business_description: businessDescription || null,
        });

      if (businessError) {
        console.error("Error creating business record:", businessError);
      }
    }

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
                  ${businessName ? `<p style="color: #666; line-height: 1.6;">Your business "${businessName}" has been registered successfully.</p>` : ""}
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
                       style="background: #FDC020; color: #191919; padding: 12px 24px; border-radius: 8px; 
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
        console.error("Email error:", mailError);
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