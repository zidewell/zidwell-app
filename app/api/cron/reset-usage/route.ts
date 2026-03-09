// app/api/cron/reset-usage/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function GET(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔄 Starting monthly usage reset for free tier users...");

    // Reset usage for all free tier users
    const { data, error } = await supabase
      .from("users")
      .update({
        invoices_used_this_month: 0,
        receipts_used_this_month: 0,
        contracts_used_this_month: 0,
        last_usage_reset: new Date().toISOString(),
      })
      .eq("subscription_tier", "free")
      .select("id, email");

    if (error) {
      console.error("Error resetting usage:", error);
      throw error;
    }

    console.log(`✅ Successfully reset usage for ${data?.length || 0} free tier users`);

    // Also expire any trials that have ended
    const { data: expiredTrials, error: trialError } = await supabase
      .from("user_trials")
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq("status", 'active')
      .lt("ends_at", new Date().toISOString())
      .select("id, user_id, feature_key");

    if (trialError) {
      console.error("Error expiring trials:", trialError);
    } else {
      console.log(`✅ Expired ${expiredTrials?.length || 0} trials`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Monthly usage reset successfully',
      usersReset: data?.length || 0,
      trialsExpired: expiredTrials?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Error in cron job:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for more flexibility
export async function POST(req: Request) {
  return GET(req);
}