import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sortAddresses } from "@/lib/delivery-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data, error } = await supabase
      .from("store_delivery_addresses")
      .select(
        "id, store_id, label, street_address, city, state, country, delivery_fee, estimated_days, is_default, is_active",
      )
      .eq("store_id", storeId)
      .eq("is_active", true);

    if (error) {
      console.error("Public delivery-addresses error:", error);
      return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }

    const safe = (data ?? []).map((a: any) => ({
      ...a,
      contact_name: "",
      contact_phone: "",
      notes: null,
    }));

    return NextResponse.json({ addresses: sortAddresses(safe) });
  } catch (err) {
    console.error("Public GET delivery-addresses error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}