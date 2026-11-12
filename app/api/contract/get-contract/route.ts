// app/api/contract/get-contract/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── GET: fetch a single contract by id or token (used by edit page) ───
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Contract ID is required" },
        { status: 400 },
      );
    }

    // Try by UUID first
    const { data: byId, error: error1 } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error1 && byId) {
      return NextResponse.json(
        { success: true, contract: byId },
        { status: 200 },
      );
    }

    // Then by token
    const { data: byToken, error: error2 } = await supabase
      .from("contracts")
      .select("*")
      .eq("token", id)
      .maybeSingle();

    if (!error2 && byToken) {
      return NextResponse.json(
        { success: true, contract: byToken },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: "Contract not found",
        details: error2?.message || error1?.message || "No matching records",
        searchedId: id,
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("Unexpected error in get-contract (GET):", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ─── POST: fetch all contracts for a user by email (used by list page) ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userEmail } = body as { userEmail?: string };

    if (!userEmail) {
      return NextResponse.json(
        { message: "userEmail is required" },
        { status: 400 },
      );
    }

    // Look up the user first so we can also match on user_id —
    // covers cases where initiator_email is stored differently
    // (e.g. legacy rows with a different casing).
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    let query = supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (user?.id) {
      query = query.or(
        `initiator_email.eq.${userEmail},user_id.eq.${user.id}`,
      );
    } else {
      query = query.eq("initiator_email", userEmail);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error("Supabase error fetching contracts:", error);
      return NextResponse.json(
        { message: "Failed to fetch contracts", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, contracts: contracts ?? [] },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error in get-contract (POST):", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}