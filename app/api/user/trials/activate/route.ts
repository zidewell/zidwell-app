// app/api/user/trial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRIAL_FEATURES = {
  bookkeeping_access: { duration: 14, name: 'Bookkeeping' },
  tax_calculator_access: { duration: 14, name: 'Tax Calculator' },
};

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json(
      { error: "Unauthorized", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { featureKey, durationDays } = await req.json();

    if (!featureKey) {
      return NextResponse.json({ error: "Missing feature key" }, { status: 400 });
    }

    if (!TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES]) {
      return NextResponse.json({ error: "Invalid trial feature" }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = userData?.subscription_tier || 'free';
    
    if (tier === 'growth' || tier === 'premium' || tier === 'elite') {
      const response = NextResponse.json({ 
        message: "Your current plan already includes this feature", 
        tier,
        hasAccess: true 
      });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + (durationDays || TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].duration || 14));

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
          const response = NextResponse.json({ 
            message: "You already have an active trial", 
            trial: existingTrial,
            daysRemaining,
            isActive: true 
          });
          if (newTokens) return createAuthResponse(await response.json(), newTokens);
          return response;
        } else {
          await supabase.from("user_trials").update({ status: 'expired' }).eq('id', existingTrial.id);
        }
      }

      if (existingTrial.status === 'expired') {
        return NextResponse.json({ message: "Your trial has already expired", expired: true }, { status: 400 });
      }
    }

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

    if (error) throw error;

    const responseData = {
      success: true,
      message: `${TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].name} trial activated successfully`,
      trial,
      endsAt,
      daysRemaining: durationDays || TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].duration,
      featureName: TRIAL_FEATURES[featureKey as keyof typeof TRIAL_FEATURES].name
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Trial activation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: "Unauthorized", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const featureKey = searchParams.get('feature');

    let query = supabase.from("user_trials").select("*").eq("user_id", user.id);
    if (featureKey) query = query.eq("feature_key", featureKey);

    const { data: trials, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const processedTrials = trials.map(trial => {
      if (trial.status === 'active') {
        const endsAt = new Date(trial.ends_at);
        const now = new Date();
        if (endsAt > now) {
          return { ...trial, daysRemaining: Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), isActive: true };
        } else {
          supabase.from("user_trials").update({ status: 'expired' }).eq('id', trial.id).then();
          return { ...trial, status: 'expired', isActive: false };
        }
      }
      return { ...trial, isActive: false };
    });

    const responseData = { success: true, trials: processedTrials, hasActiveTrials: processedTrials.some(t => t.status === 'active') };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching trials:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: "Unauthorized", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const trialId = searchParams.get('id');

    if (!trialId) {
      return NextResponse.json({ error: "Missing trial ID" }, { status: 400 });
    }

    const { data: trial } = await supabase.from("user_trials").select("user_id").eq("id", trialId).single();
    if (!trial || trial.user_id !== user.id) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }

    await supabase.from("user_trials").update({ status: 'cancelled', metadata: { cancelled_at: new Date().toISOString() } }).eq("id", trialId);

    const responseData = { success: true, message: "Trial cancelled successfully" };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error cancelling trial:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}