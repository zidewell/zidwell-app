// app/api/user/login-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-check-api";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseAdmin();
    
    const { data: history, error, count } = await supabase
      .from('login_history')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user!.id)
      .order('login_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { data: activeSessions } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', auth.user!.id)
      .is('logout_time', null)
      .eq('is_successful', true)
      .order('login_time', { ascending: false });

    return NextResponse.json({
      history: history || [],
      total: count || 0,
      activeSessions: activeSessions || [],
      currentSession: activeSessions?.[0] || null,
    });

  } catch (error) {
    console.error("Login history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch login history" },
      { status: 500 }
    );
  }
}