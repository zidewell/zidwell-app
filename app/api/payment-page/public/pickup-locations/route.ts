// app/api/payment-page/public/pickup-locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sortPickupLocations } from "@/lib/delivery-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;

    const { data, error } = await supabase
      .from("store_pickup_locations")
      .select(
        "id, store_id, label, address, notes, phone, is_default, is_active",
      )
      .eq("store_id", storeId)
      .eq("is_active", true);

    if (error) {
      console.error("Public pickup-locations error:", error);
      return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }

    return NextResponse.json({
      locations: sortPickupLocations(data ?? []),
    });
  } catch (err) {
    console.error("Public GET pickup-locations error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}