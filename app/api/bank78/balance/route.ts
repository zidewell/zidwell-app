// app/api/bank78/balance/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bank78AccountService from '@/lib/bank78/bank78AccountService';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const balance = await bank78AccountService.getAccountBalance(userId);

    if (!balance) {
      return NextResponse.json(
        { error: 'Bank78 account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: balance
    });

  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}