// app/api/profile/update-transaction-pin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPin, newPin } = await req.json();

    if (!userId || !currentPin || !newPin) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Get user's current PIN from database
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('transaction_pin, pin_set, bvn_verification')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if BVN is verified
    if (user.bvn_verification === 'not_submitted' || user.bvn_verification !== 'verified') {
      return NextResponse.json(
        { error: 'BVN verification required to change PIN' },
        { status: 403 }
      );
    }

    // Verify current PIN if it exists
    if (user.transaction_pin) {
      const isValid = await bcrypt.compare(currentPin, user.transaction_pin);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 401 }
        );
      }
    } else if (user.pin_set) {
      // If pin_set is true but no transaction_pin, something's inconsistent
      return NextResponse.json(
        { error: 'PIN configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Hash the new PIN
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(newPin, saltRounds);

    // Update the PIN in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        transaction_pin: hashedPin,
        pin_set: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return NextResponse.json(
        { error: 'Failed to update PIN' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'PIN updated successfully' 
    });

  } catch (error) {
    console.error('PIN update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}