// app/api/user/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get user's usage counts
    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        invoices_used_this_month,
        receipts_used_this_month,
        contracts_used_this_month,
        subscription_tier
      `)
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    // Get feature limits from subscription_features
    const { data: features } = await supabase
      .from("subscription_features")
      .select("feature_key, feature_limit")
      .eq("tier", userData.subscription_tier || 'free');

    const limits = {
      invoices: features?.find(f => f.feature_key === 'invoices_per_month')?.feature_limit || 5,
      receipts: features?.find(f => f.feature_key === 'receipts_per_month')?.feature_limit || 5,
      contracts: features?.find(f => f.feature_key === 'contracts_per_month')?.feature_limit || 1,
    };

    // Check for active bookkeeping trial
    const { data: activeTrial } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .eq("feature_key", "bookkeeping_access")
      .eq("status", "active")
      .maybeSingle();

    let bookkeepingTrial = null;
    if (activeTrial) {
      const endsAt = new Date(activeTrial.ends_at);
      if (endsAt > new Date()) {
        bookkeepingTrial = {
          isActive: true,
          endsAt: endsAt,
          daysRemaining: Math.ceil((endsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        };
      }
    }

    return NextResponse.json({
      invoices: {
        used: userData.invoices_used_this_month || 0,
        limit: limits.invoices,
        remaining: limits.invoices - (userData.invoices_used_this_month || 0)
      },
      receipts: {
        used: userData.receipts_used_this_month || 0,
        limit: limits.receipts,
        remaining: limits.receipts - (userData.receipts_used_this_month || 0)
      },
      contracts: {
        used: userData.contracts_used_this_month || 0,
        limit: limits.contracts,
        remaining: limits.contracts - (userData.contracts_used_this_month || 0)
      },
      bookkeepingTrial: bookkeepingTrial,
      tier: userData.subscription_tier
    });

  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}