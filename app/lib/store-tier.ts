// app/lib/store-tier.ts
// Helper for Online Store / Payment Page subscription tier lookup

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ZidstoreTier = 'starter' | 'sme' | 'enterprise' | 'booster';

export async function getSellerTier(ownerId: string): Promise<ZidstoreTier> {
  if (!ownerId) return 'starter';

  const { data, error } = await supabase
    .from('zidstore_subscriptions')
    .select('plan_tier, current_period_end, status')
    .eq('user_id', ownerId)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .order('current_period_end', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 'starter';
  }

  const tier = data[0].plan_tier as ZidstoreTier;
  // Validate tier is one of our known paid tiers
  return ['sme', 'enterprise', 'booster'].includes(tier) ? tier : 'starter';
}
