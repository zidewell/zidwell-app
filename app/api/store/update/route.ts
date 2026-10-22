import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Local shape of updatable columns on `online_stores`.
type StoreUpdate = {
  name?: string;
  description?: string;
  keywords?: string[]; // <-- DB column is text[]
  cac_number?: string;
  country?: string;
  state?: string;
  city?: string;
  street_address?: string;
  location_enabled?: boolean;
  logo_url?: string;
  cover_url?: string;
  delivery_enabled?: boolean;
  local_pickup_enabled?: boolean;
  local_pickup_address?: string;
  local_pickup_notes?: string;
  delivery_notes?: string;
};

const ALLOWED_FIELDS = {
  name: "name",
  description: "description",
  keywords: "keywords",
  cacNumber: "cac_number",
  country: "country",
  state: "state",
  city: "city",
  streetAddress: "street_address",
  locationEnabled: "location_enabled",
  logoUrl: "logo_url",
  coverUrl: "cover_url",
  deliveryEnabled: "delivery_enabled",
  localPickupEnabled: "local_pickup_enabled",
  localPickupAddress: "local_pickup_address",
  localPickupNotes: "local_pickup_notes",
  deliveryNotes: "delivery_notes",
} as const satisfies Record<string, keyof StoreUpdate>;

type ApiField = keyof typeof ALLOWED_FIELDS;

export async function PUT(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const updates: StoreUpdate = {};

  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (!(k in ALLOWED_FIELDS)) continue;
    const dbKey = ALLOWED_FIELDS[k as ApiField];

    switch (dbKey) {
      case "name":
      case "description":
      case "cac_number":
      case "country":
      case "state":
      case "city":
      case "street_address":
      case "logo_url":
      case "cover_url":
      case "local_pickup_address":
      case "local_pickup_notes":
      case "delivery_notes":
        if (typeof v !== "string") {
          return NextResponse.json(
            { error: `Field "${k}" must be a string` },
            { status: 400 },
          );
        }
        updates[dbKey] = v;
        break;

      case "keywords":
        if (
          !Array.isArray(v) ||
          !v.every((item) => typeof item === "string")
        ) {
          return NextResponse.json(
            { error: `Field "${k}" must be an array of strings` },
            { status: 400 },
          );
        }
        updates.keywords = v as string[];
        break;

      case "location_enabled":
      case "delivery_enabled":
      case "local_pickup_enabled":
        if (typeof v !== "boolean") {
          return NextResponse.json(
            { error: `Field "${k}" must be a boolean` },
            { status: 400 },
          );
        }
        updates[dbKey] = v;
        break;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields supplied" },
      { status: 400 },
    );
  }

  const { data: store, error } = await supabase
    .from("online_stores")
    .update(updates)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error || !store) {
    return NextResponse.json(
      { error: error?.message || "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ store });
}