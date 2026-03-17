// app/api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '@/lib/auth-check-api';
import { SUBSCRIPTION_FEATURES } from '@/lib/subscription-features';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Please login to access subscription info' },
      { status: 401 }
    );
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
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (!subscription && (!userData.subscription_tier || userData.subscription_tier === 'free')) {
      return NextResponse.json({
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.free,
        },
      });
    }

    if (subscription && subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      if (subscription.status === 'active') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);

        await supabase
          .from('users')
          .update({ 
            subscription_tier: 'free',
            subscription_expires_at: null 
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.free,
        },
      });
    }

    const tier = subscription?.tier || userData.subscription_tier || 'free';
    
    return NextResponse.json({
      success: true,
      subscription: {
        tier,
        status: subscription?.status || 'active',
        expiresAt: subscription?.expires_at || userData.subscription_expires_at || null,
        features: SUBSCRIPTION_FEATURES[tier as keyof typeof SUBSCRIPTION_FEATURES] || SUBSCRIPTION_FEATURES.free,
      },
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Please login to manage subscription' },
      { status: 401 }
    );
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
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
        })
        .eq('id', subscription.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    }

    if (action === 'subscribe') {
      if (!tier || !paymentMethod || !amount || !paymentReference) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (!['zidlite', 'growth', 'premium', 'elite'].includes(tier)) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
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

      if (subError) {
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }

      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (userError) {
        throw new Error(`Failed to update user: ${userError.message}`);
      }

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

      return NextResponse.json({
        success: true,
        message: `Successfully subscribed to ${tier} plan`,
        subscription: {
          id: subscription.id,
          tier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}