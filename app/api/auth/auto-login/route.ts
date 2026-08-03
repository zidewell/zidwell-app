import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuthToken } from '@/lib/auth-token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const { userId, email, plan } = payload;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const response = NextResponse.redirect(
      new URL(`/dashboard?subscription=success&plan=${plan || ''}`, req.url)
    );

    response.cookies.set('payment_processed', 'true', {
      path: '/',
      maxAge: 60,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}
