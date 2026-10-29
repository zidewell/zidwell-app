// app/api/payment-page/public/delivery-addresses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sortDeliveryZones } from "@/lib/delivery-utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (
      !storeId ||
      storeId === "undefined" ||
      storeId === "null" ||
      !UUID_RE.test(storeId)
    ) {
      return NextResponse.json(
        { error: "A valid storeId is required", zones: [] },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin() as any;

    const { data, error } = await supabase
      .from("store_delivery_addresses")
      .select(
        "id, store_id, label, address, city, state, fee, free_threshold, notes, is_default, is_active",
      )
      .eq("store_id", storeId)
      .eq("is_active", true);

    if (error) {
      console.error("Public delivery-zones error:", error);
      return NextResponse.json(
        { error: "Failed to load", zones: [] },
        { status: 500 },
      );
    }

    return NextResponse.json({
      zones: sortDeliveryZones(data ?? []),
    });
  } catch (err) {
    console.error("Public GET delivery-zones error:", err);
    return NextResponse.json(
      { error: "Internal error", zones: [] },
      { status: 500 },
    );
  }
}