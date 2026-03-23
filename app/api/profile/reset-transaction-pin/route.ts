// app/api/profile/reset-transaction-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token, userId, newPin } = await req.json();

    if (!token || !userId || !newPin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // Verify token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, pin_reset_token, pin_reset_token_expires, email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid user" },
        { status: 404 }
      );
    }

    if (user.pin_reset_token !== token) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 401 }
      );
    }

    if (new Date(user.pin_reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Hash new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update user with new PIN and reset tracking
    const { error: updateError } = await supabase
      .from("users")
      .update({
        transaction_pin: hashedPin,
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_token: null,
        pin_reset_token_expires: null,
        pin_set: true
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      return NextResponse.json(
        { error: "Failed to reset PIN" },
        { status: 500 }
      );
    }

    // Log the PIN reset event
    await supabase
      .from("security_events")
      .insert({
        user_id: userId,
        event_type: "pin_reset_completed",
        details: { 
          method: "email_reset", 
          timestamp: new Date().toISOString(),
          email: user.email
        }
      });

    return NextResponse.json({
      success: true,
      message: "PIN reset successfully. You can now use your new PIN for transactions."
    });

  } catch (error: any) {
    console.error("PIN reset error:", error);
    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}