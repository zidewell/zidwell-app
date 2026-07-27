// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      fullName,
      email,
      phone,
      purpose,
      identityType,
      identityNumber,
      transactionPin,
      identityData,
      business,
    } = body;

    if (!userId || !fullName || !email || !phone || !transactionPin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(transactionPin)) {
      return NextResponse.json(
        { error: "Transaction PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }

    const hashedPin = await bcrypt.hash(transactionPin, 10);

    // Update user with verification data
    const updateData: any = {
      transaction_pin: hashedPin,
      pin_set: true,
      bvn_verification: identityType === "bvn" ? "verified" : "not_submitted",
      nin_verification: identityType === "nin" ? "verified" : "not_submitted",
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // If identity data exists, update user profile
    if (identityData) {
      if (identityData.firstName) updateData.first_name = identityData.firstName;
      if (identityData.lastName) updateData.last_name = identityData.lastName;
      if (identityData.phone) updateData.phone = identityData.phone;
    }

    // Update user
    const { data: userData, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update user verification" },
        { status: 500 },
      );
    }

    // Handle business verification
    let businessData = null;
    if (purpose === "business" && business) {
      const businessInsert = {
        user_id: userId,
        business_name: business.businessName,
        is_registered: business.isRegistered,
        cac_number: business.cacNumber,
        business_address: business.businessAddress,
        business_category: business.businessCategory,
        business_description: business.businessDescription,
        map_url: business.mapUrl,
        business_email: business.businessEmail,
        business_phone: business.businessPhone,
        business_website: business.businessWebsite,
        verification_status: business.isRegistered ? "pending" : "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .insert(businessInsert)
        .select()
        .single();

      if (bizError) {
        console.error("Business insert error:", bizError);
      } else {
        businessData = bizData;
        // Update user with business verification status
        await supabase
          .from("users")
          .update({
            is_business_registered: business.isRegistered || false,
            business_verified: business.isRegistered ? "pending" : "pending",
          })
          .eq("id", userId);
      }
    }

    // Create Nomba wallet for all users (personal or business)
    let walletData = null;
    try {
      const walletResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/nomba/create-wallet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            fullName,
            email,
            phone,
            businessName: business?.businessName || null,
          }),
        }
      );

      const walletResult = await walletResponse.json();

      if (walletResult.success) {
        walletData = walletResult.data;
        // Update user with wallet info
        await supabase
          .from("users")
          .update({
            wallet_id: walletData.accountRef,
            bank_name: walletData.bankName,
            bank_account_name: walletData.bankAccountName,
            bank_account_number: walletData.bankAccountNumber,
            wallet_updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } else {
        console.error("Wallet creation error:", walletResult.error);
      }
    } catch (walletError) {
      console.error("Wallet creation error:", walletError);
    }

    // Send welcome email
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? process.env.NEXT_PUBLIC_DEV_URL
          : process.env.NEXT_PUBLIC_BASE_URL;

      await fetch(`${baseUrl}/api/send-welcome-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          accountNumber: walletData?.accountNumber || "N/A",
          bankName: walletData?.bankName || "Wema Bank",
        }),
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Verification complete and account activated",
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        bvn_verification: userData.bvn_verification,
        nin_verification: userData.nin_verification,

      },
      wallet: walletData
        ? {
            bankName: walletData.bankName,
            bankAccountName: walletData.bankAccountName,
            bankAccountNumber: walletData.bankAccountNumber,
            accountRef: walletData.accountRef,
          }
        : null,
      business: businessData,
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Onboarding failed" },
      { status: 500 },
    );
  }
}