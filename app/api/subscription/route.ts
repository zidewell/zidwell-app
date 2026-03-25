// app/api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticatedWithRefresh, createAuthResponse } from '@/lib/auth-check-api';

const SUBSCRIPTION_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    invoices: 5,
    receipts: 5,
    contracts: 1,
    bookkeeping: false,
    taxCalculator: false,
    financialStatements: false,
    taxFiling: false,
    vatFiling: false,
    payeFiling: false,
    cfoGuidance: false,
  },
  zidlite: {
    name: "ZidLite",
    price: 2500,
    invoices: 20,
    receipts: 20,
    contracts: 2,
    bookkeeping: false,
    taxCalculator: false,
    financialStatements: false,
    taxFiling: false,
    vatFiling: false,
    payeFiling: false,
    cfoGuidance: false,
  },
  growth: {
    name: "Growth",
    price: 10000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 5,
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: false,
    taxFiling: false,
    vatFiling: false,
    payeFiling: false,
    cfoGuidance: false,
  },
  premium: {
    name: "Premium",
    price: 25000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 10,
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    taxFiling: true,
    vatFiling: false,
    payeFiling: false,
    cfoGuidance: false,
  },
  elite: {
    name: "Elite",
    price: 50000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    taxFiling: true,
    vatFiling: true,
    payeFiling: true,
    cfoGuidance: true,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: 'Please login to access subscription info', logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!subscription && (!userData.subscription_tier || userData.subscription_tier === 'free')) {
      const responseData = {
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.free,
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    if (subscription && subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      if (subscription.status === 'active') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);

        await supabase
          .from('users')
          .update({ subscription_tier: 'free', subscription_expires_at: null })
          .eq('id', user.id);
      }

      const responseData = {
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.free,
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    const tier = subscription?.tier || userData.subscription_tier || 'free';
    const responseData = {
      success: true,
      subscription: {
        tier,
        status: subscription?.status || 'active',
        expiresAt: subscription?.expires_at || userData.subscription_expires_at || null,
        features: SUBSCRIPTION_FEATURES[tier as keyof typeof SUBSCRIPTION_FEATURES] || SUBSCRIPTION_FEATURES.free,
      },
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: 'Please login to manage subscription', logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const body = await req.json();
    const { action, tier, paymentMethod, amount, paymentReference, isYearly } = body;

    if (action === 'cancel') {
      const { data: subscription, error: findError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      const responseData = { success: true, message: 'Subscription cancelled successfully' };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    if (action === 'subscribe') {
      if (!tier || !paymentMethod || !amount || !paymentReference) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      if (!['zidlite', 'growth', 'premium', 'elite'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
      }

      const expiresAt = new Date();
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (subError) throw new Error(`Failed to create subscription: ${subError.message}`);

      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (userError) throw new Error(`Failed to update user: ${userError.message}`);

      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          amount,
          payment_method: paymentMethod,
          status: 'completed',
          reference: paymentReference,
          metadata: {
            tier,
            isYearly,
            period: isYearly ? 'yearly' : 'monthly',
          },
        });

      if (paymentError) {
        console.error('Failed to record payment:', paymentError);
      }

      const responseData = {
        success: true,
        message: `Successfully subscribed to ${tier} plan`,
        subscription: {
          id: subscription.id,
          tier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to manage subscription' }, { status: 500 });
  }
}