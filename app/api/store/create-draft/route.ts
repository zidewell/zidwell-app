// app/api/store/create-draft/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

// ✅ Ensure this route is never statically cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET /api/store/create-draft
// ============================================================
export async function GET(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: draft, error } = await supabase
    .from("store_create_drafts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching create draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft" },
      { status: 500 }
    );
  }

  // ✅ Don't cache
  return NextResponse.json(
    { draft: draft ?? null },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

// ============================================================
// POST /api/store/create-draft
// ============================================================
export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      name = "",
      slug = "",
      description = "",
      keywords = [],
      cacNumber = "",
      country = "Nigeria",
      state = "",
      city = "",
      streetAddress = "",
      locationEnabled = true,
      step = 1,
      latitude = null,
      longitude = null,
      locationAccuracy = null,
    } = body || {};

    const payload = {
      user_id: user.id,
      name: name?.trim() || null,
      slug: slug?.trim() || null,
      description: description || null,
      keywords: Array.isArray(keywords) ? keywords : [],
      cac_number: cacNumber?.trim() || null,
      country: country || "Nigeria",
      state: state?.trim() || null,
      city: city?.trim() || null,
      street_address: streetAddress?.trim() || null,
      location_enabled: locationEnabled !== false,
      step: Math.min(Math.max(Number(step) || 1, 1), 3),
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      location_accuracy:
        typeof locationAccuracy === "number" ? locationAccuracy : null,
      updated_at: new Date().toISOString(),
    };

    const { data: draft, error } = await supabase
      .from("store_create_drafts")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Error saving create draft:", error);
      return NextResponse.json(
        { error: "Failed to save draft" },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft });
  } catch (err: any) {
    console.error("Create draft POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/store/create-draft
// ============================================================
export async function DELETE(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("store_create_drafts")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting create draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}