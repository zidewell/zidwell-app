// app/api/store/settings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_NAME = 80;
const MAX_DESCRIPTION = 5000;
const MAX_KEYWORDS = 20;
const MAX_KEYWORD_LEN = 40;

function normalizeKeywords(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const k = raw.trim();
    if (!k || k.length > MAX_KEYWORD_LEN) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

// ─── GET /api/store/settings ───
export async function GET(request: Request) {
  try {
    const { user } = await isAuthenticatedWithRefresh(request as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: store, error } = await supabase
      .from("online_stores")
      .select(
        "id, name, slug, description, keywords, logo_url, country, state, city, street_address, location_enabled, latitude, longitude, is_active, activation_paid"
      )
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    console.error("Store settings GET error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/store/settings ───
export async function PUT(request: Request) {
  try {
    const { user } = await isAuthenticatedWithRefresh(request as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("online_stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // ─── Validate + collect allowed updates only ───
    const updates: Record<string, any> = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Store name must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (name.length > MAX_NAME) {
        return NextResponse.json(
          { error: `Store name must be at most ${MAX_NAME} characters` },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (typeof body.description === "string") {
      if (body.description.length > MAX_DESCRIPTION) {
        return NextResponse.json(
          { error: "Description is too long" },
          { status: 400 }
        );
      }
      updates.description = body.description;
    }

    if (body.keywords !== undefined) {
      updates.keywords = normalizeKeywords(body.keywords);
    }

    if (typeof body.logoUrl === "string" || body.logoUrl === null) {
      updates.logo_url = body.logoUrl;
    }

    if (typeof body.country === "string" && body.country.trim()) {
      updates.country = body.country.trim();
    }
    if (typeof body.state === "string") {
      if (!body.state.trim()) {
        return NextResponse.json(
          { error: "State is required" },
          { status: 400 }
        );
      }
      updates.state = body.state.trim();
    }
    if (typeof body.city === "string") {
      if (!body.city.trim()) {
        return NextResponse.json(
          { error: "City is required" },
          { status: 400 }
        );
      }
      updates.city = body.city.trim();
    }
    if (typeof body.streetAddress === "string") {
      if (!body.streetAddress.trim()) {
        return NextResponse.json(
          { error: "Street address is required" },
          { status: 400 }
        );
      }
      updates.street_address = body.streetAddress.trim();
    }

    if (typeof body.locationEnabled === "boolean") {
      updates.location_enabled = body.locationEnabled;
    }

    if (body.latitude === null || typeof body.latitude === "number") {
      updates.latitude = body.latitude;
    }
    if (body.longitude === null || typeof body.longitude === "number") {
      updates.longitude = body.longitude;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // ─── Apply update, scoped by owner_id (never trust client id) ───
    const { data: updated, error: updateError } = await supabase
      .from("online_stores")
      .update(updates)
      .eq("owner_id", user.id)
      .select(
        "id, name, slug, description, keywords, logo_url, country, state, city, street_address, location_enabled, latitude, longitude"
      )
      .single();

    if (updateError) {
      console.error("Store settings PUT error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update store" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, store: updated });
  } catch (err: any) {
    console.error("Store settings PUT error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}