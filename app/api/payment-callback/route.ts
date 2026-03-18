import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

// Use service role for database operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  return handleCallback(request);
}

async function handleCallback(request: Request) {
  console.log("🔵 ===== PAYMENT CALLBACK RECEIVED =====");
  console.log("🔵 Method:", request.method);
  console.log("🔵 URL:", request.url);
  
  try {
    let orderReference;
    const url = new URL(request.url);
    
    // Extract from query string
    orderReference = url.searchParams.get('orderReference') || url.searchParams.get('order_ref');
    
    console.log("🔵 GET params:", {
      orderReference,
      allParams: Object.fromEntries(url.searchParams)
    });

    if (!orderReference) {
      console.error('🔴 No order reference found');
      return NextResponse.redirect(
        new URL('/pricing?payment=error&reason=no_reference', baseUrl)
      );
    }

    // Find the pending payment
    console.log("🔵 Looking up payment with reference:", orderReference);
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .single();

    if (paymentError || !payment) {
      console.error("🔴 Payment not found:", orderReference);
      return NextResponse.redirect(
        new URL('/pricing?payment=error&reason=not_found', baseUrl)
      );
    }

    console.log("🔵 Found payment:", {
      id: payment.id,
      user_id: payment.user_id,
      status: payment.status,
      metadata: payment.metadata
    });

    // Check if payment was already processed
    if (payment.status === 'completed') {
      console.log("🟡 Payment already completed, redirecting to dashboard");
      const { planTier } = payment.metadata || {};
      
      // Get user email for session
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', payment.user_id)
        .single();

      if (userData?.email) {
        return NextResponse.redirect(
          new URL(`/api/auth/auto-login?userId=${payment.user_id}&email=${encodeURIComponent(userData.email)}&plan=${planTier || ''}`, baseUrl)
        );
      }
      
      return NextResponse.redirect(
        new URL(`/dashboard?subscription=success&plan=${planTier || ''}`, baseUrl)
      );
    }

    // Process the subscription
    console.log("✅ Processing successful payment...");

    // Update payment status
    await supabase
      .from('subscription_payments')
      .update({ 
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('reference', orderReference);

    // Get plan details
    const { planTier, billingPeriod } = payment.metadata;
    
    console.log('🔵 Processing subscription for tier:', planTier);

    // Calculate expiration
    const expiresAt = new Date();
    if (billingPeriod === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Deactivate existing subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', payment.user_id)
      .eq('status', 'active');

    // Create new subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: payment.user_id,
        tier: planTier,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        auto_renew: false,
        payment_method: 'nomba',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('🔴 Failed to create subscription:', subError);
      return NextResponse.redirect(
        new URL('/pricing?payment=error&reason=subscription_failed', baseUrl)
      );
    }

    // Link payment to subscription
    await supabase
      .from('subscription_payments')
      .update({ subscription_id: subscription.id })
      .eq('reference', orderReference);

    // Update user
    await supabase
      .from('users')
      .update({
        subscription_tier: planTier,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.user_id);

    console.log('✅✅✅ SUBSCRIPTION ACTIVATED:', { 
      userId: payment.user_id, 
      tier: planTier
    });

    // Get user email for auto-login
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', payment.user_id)
      .single();

    if (!userData?.email) {
      console.error('🔴 Could not find user email');
      return NextResponse.redirect(
        new URL('/auth/login?reason=user_not_found', baseUrl)
      );
    }

    // Redirect to auto-login endpoint to set session cookies
    console.log('✅ Redirecting to auto-login');
    return NextResponse.redirect(
      new URL(`/api/auth/auto-login?userId=${payment.user_id}&email=${encodeURIComponent(userData.email)}&plan=${planTier}`, baseUrl)
    );
    
  } catch (error) {
    console.error('🔥🔥🔥 PAYMENT CALLBACK ERROR:', error);
    return NextResponse.redirect(
      new URL('/pricing?payment=error&reason=exception', baseUrl)
    );
  }
}