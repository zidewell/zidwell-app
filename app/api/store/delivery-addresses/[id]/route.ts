// app/api/store/delivery-addresses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function assertOwnership(userId: string, zoneId: string) {
  const supabase = getSupabaseAdmin() as any;
  const { data } = await supabase
    .from("store_delivery_addresses")
    .select("id, store_id, online_stores!inner(owner_id)")
    .eq("id", zoneId)
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
      "address",
      "city",
      "state",
      "fee",
      "free_threshold",
      "notes",
      "is_default",
      "is_active",
    ] as const;

    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) {
        if (key === "fee" || key === "free_threshold") {
          patch[key] = Number(body[key]) || 0;
        } else if (typeof body[key] === "string") {
          patch[key] = body[key].trim() || null;
        } else {
          patch[key] = body[key];
        }
      }
    }

    if (patch.label === null || patch.address === null) {
      return NextResponse.json(
        { error: "Label and address cannot be empty" },
        { status: 400 },
      );
    }

    patch.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin() as any;

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
      console.error("Update delivery zone error:", error);
      return NextResponse.json(
        { error: "Failed to update delivery zone" },
        { status: 500 },
      );
    }

    return NextResponse.json({ zone: data });
  } catch (err: any) {
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

    const supabase = getSupabaseAdmin() as any;

    const { error } = await supabase
      .from("store_delivery_addresses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete delivery zone error:", error);
      return NextResponse.json(
        { error: "Failed to delete delivery zone" },
        { status: 500 },
      );
    }

    // Promote next active zone to default
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
  } catch (err: any) {
    console.error("DELETE delivery-address error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}