import { NextResponse } from 'next/server';
import { getNombaToken } from '@/lib/nomba'; 
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { planTier, amount, billingPeriod, userEmail, userId, orderReference } = await request.json();
    
    // Get Nomba access token
    const accessToken = await getNombaToken();

    // Prepare checkout payload
    const checkoutPayload = {
      order: {
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-callback`,
        customerEmail: userEmail,
        amount: amount.toString(),
        currency: 'NGN',
        orderReference: orderReference,
        customerId: userId,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ['Card', 'Transfer'],
        metadata: {
          planTier,
          billingPeriod,
          userId,
        }
      }, 
      tokenizeCard: true
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
          planTier,
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