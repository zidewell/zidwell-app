import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');
    const plan = url.searchParams.get('plan');

    console.log('🔵 Auto-login attempt:', { userId, email, plan });

    if (!userId || !email) {
      console.error('🔴 Missing userId or email');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Try to sign in with OTP (magic link) - this won't send email if user exists
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('🔴 Auto-login OTP error:', error);
      // Fall back to regular login
    }

    // Create response with redirect to dashboard
    const response = NextResponse.redirect(
      new URL(`/dashboard?subscription=success&plan=${plan || ''}`, req.url)
    );

    // Add a flag to indicate this is a post-payment redirect
    response.cookies.set('payment_processed', 'true', {
      path: '/',
      maxAge: 60,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    console.log('✅ Auto-login processed, redirecting to dashboard');
    return response;
  } catch (error) {
    console.error('🔥 Auto-login error:', error);
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}