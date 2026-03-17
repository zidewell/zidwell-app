// app/api/user/trial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define trial features and their durations
const TRIAL_FEATURES = {
  bookkeeping_access: { duration: 14, name: 'Bookkeeping' },
  tax_calculator_access: { duration: 14, name: 'Tax Calculator' },
  // Add more trial features here
};

export async function POST(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { featureKey, durationDays } = await req.json();

    if (!featureKey) {
      return NextResponse.json(
        { error: "Missing feature key" },
        { status: 400 }
      );
    }

    // Check if feature exists in trial features
    if (!TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES]) {
      return NextResponse.json(
        { error: "Invalid trial feature" },
        { status: 400 }
      );
    }

    // Check if user is already on a paid tier that includes this feature
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = userData?.subscription_tier || 'free';
    
    // If user is on Growth or higher, they already have access
    if (tier === 'growth' || tier === 'premium' || tier === 'elite') {
      return NextResponse.json(
        { 
          message: "Your current plan already includes this feature", 
          tier,
          hasAccess: true 
        },
        { status: 200 }
      );
    }

    // Calculate trial dates
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + (durationDays || TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].duration || 14));

    // Check if trial already exists
    const { data: existingTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (existingTrial) {
      if (existingTrial.status === 'active') {
        const endsAtDate = new Date(existingTrial.ends_at);
        if (endsAtDate > new Date()) {
          const daysRemaining = Math.ceil((endsAtDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return NextResponse.json(
            { 
              message: "You already have an active trial", 
              trial: existingTrial,
              daysRemaining,
              isActive: true 
            },
            { status: 200 }
          );
        } else {
          // Trial expired, update status
          await supabase
            .from("user_trials")
            .update({ status: 'expired' })
            .eq('id', existingTrial.id);
        }
      }

      if (existingTrial.status === 'expired') {
        return NextResponse.json(
          { 
            message: "Your trial has already expired", 
            expired: true 
          },
          { status: 400 }
        );
      }
    }

    // Create trial record
    const { data: trial, error } = await supabase
      .from("user_trials")
      .insert({
        user_id: user.id,
        feature_key: featureKey,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "active",
        metadata: {
          activated_from_tier: tier,
          duration_days: durationDays || TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].duration
        }
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
      message: `${TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].name} trial activated successfully`,
      trial,
      endsAt,
      daysRemaining: durationDays || TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].duration,
      featureName: TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].name
    });

  } catch (error: any) {
    console.error("Trial activation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const featureKey = searchParams.get('feature');

    let query = supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id);

    if (featureKey) {
      query = query.eq("feature_key", featureKey);
    }

    const { data: trials, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Process trials to add remaining days
    const processedTrials = trials.map(trial => {
      if (trial.status === 'active') {
        const endsAt = new Date(trial.ends_at);
        const now = new Date();
        if (endsAt > now) {
          return {
            ...trial,
            daysRemaining: Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            isActive: true
          };
        } else {
          // Auto-expire if past date
          supabase
            .from("user_trials")
            .update({ status: 'expired' })
            .eq('id', trial.id)
            .then();
          return {
            ...trial,
            status: 'expired',
            isActive: false
          };
        }
      }
      return {
        ...trial,
        isActive: false
      };
    });

    return NextResponse.json({
      success: true,
      trials: processedTrials,
      hasActiveTrials: processedTrials.some(t => t.status === 'active')
    });

  } catch (error: any) {
    console.error("Error fetching trials:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await isAuthenticated(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const trialId = searchParams.get('id');

    if (!trialId) {
      return NextResponse.json(
        { error: "Missing trial ID" },
        { status: 400 }
      );
    }

    // Verify trial belongs to user
    const { data: trial } = await supabase
      .from("user_trials")
      .select("user_id")
      .eq("id", trialId)
      .single();

    if (!trial || trial.user_id !== user.id) {
      return NextResponse.json(
        { error: "Trial not found" },
        { status: 404 }
      );
    }

    // Soft delete by updating status
    const { error } = await supabase
      .from("user_trials")
      .update({ 
        status: 'cancelled',
        metadata: {
          cancelled_at: new Date().toISOString()
        }
      })
      .eq("id", trialId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Trial cancelled successfully"
    });

  } catch (error: any) {
    console.error("Error cancelling trial:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}