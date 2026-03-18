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
  try {
    const body = await request.json();
    const { orderReference, status, transactionReference } = body;

    console.log('Payment callback received:', { orderReference, status });

    // Find the pending payment
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', orderReference);
      return NextResponse.redirect(
        new URL('/pricing?payment=error', baseUrl)
      );
    }

    if (status === 'SUCCESS') {
      // Verify the user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, subscription_tier')
        .eq('id', payment.user_id)
        .single();

      if (userError || !user) {
        console.error('User not found:', payment.user_id);
        return NextResponse.redirect(
          new URL('/pricing?payment=user_not_found', baseUrl)
        );
      }

      // Update payment status
      await supabase
        .from('subscription_payments')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString(),
          transaction_reference: transactionReference,
        })
        .eq('reference', orderReference);

      // Calculate expiration date based on billing period
      const expiresAt = new Date();
      const { planTier, billingPeriod } = payment.metadata;
      
      if (billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // First, deactivate any existing active subscriptions for this user
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', payment.user_id)
        .eq('status', 'active');

      // Create new subscription record
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
        console.error('Failed to create subscription:', subError);
        return NextResponse.redirect(
          new URL('/pricing?payment=error', baseUrl)
        );
      }

      // Update the subscription_payments with the subscription_id
      if (subscription) {
        await supabase
          .from('subscription_payments')
          .update({ subscription_id: subscription.id })
          .eq('reference', orderReference);
      }

      // Update user's subscription tier
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          subscription_tier: planTier,
          subscription_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.user_id);

      if (userUpdateError) {
        console.error('Failed to update user subscription:', userUpdateError);
      }

      console.log('✅ Subscription activated successfully for user:', {
        userId: payment.user_id,
        planTier,
        expiresAt: expiresAt.toISOString()
      });

      // 🎉 REDIRECT TO DASHBOARD ON SUCCESS with plan name
      return NextResponse.redirect(
        new URL(`/dashboard?subscription=success&plan=${planTier}`, baseUrl)
      );
      
    } else {
      // Update payment status to failed
      await supabase
        .from('subscription_payments')
        .update({ 
          status: 'failed',
          metadata: { ...payment.metadata, error: status }
        })
        .eq('reference', orderReference);

      // Redirect to pricing with failure
      return NextResponse.redirect(
        new URL('/pricing?payment=failed', baseUrl)
      );
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(
      new URL('/pricing?payment=error', baseUrl)
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const orderReference = url.searchParams.get('orderReference');
  const planTier = url.searchParams.get('plan');
  
  if (status === 'SUCCESS') {
    // Also redirect to dashboard for GET requests
    return NextResponse.redirect(
      new URL(`/dashboard?subscription=success&plan=${planTier || ''}`, baseUrl)
    );
  }
  return NextResponse.redirect(new URL('/pricing?payment=failed', baseUrl));
}