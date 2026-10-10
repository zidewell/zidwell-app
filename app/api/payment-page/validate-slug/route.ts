// app/api/payment-page/validate-slug/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to validate slug", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { slug, pageId } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Clean slug
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/\s/g, "-")
      .replace(/-+/g, "-");

    if (cleanSlug.length < 1) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlug,
        message: "Slug must contain at least one character",
      });
    }

    // Check if slug exists (excluding current page if editing)
    let query = supabase
      .from("payment_pages")
      .select("slug, user_id")
      .eq("slug", cleanSlug);

    // If editing, exclude current page
    if (pageId) {
      query = query.neq("id", pageId);
    }

    const { data: existingPage, error: findError } = await query.maybeSingle();

    if (findError) {
      console.error("Error checking slug:", findError);
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    // Check if slug belongs to current user's store
    let isOwnStore = false;
    if (existingPage) {
      isOwnStore = existingPage.user_id === user.id;
    }

    const isTaken = !!existingPage;

    return NextResponse.json({
      valid: !isTaken || isOwnStore,
      slug: cleanSlug,
      isTaken,
      isOwnStore,
      message: isTaken 
        ? isOwnStore 
          ? "This slug is already used by one of your pages" 
          : "This slug is already taken"
        : "Slug is available",
    });
  } catch (error: any) {
    console.error("Slug validation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}