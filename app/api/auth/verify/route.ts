// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    console.log(`🔐 Verification attempt for: ${email}`);

    if (!token || !email) {
      return NextResponse.json(
        { error: "Invalid verification link" },
        { status: 400 }
      );
    }

    const decodedEmail = decodeURIComponent(email).toLowerCase();
    console.log(`📧 Looking up user: ${decodedEmail}`);

    // Try to find user in users table
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, email_verification_token, email_verification_token_expires, email_verified")
      .eq("email", decodedEmail)
      .maybeSingle();

    // If not found, try case-insensitive
    if (!user) {
      console.log(`⚠️ User not found with exact email, trying case-insensitive...`);
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, email_verification_token, email_verification_token_expires, email_verified")
        .ilike("email", decodedEmail)
        .maybeSingle();
      
      user = data;
    }

    // If still not found, try to get user from auth and create record
    if (!user) {
      console.log(`🔄 User not in users table, checking auth...`);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.admin
          .listUsers({
            perPage: 1000,
          });

        if (authError) {
          console.error("❌ Auth list error:", authError);
        } else if (authData?.users?.length > 0) {
          const authUser = authData.users.find(
            (u: any) => u.email?.toLowerCase() === decodedEmail
          );

          if (authUser) {
            console.log(`✅ Auth user found: ${authUser.id}`);
            
            const fullName = authUser.user_metadata?.full_name || 
                            authUser.email?.split('@')[0] || 
                            'User';
            
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert({
                id: authUser.id,
                email: decodedEmail,
                full_name: fullName,
                phone: authUser.user_metadata?.phone || '',
                email_verification_token: token,
                email_verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                email_verified: false,
                wallet_balance: 0,
                zidcoin_balance: 20,
                subscription_tier: 'free',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                invoice_lifetime_limit: 10,
                receipt_lifetime_limit: 10,
                contract_lifetime_limit: 1,
                notification_preferences: {
                  sms: false,
                  push: true,
                  email: true,
                  in_app: true,
                },
                pin_set: false,
                is_blocked: false,
                bvn_verification: 'not_submitted',
                kyc_level: 'unverified',
                verification_status: 'pending',
                onboarding_step: 0,
                onboarding_completed: false,
                bank78_verified: false,
                primary_provider: 'nomba',
                wallet_provider: 'nomba',
              })
              .select()
              .single();

            if (newUser) {
              console.log(`✅ User record created in DB: ${newUser.id}`);
              user = newUser;
            }
          }
        }
      } catch (authError) {
        console.error("❌ Auth lookup error:", authError);
      }
    }

    if (!user) {
      console.log(`❌ User not found for email: ${decodedEmail}`);
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 400 }
      );
    }

    console.log(`✅ User found: ${user.email}`);

    // ✅ CHECK IF ALREADY VERIFIED - Return specific status
    if (user.email_verified) {
      console.log("ℹ️ Email already verified");
      return NextResponse.json(
        { 
          error: "Email already verified",
          alreadyVerified: true,
          message: "This email has already been verified."
        },
        { status: 400 }
      );
    }

    // Check if token matches
    if (user.email_verification_token !== token) {
      console.log(`❌ Token mismatch`);
      return NextResponse.json(
        { error: "Invalid verification token. Please request a new link." },
        { status: 400 }
      );
    }

    // Check if token expired
    if (user.email_verification_token_expires) {
      const expiresAt = new Date(user.email_verification_token_expires);
      if (expiresAt < new Date()) {
        console.log("⏰ Token expired");
        return NextResponse.json(
          { error: "Verification link has expired. Please request a new one." },
          { status: 400 }
        );
      }
    }

    // ✅ Update user - mark email as verified
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error updating user verification:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email" },
        { status: 500 }
      );
    }

    console.log(`✅ Email verified for: ${user.email}`);

    // ✅ Confirm email in Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });
      console.log("✅ Auth user confirmed");
    } catch (authError) {
      console.error("⚠️ Could not update auth user:", authError);
    }

    // ✅ Send welcome email
    (async () => {
      try {
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_DEV_URL
            : process.env.NEXT_PUBLIC_BASE_URL;

        const headerImageUrl = `${baseUrl}/zidwell-header.png`;
        const welcomeImageUrl = `${baseUrl}/Zidwell Welcome Email 2026.png`

        const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

        await transporter.sendMail({
          from: `"Zidwell" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "🎉 Welcome to Zidwell!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
              <h3 style="color: #22c55e;">✅ Account Verified!</h3>
              <p>Hi ${user.full_name},</p>
              <p>Your account has been successfully verified and is now ready to use!</p>
              
              <img src="${welcomeImageUrl}" style="width: 100%; margin: 10px 0; border-radius: 8px;" />

            

              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard" 
                   style="background: #FDC020; color: #191919; padding: 12px 24px; border-radius: 8px; 
                          text-decoration: none; display: inline-block; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>
              <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
            </div>
          `,
        });

        console.log(`✅ Welcome email sent to ${user.email}`);
      } catch (mailError) {
        console.error("❌ Welcome email error:", mailError);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error: any) {
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}