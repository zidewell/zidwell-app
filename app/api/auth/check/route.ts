import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("sb-access-token")?.value;
    
    if (!token) {
      console.log('🔴 No access token found');
      return NextResponse.json({ authenticated: false });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('🔴 Invalid token:', error?.message);
      return NextResponse.json({ authenticated: false });
    }

    console.log('✅ Valid session for:', user.email);
    return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email } });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}