import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 🔐 Add admin authentication here
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, tier, duration } = await req.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ['free', 'growth', 'premium', 'elite'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be free, growth, premium, or elite" },
        { status: 400 }
      );
    }

    // Calculate expiration date
    let expiresAt = null;
    if (tier !== 'free') {
      expiresAt = new Date();
      if (duration === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Default to 1 year
      }
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Optional: Create subscription record
    if (tier !== 'free') {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: tier,
          status: 'active',
          expires_at: expiresAt?.toISOString(),
          auto_renew: true,
          payment_method: 'admin_override'
        });
    }

    return NextResponse.json({
      success: true,
      message: `User updated to ${tier} tier`,
      user: data
    });

  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}