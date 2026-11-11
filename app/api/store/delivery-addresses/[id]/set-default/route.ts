// app/api/store/delivery-addresses/[id]/set-default/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data: zone } = await supabase
      .from("store_delivery_addresses")
      .select("id, store_id, online_stores!inner(owner_id)")
      .eq("id", id)
      .single();

    const ownerId = (zone as any)?.online_stores?.owner_id;
    if (!zone || ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await supabase
      .from("store_delivery_addresses")
      .update({ is_default: false })
      .eq("store_id", zone.store_id)
      .neq("id", id);

    await supabase
      .from("store_delivery_addresses")
      .update({ is_default: true })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-default delivery-zone error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}