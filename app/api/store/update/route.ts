import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

export async function PUT(req: NextRequest) {
  const user = await isAuthenticated(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const allowed: Record<string, string> = {
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
  };

  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (allowed[k]) updates[allowed[k]] = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields supplied" }, { status: 400 });
  }

  const { data: store, error } = await supabase
    .from("online_stores")
    .update(updates)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error || !store) {
    return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ store });
}