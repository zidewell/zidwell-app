// app/api/webhooks/bank78/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bank78Client from '@/lib/bank78/client';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-bank78-signature');

    const isValid = await bank78Client.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    await supabase
      .from('bank78_webhooks')
      .insert({
        event_type: payload.event,
        payload: payload,
        processed: false,
        created_at: new Date().toISOString()
      });

    switch (payload.event) {
      case 'transfer.success':
        await handleTransferSuccess(payload);
        break;
      case 'transfer.failed':
        await handleTransferFailed(payload);
        break;
      case 'account.created':
        await handleAccountCreated(payload);
        break;
      case 'account.funded':
        await handleAccountFunded(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${payload.event}`);
    }

    await supabase
      .from('bank78_webhooks')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('payload', payload);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleTransferSuccess(payload) {
  const { data: transaction } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('provider_transaction_id', payload.data.transactionId)
    .eq('provider', 'bank78')
    .select()
    .single();

  if (transaction) {
    await updateUserBalance(transaction.user_id);
  }
}

async function handleTransferFailed(payload) {
  await supabase
    .from('transactions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('provider_transaction_id', payload.data.transactionId)
    .eq('provider', 'bank78');
}

async function handleAccountCreated(payload) {
  const accountData = payload.data;
  
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('bank78_personal_account_number', accountData.accountNumber)
    .single();

  if (user) {
    await supabase
      .from('users')
      .update({
        bank78_verified: true,
        bank78_verified_at: new Date().toISOString()
      })
      .eq('id', user.id);
  }
}

async function handleAccountFunded(payload) {
  const accountData = payload.data;
  
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('bank78_personal_account_number', accountData.accountNumber)
    .single();

  if (user) {
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        provider: 'bank78',
        provider_transaction_id: accountData.transactionId || `FUND-${Date.now()}`,
        provider_account_id: accountData.accountId,
        amount: accountData.amount,
        type: 'credit',
        status: 'completed',
        description: 'Bank78 Account Funding',
        reference: accountData.reference,
        created_at: new Date().toISOString()
      });

    await updateUserBalance(user.id);
  }
}

async function updateUserBalance(userId) {
  const { data: user } = await supabase
    .from('users')
    .select('bank78_personal_account_id, bank78_business_account_id')
    .eq('id', userId)
    .single();

  if (!user) return;

  let totalBalance = 0;

  if (user.bank78_personal_account_id) {
    try {
      const balance = await bank78Client.getBalance(user.bank78_personal_account_id);
      totalBalance += balance.data?.balance || 0;
    } catch (error) {
      console.error('Failed to get personal balance:', error);
    }
  }

  if (user.bank78_business_account_id) {
    try {
      const balance = await bank78Client.getBalance(user.bank78_business_account_id);
      totalBalance += balance.data?.balance || 0;
    } catch (error) {
      console.error('Failed to get business balance:', error);
    }
  }

  await supabase
    .from('users')
    .update({
      wallet_balance: totalBalance,
      wallet_updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}