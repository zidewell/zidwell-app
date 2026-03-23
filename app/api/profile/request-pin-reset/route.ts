// app/api/profile/request-pin-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";
import { sendPinResetEmail } from "@/lib/email/pin-reset";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { userId } = await req.json();
    
    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user has BVN verification (if required)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, bvn_verification, pin_set, first_name, last_name")
      .eq("id", userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check BVN requirement if your app requires it
    if (userData.bvn_verification === 'not_submitted') {
      return NextResponse.json(
        { error: "BVN verification required before setting PIN" },
        { status: 400 }
      );
    }
    
    // Generate reset token
    const resetToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    
    const { error: updateError } = await supabase
      .from("users")
      .update({
        pin_reset_token: resetToken,
        pin_reset_token_expires: tokenExpiry
      })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error updating reset token:", updateError);
      return NextResponse.json(
        { error: "Failed to generate reset token" },
        { status: 500 }
      );
    }
    
    // Get user's full name for email personalization
    const userName = userData.first_name && userData.last_name 
      ? `${userData.first_name} ${userData.last_name}`
      : undefined;
    
    // Send reset email using your existing transporter
    const emailSent = await sendPinResetEmail(
      userData.email, 
      resetToken, 
      userId,
      userName
    );
    
    if (!emailSent) {
      console.error("Failed to send PIN reset email");
      // Still return success to avoid exposing email issues to user
    }
    
    // Log the request
    await supabase
      .from("security_events")
      .insert({
        user_id: userId,
        event_type: "pin_reset_requested",
        details: {
          method: "email",
          timestamp: new Date().toISOString(),
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
        }
      });
    
    return NextResponse.json({
      success: true,
      message: "Reset link sent to your email"
    });
    
  } catch (error: any) {
    console.error("PIN reset request error:", error);
    return NextResponse.json(
      { error: "Failed to send reset link: " + error.message },
      { status: 500 }
    );
  }
}