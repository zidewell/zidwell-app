// app/api/store/pickup-locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sortPickupLocations } from "@/lib/delivery-utils";

const MAX_LOCATIONS = 10;

export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data: store } = await supabase
      .from("online_stores")
      .select("id, owner_id")
      .eq("id", storeId)
      .single();

    if (!store || store.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("store_pickup_locations")
      .select("*")
      .eq("store_id", storeId);

    if (error) {
      console.error("List pickup locations error:", error);
      return NextResponse.json(
        { error: "Failed to load pickup locations" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      locations: sortPickupLocations(data ?? []),
    });
  } catch (err: any) {
    console.error("GET pickup-locations error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      store_id,
      label,
      address,
      notes = null,
      phone = null,
      is_default = false,
      is_active = true,
    } = body;

    if (!store_id || !label?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Label and address are required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin() as any;

    const { data: store } = await supabase
      .from("online_stores")
      .select("id, owner_id")
      .eq("id", store_id)
      .single();

    if (!store || store.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { count } = await supabase
      .from("store_pickup_locations")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store_id);

    if ((count ?? 0) >= MAX_LOCATIONS) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_LOCATIONS} pickup locations` },
        { status: 400 },
      );
    }

    if (is_default) {
      await supabase
        .from("store_pickup_locations")
        .update({ is_default: false })
        .eq("store_id", store_id);
    }

    const { data, error } = await supabase
      .from("store_pickup_locations")
      .insert({
        store_id,
        label: label.trim(),
        address: address.trim(),
        notes: notes?.trim() || null,
        phone: phone?.trim() || null,
        is_default,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Create pickup location error:", error);
      return NextResponse.json(
        { error: "Failed to create location" },
        { status: 500 },
      );
    }

    return NextResponse.json({ location: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST pickup-locations error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}