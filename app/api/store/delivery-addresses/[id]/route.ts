import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function assertOwnership(userId: string, addressId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("store_delivery_addresses")
    .select("id, store_id, online_stores!inner(owner_id)")
    .eq("id", addressId)
    .single();

  const ownerId = (data as any)?.online_stores?.owner_id;
  if (!data || ownerId !== userId) return null;
  return data as { id: string; store_id: string };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const owned = await assertOwnership(user.id, id);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowed = [
      "label",
      "contact_name",
      "contact_phone",
      "street_address",
      "city",
      "state",
      "country",
      "delivery_fee",
      "estimated_days",
      "is_default",
      "is_active",
      "notes",
    ] as const;

    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }
    patch.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();

    if (patch.is_default === true) {
      await supabase
        .from("store_delivery_addresses")
        .update({ is_default: false })
        .eq("store_id", owned.store_id)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("store_delivery_addresses")
      .update(patch as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update delivery address error:", error);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 },
      );
    }

    return NextResponse.json({ address: data });
  } catch (err) {
    console.error("PATCH delivery-address error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const owned = await assertOwnership(user.id, id);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("store_delivery_addresses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete delivery address error:", error);
      return NextResponse.json(
        { error: "Failed to delete" },
        { status: 500 },
      );
    }

    const { data: remaining } = await supabase
      .from("store_delivery_addresses")
      .select("id")
      .eq("store_id", owned.store_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1);

    if (remaining?.[0]) {
      await supabase
        .from("store_delivery_addresses")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE delivery-address error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}