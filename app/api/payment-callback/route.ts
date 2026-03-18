import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

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

    console.log('🔵 Processing callback with orderReference:', orderReference);

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

    if (paymentError) {
      console.error("🔴 Payment lookup error:", paymentError);
    }
    
    if (!payment) {
      console.error("🔴 Payment not found for reference:", orderReference);
      return NextResponse.redirect(
        new URL('/pricing?payment=error&reason=not_found', baseUrl)
      );
    }

    console.log("🔵 Found payment:", {
      id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
      status: payment.status,
      metadata: payment.metadata
    });

    // Check if payment was already processed
    if (payment.status === 'completed') {
      console.log("🟡 Payment already completed, redirecting to dashboard");
      const { planTier } = payment.metadata || {};
      return NextResponse.redirect(
        new URL(`/dashboard?subscription=success&plan=${planTier || ''}`, baseUrl)
      );
    }

    // SINCE NOMBA REDIRECTS WITHOUT STATUS, WE ASSUME SUCCESS
    console.log("✅ Assuming payment successful - processing subscription...");

    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, subscription_tier, email')
      .eq('id', payment.user_id)
      .single();

    if (userError || !user) {
      console.error('🔴 User not found:', payment.user_id);
      return NextResponse.redirect(
        new URL('/pricing?payment=user_not_found', baseUrl)
      );
    }

    // Update payment status to completed
    const { error: updateError } = await supabase
      .from('subscription_payments')
      .update({ 
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('reference', orderReference);

    if (updateError) {
      console.error("🔴 Failed to update payment:", updateError);
    }

    // Get plan details from metadata
    const { planTier, billingPeriod } = payment.metadata;
    
    console.log('🔵 Processing subscription for tier:', planTier);

    // Calculate expiration date
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
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_tier: planTier,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.user_id);

    if (userUpdateError) {
      console.error('🔴 Failed to update user:', userUpdateError);
    }

    console.log('✅✅✅ SUBSCRIPTION ACTIVATED:', { 
      userId: payment.user_id, 
      tier: planTier,
      expiresAt: expiresAt.toISOString() 
    });

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL(`/dashboard?subscription=success&plan=${planTier}`, baseUrl)
    );
    
  } catch (error) {
    console.error('🔥🔥🔥 PAYMENT CALLBACK ERROR:', error);
    return NextResponse.redirect(
      new URL('/pricing?payment=error&reason=exception', baseUrl)
    );
  }
}