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
    const { data: payment } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .single();

    if (!payment) {
      console.error('Payment not found:', orderReference);
      return NextResponse.redirect(
        new URL('/pricing?payment=error', baseUrl)
      );
    }

    if (status === 'SUCCESS') {
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

      // Update user's subscription
      await supabase
        .from('users')
        .update({
          subscription_tier: planTier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', payment.user_id);

      // Create subscription record
      await supabase
        .from('subscriptions')
        .insert({
          user_id: payment.user_id,
          tier: planTier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          auto_renew: false, // 👈 Set to false - no auto-renewal
          payment_method: 'nomba',
        });

      return NextResponse.redirect(
        new URL('/pricing?payment=success', baseUrl)
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
  
  if (status === 'SUCCESS') {
    return NextResponse.redirect(
      new URL(`/pricing?payment=success&order=${orderReference}`, baseUrl)
    );
  }
  return NextResponse.redirect(new URL('/pricing?payment=failed', baseUrl));
}