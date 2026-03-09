import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, featureKey, durationDays } = await req.json();

    if (!userId || !featureKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate trial dates
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + (durationDays || 14));

    // Check if trial already exists
    const { data: existingTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", userId)
      .eq("feature_key", featureKey)
      .eq("status", "active")
      .maybeSingle();

    if (existingTrial) {
      return NextResponse.json(
        { message: "Trial already exists", trial: existingTrial },
        { status: 200 }
      );
    }

    // Create trial record
    const { data: trial, error } = await supabase
      .from("user_trials")
      .insert({
        user_id: userId,
        feature_key: featureKey,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating trial:", error);
      return NextResponse.json(
        { error: "Failed to create trial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trial activated successfully",
      trial,
      endsAt,
    });
  } catch (error: any) {
    console.error("Trial activation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}