import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '@/lib/auth-check-api';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define subscription features
const SUBSCRIPTION_FEATURES = {
  free: {
    invoices_per_month: { value: '5', limit: 5 },
    receipts_per_month: { value: '5', limit: 5 },
    contracts_per_month: { value: '1', limit: 1 },
    bookkeeping_trial_days: { value: '14', limit: 14 },
    transfer_fee: { value: '50', limit: null },
    support_type: { value: 'email', limit: null },
  },
  growth: {
    invoices_per_month: { value: 'unlimited', limit: null },
    receipts_per_month: { value: 'unlimited', limit: null },
    contracts_per_month: { value: '5', limit: 5 },
    bookkeeping_access: { value: 'true', limit: null },
    tax_calculator: { value: 'true', limit: null },
    payment_reminders: { value: 'true', limit: null },
    whatsapp_community: { value: 'true', limit: null },
    support_type: { value: 'whatsapp', limit: null },
    transfer_fee: { value: '50', limit: null },
  },
  premium: {
    invoices_per_month: { value: 'unlimited', limit: null },
    receipts_per_month: { value: 'unlimited', limit: null },
    contracts_per_month: { value: 'unlimited', limit: null },
    bookkeeping_access: { value: 'true', limit: null },
    tax_calculator: { value: 'true', limit: null },
    payment_reminders: { value: 'true', limit: null },
    whatsapp_community: { value: 'true', limit: null },
    financial_statements: { value: 'true', limit: null },
    tax_support: { value: 'true', limit: null },
    priority_support: { value: 'true', limit: null },
    transfer_fee: { value: '25', limit: null },
  },
  elite: {
    invoices_per_month: { value: 'unlimited', limit: null },
    receipts_per_month: { value: 'unlimited', limit: null },
    contracts_per_month: { value: 'unlimited', limit: null },
    bookkeeping_access: { value: 'true', limit: null },
    tax_calculator: { value: 'true', limit: null },
    payment_reminders: { value: 'true', limit: null },
    whatsapp_community: { value: 'true', limit: null },
    financial_statements: { value: 'true', limit: null },
    tax_support: { value: 'true', limit: null },
    priority_support: { value: 'true', limit: null },
    full_tax_filing: { value: 'true', limit: null },
    vat_filing: { value: 'true', limit: null },
    paye_filing: { value: 'true', limit: null },
    wht_filing: { value: 'true', limit: null },
    cit_audit: { value: 'true', limit: null },
    monthly_tax_filing: { value: 'true', limit: null },
    yearly_tax_filing: { value: 'true', limit: null },
    cfo_guidance: { value: 'true', limit: null },
    direct_whatsapp_support: { value: 'true', limit: null },
    audit_coordination: { value: 'true', limit: null },
    transfer_fee: { value: '0', limit: null },
  },
};

export async function GET(req: NextRequest) {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Please login to access subscription info' },
      { status: 401 }
    );
  }

  try {
    // Get user's subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get user data for subscription_tier
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

    // If no subscription found, return free tier
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

    // If subscription exists but is expired, update status
    if (subscription && subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      if (subscription.status === 'active') {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);

        // Update user to free tier
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

    // Return active subscription
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

    // Handle subscription cancellation
    if (action === 'cancel') {
      // Find active subscription
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

      // Update subscription to cancelled
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

      // Note: User keeps access until expiry date, so we don't downgrade yet

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    }

    // Handle new subscription
    if (action === 'subscribe') {
      if (!tier || !paymentMethod || !amount || !paymentReference) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate tier
      if (!['growth', 'premium', 'elite'].includes(tier)) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
      }

      // Calculate expiration date
      const expiresAt = new Date();
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Deactivate any existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Create new subscription
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

      // Update user's subscription tier
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

      // Record payment
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
        // Don't throw - subscription is already created
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