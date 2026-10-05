import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sortAddresses } from "@/lib/delivery-utils";

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

    const supabase = getSupabaseAdmin();

    const { data: store, error: storeErr } = await supabase
      .from("online_stores")
      .select("id, owner_id")
      .eq("id", storeId)
      .single();

    if (storeErr || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (store.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("store_delivery_addresses")
      .select("*")
      .eq("store_id", storeId);

    if (error) {
      console.error("List delivery addresses error:", error);
      return NextResponse.json(
        { error: "Failed to load addresses" },
        { status: 500 },
      );
    }

    return NextResponse.json({ addresses: sortAddresses(data ?? []) });
  } catch (err: any) {
    console.error("GET delivery-addresses error:", err);
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
      contact_name,
      contact_phone,
      street_address,
      city,
      state,
      country = "Nigeria",
      delivery_fee = 0,
      estimated_days = 3,
      is_default = false,
      is_active = true,
      notes = null,
    } = body;

    if (
      !store_id ||
      !label ||
      !contact_name ||
      !contact_phone ||
      !street_address ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: store } = await supabase
      .from("online_stores")
      .select("id, owner_id")
      .eq("id", store_id)
      .single();

    if (!store || store.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (is_default) {
      await supabase
        .from("store_delivery_addresses")
        .update({ is_default: false })
        .eq("store_id", store_id);
    }

    const { data, error } = await supabase
      .from("store_delivery_addresses")
      .insert({
        store_id,
        label,
        contact_name,
        contact_phone,
        street_address,
        city,
        state,
        country,
        delivery_fee,
        estimated_days,
        is_default,
        is_active,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Create delivery address error:", error);
      return NextResponse.json(
        { error: "Failed to create address" },
        { status: 500 },
      );
    }

    return NextResponse.json({ address: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST delivery-addresses error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}