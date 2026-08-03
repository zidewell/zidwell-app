import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Email template
const getVerificationEmailHtml = (fullName: string, link: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #FDC020; font-size: 32px; margin: 0;">Zidwell</h1>
      </div>
      
      <div style="background: #f9f9f9; border-radius: 10px; padding: 30px; margin: 20px 0;">
        <h2 style="color: #333; margin-top: 0;">Welcome, ${fullName}! 👋</h2>
        
        <p>Thank you for creating your Zidwell account. Please verify your email address to get started.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" 
             style="display: inline-block; background-color: #FDC020; color: #000; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <a href="${link}" style="background: white; padding: 12px; border-radius: 5px; word-break: break-all; font-size: 14px; border: 1px solid #ddd;">
          click here instead
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          ⏰ This verification link will expire in 24 hours.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px; border-top: 1px solid #eee;">
        <p>© ${new Date().getFullYear()} Zidwell. All rights reserved.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      </div>
    </body>
  </html>
`;

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
      // Business profile fields (CAC number NOT included)
      businessType,
      teamSize,
      isRegistered,
      businessName,
      businessAddress,
      mapUrl,
      businessDescription,
      businessEmail,
      businessPhone,
      businessWebsite,
    } = body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Full name, email, phone, and password are required" },
        { status: 400 }
      );
    }

    // Check existing user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email_verified")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      if (!existingUser.email_verified) {
        try {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email.toLowerCase(),
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
            }
          });

          if (resendError) {
            console.error("Resend error:", resendError);
            return NextResponse.json(
              { error: "Failed to resend verification email" },
              { status: 500 }
            );
          }

          return NextResponse.json(
            { 
              error: "Email not verified. New verification email sent.",
              user_exists: true,
              email_verified: false
            },
            { status: 409 }
          );
        } catch (error) {
          console.error("Resend error:", error);
          return NextResponse.json(
            { error: "Failed to resend verification email" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: "Email already registered. Please login." },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        phone: phone,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Generate verification link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      password: password,
    });

    if (linkError || !linkData) {
      console.error("Link generation error:", linkError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to generate verification link" },
        { status: 500 }
      );
    }

    // Insert user profile
    const userInsertData = {
      id: userId,
      full_name: fullName,
      first_name: fullName.split(" ")[0],
      last_name: fullName.split(" ").slice(1).join(" ") || "",
      email: email.toLowerCase(),
      phone: phone,
      wallet_balance: 0,
      zidcoin_balance: 20,
      referral_code: `${fullName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`,
      email_verified: false,
      region: region || null,
      admin_role: "user",
      purpose: purpose || null,
      heard_from: heardFrom || null,
      attractions: attractions || null,
      subscription_tier: "free",
      verification_completed: false,
      verification_step: 0,
      bvn_verification: "not_submitted",
      bank78_verified: false,
      primary_provider: "nomba",
      wallet_provider: "nomba",
      onboarding_completed: false,
      onboarding_step: 0,
      is_business_registered: purpose === "business" ? isRegistered || false : false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: userError } = await supabase
      .from("users")
      .insert(userInsertData);

    if (userError) {
      console.error("User insert error:", userError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create user profile: " + userError.message },
        { status: 500 }
      );
    }

    // ✅ Create business record WITHOUT CAC number
    if (purpose === 'business') {
      const businessInsertData = {
        user_id: userId,
        business_name: businessName?.trim() || "Unnamed Business",
        business_type: businessType || null,
        business_address: businessAddress || null,
        business_description: businessDescription || null,
        map_url: mapUrl || null,
        business_email: businessEmail || null,
        business_phone: businessPhone || null,
        business_website: businessWebsite || null,
        is_registered: isRegistered || false,
        verification_status: 'pending',
        business_kyc_completed: false,
        cac_verified: false,
        director_verified: false,
        authorized_representative_verified: false,
        // ❌ cac_number NOT set - will be added during onboarding verification
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: businessError } = await supabase
        .from('businesses')
        .insert(businessInsertData);

      if (businessError) {
        console.error('Business creation error:', businessError);
      }
    }

    // Send verification email
    try {
      const verificationLink = linkData.properties.action_link;
      
      await transporter.sendMail({
        from: `Zidwell <${process.env.EMAIL_USER}>`,
        to: email.toLowerCase(),
        subject: "Verify Your Email - Zidwell",
        html: getVerificationEmailHtml(fullName, verificationLink),
      });
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Email error:", emailError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: userId,
          email: email.toLowerCase(),
          full_name: fullName,
          purpose: purpose,
          requires_verification: true,
          verification_step: 0,
          verification_completed: false,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}