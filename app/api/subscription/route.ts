import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticatedWithRefresh, createAuthResponse } from '@/lib/auth-check-api';


const SUBSCRIPTION_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    invoices: 5,
    receipts: 5,
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    bookkeeping: false,
    taxCalculator: false,
    financialStatements: false,
    brandedInvoices: false,
    expenseTracking: false,
    vault: false,
    multiUser: false,
    rolePermissions: false,
    approvalSystem: false,
    downloadableReports: false,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: false,
    accountManager: false,
  },
  solopreneur: {
    name: "Solopreneur",
    price: 4900,
    invoices: 10,
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
    bookkeeping: true,
    taxCalculator: false,
    financialStatements: false,
    brandedInvoices: true,
    expenseTracking: true,
    vault: false,
    multiUser: false,
    rolePermissions: false,
    approvalSystem: false,
    downloadableReports: false,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: false,
    accountManager: false,
  },
  sme: {
    name: "SME",
    price: 29900,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 0,
    teamMembers: 1,
    bankAccounts: 3,
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: false,
    rolePermissions: false,
    approvalSystem: false,
    downloadableReports: false,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: false,
    accountManager: false,
  },
  enterprise: {
    name: "Enterprise",
    price: 100000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: 10,
    teamMembers: "unlimited",
    bankAccounts: 5,
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: true,
    accountManager: false,
  },
  corporation: {
    name: "Corporation",
    price: 300000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: "unlimited",
    bankAccounts: "unlimited",
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    payrollSystem: true,
    advancedReporting: true,
    customStructure: true,
    dedicatedSupport: true,
    accountManager: true,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valid tiers for subscription
const VALID_TIERS = ['solopreneur', 'sme', 'enterprise', 'corporation'];
const ALL_TIERS = ['free', ...VALID_TIERS];

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

    // Check if user is on free tier or no subscription
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

    // Check if subscription expired
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

      if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
      }

      const expiresAt = new Date();
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Cancel any existing active subscriptions
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

      if (subError) throw new Error(`Failed to create subscription: ${subError.message}`);

      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (userError) throw new Error(`Failed to update user: ${userError.message}`);

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