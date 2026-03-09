import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, bvn, transactionPin, fullName } = await req.json();

    // Validate inputs
    if (!userId || !bvn || !transactionPin || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^\d{11}$/.test(bvn)) {
      return NextResponse.json(
        { error: "BVN must be exactly 11 digits" },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(transactionPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { error: "Failed to authenticate with banking service" },
        { status: 401 }
      );
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(transactionPin, 10);

    // Call Nomba API to create virtual account
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
      }
    );

    const wallet = await nombaRes.json();

    if (!nombaRes.ok || !wallet?.data) {
      console.error("❌ Nomba wallet error:", wallet);
      return NextResponse.json(
        { error: wallet.message || "Failed to create wallet" },
        { status: nombaRes.status }
      );
    }

    // Update user in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        transaction_pin: hashedPin,
        pin_set: true,
        bvn_verification: "verified",
        bank_name: wallet.data.bankName,
        bank_account_name: wallet.data.bankAccountName,
        bank_account_number: wallet.data.bankAccountNumber,
        wallet_id: wallet.data.accountRef,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "BVN verified successfully",
      wallet: wallet.data,
    });

  } catch (error: any) {
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}