import { NextResponse } from 'next/server';
import { getNombaToken } from '@/lib/nomba'; 
import { createClient } from '@supabase/supabase-js';

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
    const { planTier, amount, billingPeriod, userEmail, userId, orderReference } = await request.json();
    
    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found in database:', userId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'User account not found.' 
        },
        { status: 400 }
      );
    }

    // ✅ Validate tier - now accepts zidlite
    const validTiers = ['free', 'zidlite', 'growth', 'premium', 'elite'];
    if (!validTiers.includes(planTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan tier' },
        { status: 400 }
      );
    }

    // Get Nomba access token
    const accessToken = await getNombaToken();

    // Prepare checkout payload
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-callback`,
        customerEmail: userEmail,
        amount: amount.toString(),
        currency: 'NGN',
        orderReference: orderReference,
        customerId: userId,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ['Card'],
        metadata: {
          planTier, 
          billingPeriod,
          userId,
        }
      }, 
      tokenizeCard: false
    };

    // Create checkout with Nomba
    const response = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'accountId': process.env.NOMBA_ACCOUNT_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await response.json();

    if (!response.ok || data.code !== '00') {
      throw new Error(data.description || 'Failed to create checkout');
    }

    // Store the order in database
    await supabase
      .from('subscription_payments')
      .insert({
        user_id: userId,
        amount: amount,
        payment_method: 'nomba',
        status: 'pending',
        reference: orderReference,
        metadata: {
          planTier, // ✅ 'zidlite' stored in metadata
          billingPeriod,
          checkoutLink: data.data.checkoutLink,
        }
      });

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: data.data.orderReference,
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}