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
    const { name, email, phone, password, bvn, transactionPin } = body;

    // ✅ 1. Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Name, email, phone, and password are required" },
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
    const namePart = name.split(" ")[0].toLowerCase();
    const generatedReferral = `${namePart}-${Date.now().toString(36)}`;

    // ✅ 6. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
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

    // ✅ 7. Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        full_name: name,
        email: email.toLowerCase(),
        phone: phone,
        transaction_pin: hashedPin,
        pin_set: !!hashedPin,
        wallet_balance: 0,
        zidcoin_balance: 20,
        referral_code: generatedReferral,
        bvn_verification: bvn ? "pending" : "not_submitted",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("❌ User insert error:", userError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 },
      );
    }

    if (bvn && transactionPin) {
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
              accountName: name,
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
            })
            .eq("id", userId);
        }
      }
    }

    // ✅ 9. Send welcome email (non-blocking)
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
            <div style="background: #f3f4f6; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px;">
                <div style="background: #2b825b; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h2 style="color: white; margin: 0;">Welcome to Zidwell 🎉</h2>
                </div>
                <div style="padding: 30px;">
                  <h2>Hi ${name},</h2>
                  <p>Congratulations! Your Zidwell account is ready.</p>
                  <p>We've rewarded you with <strong style="color: #2b825b;">₦20 Zidcoin</strong> 🎁.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/dashboard" 
                       style="background: #2b825b; color: white; padding: 12px 24px; border-radius: 8px; 
                              text-decoration: none; display: inline-block;">
                      Go to Dashboard
                    </a>
                  </div>
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
