// app/auth/confirm/route.js (or route.ts)
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || !type) {
      return NextResponse.redirect(
        new URL('/auth/confirm-error?error=missing_params', req.url)
      );
    }

    // Verify the email
    const { error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token_hash: token_hash,
    });

    if (error) {
      console.error('Verification error:', error);
      return NextResponse.redirect(
        new URL(`/auth/confirm-error?error=${encodeURIComponent(error.message)}`, req.url)
      );
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update user's email_verified status in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user verification status:', updateError);
        // Still redirect to success - the auth user is verified
      }
    }

    // Redirect to your EmailConfirmPage with success parameter
    return NextResponse.redirect(
      new URL('/auth/email-confirm?verified=true', req.url)
    );
  } catch (error: any) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(
      new URL(`/auth/confirm-error?error=${encodeURIComponent(error.message || 'Unknown error')}`, req.url)
    );
  }
}