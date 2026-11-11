// app/api/store/pickup-locations/[id]/set-default/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data: loc } = await supabase
      .from("store_pickup_locations")
      .select("id, store_id, online_stores!inner(owner_id)")
      .eq("id", id)
      .single();

    const ownerId = (loc as any)?.online_stores?.owner_id;
    if (!loc || ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await supabase
      .from("store_pickup_locations")
      .update({ is_default: false })
      .eq("store_id", loc.store_id)
      .neq("id", id);

    await supabase
      .from("store_pickup_locations")
      .update({ is_default: true })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-default pickup-location error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}