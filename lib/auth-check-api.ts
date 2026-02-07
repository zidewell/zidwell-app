// lib/auth-check-api.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function isAuthenticated(req: NextRequest) {
  try {

    const token = req.cookies.get("sb-access-token")?.value;
    
    if (!token) {
      return null;
    }
    
 
    const { data: { user } } = await supabase.auth.getUser(token);

 
    
    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}