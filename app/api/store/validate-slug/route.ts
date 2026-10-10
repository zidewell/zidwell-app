// app/api/store/validate-slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Slugs reserved by app infrastructure ───
// These can never be used as a store slug because they'd collide with
// actual routes under /store/* or global paths.
const RESERVED_STORE_SLUGS = new Set([
  // App-level reserved
  "api",
  "admin",
  "auth",
  "dashboard",
  "blog",
  "pricing",
  "about",
  "contact",
  "privacy",
  "terms",
  "help",
  "faq",
  "docs",
  "legal",
  "support",
  "settings",
  "profile",
  "account",
  "login",
  "signup",
  "register",
  "new",
  "create",
  "edit",
  "delete",
  "manage",
  // Storefront sub-paths
  "link",
  // Common reserved words
  "store",
  "stores",
  "shop",
  "shops",
  "payment",
  "payments",
  "pay",
  "checkout",
  "cart",
  "order",
  "orders",
  "product",
  "products",
  "wallet",
  "wallets",
  "transaction",
  "transactions",
  "customer",
  "customers",
  "analytics",
  "bookkeeping",
  "reports",
  "inventory",
  "billing",
  "payouts",
  "withdraw",
  "notifications",
  "subscription",
  "security",
  "system",
  "root",
  "official",
  "moderator",
  "staff",
  "team",
  "zidwell",
]);

const MIN_LENGTH = 3;
const MAX_LENGTH = 50;

// Slug regex — lowercase letters, numbers, hyphens only
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function cleanSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);

    if (!user) {
      return NextResponse.json(
        { error: "Please login to validate URL", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { slug, storeId } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    const cleanSlugValue = cleanSlug(slug);

    // ─── VALIDATION ───
    if (cleanSlugValue.length < MIN_LENGTH) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message: `URL must be at least ${MIN_LENGTH} characters`,
      });
    }

    if (cleanSlugValue.length > MAX_LENGTH) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message: `URL is too long. Maximum ${MAX_LENGTH} characters.`,
      });
    }

    if (!SLUG_REGEX.test(cleanSlugValue)) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: false,
        isReserved: false,
        isOwnStore: false,
        message:
          "URL must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens.",
      });
    }

    // ─── RESERVED SLUGS ───
    if (RESERVED_STORE_SLUGS.has(cleanSlugValue)) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: true,
        isReserved: true,
        isOwnStore: false,
        message: `"${cleanSlugValue}" is reserved by Zidwell. Please choose a different URL.`,
      });
    }

    // ─── UNIQUENESS ───
    // Check against BOTH tables:
    //   1. online_stores.slug  → another storefront using this URL
    //   2. payment_pages.slug  → a payment page using this URL
    //
    // Both live under /store/* so a slug must be free in both tables.
    const [storeCheck, pageCheck] = await Promise.all([
      // Check store slug
      (() => {
        let q = supabase
          .from("online_stores")
          .select("id, owner_id, slug")
          .eq("slug", cleanSlugValue);
        if (storeId) q = q.neq("id", storeId);
        return q.maybeSingle();
      })(),
      // Check payment page slug
      supabase
        .from("payment_pages")
        .select("id, user_id, slug")
        .eq("slug", cleanSlugValue)
        .maybeSingle(),
    ]);

    if (storeCheck.error && storeCheck.error.code !== "PGRST116") {
      console.error("Error checking store slug:", storeCheck.error);
      return NextResponse.json(
        { error: "Failed to validate URL" },
        { status: 500 }
      );
    }

    if (pageCheck.error && pageCheck.error.code !== "PGRST116") {
      console.error("Error checking page slug:", pageCheck.error);
      return NextResponse.json(
        { error: "Failed to validate URL" },
        { status: 500 }
      );
    }

    const existingStore = storeCheck.data;
    const existingPage = pageCheck.data;

    const isOwnStore =
      !!existingStore && existingStore.owner_id === user.id;

    // ─── Store slug taken by another store ───
    if (existingStore && !isOwnStore) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: true,
        isReserved: false,
        isOwnStore: false,
        message:
          "This store URL is already taken. Please choose a different one.",
      });
    }

    // ─── Slug used by a payment page (someone else's) ───
    if (existingPage && existingPage.user_id !== user.id) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: true,
        isReserved: false,
        isOwnStore: false,
        message:
          "This URL is already used by a payment page. Please choose a different one.",
      });
    }

    // ─── Slug used by your own payment page ───
    if (existingPage && existingPage.user_id === user.id) {
      return NextResponse.json({
        valid: false,
        slug: cleanSlugValue,
        isTaken: true,
        isReserved: false,
        isOwnStore: true,
        message:
          "This URL is used by one of your payment pages. Please choose a different one.",
      });
    }

    // ─── Editing your own store ───
    if (isOwnStore) {
      return NextResponse.json({
        valid: true,
        slug: cleanSlugValue,
        isTaken: false,
        isReserved: false,
        isOwnStore: true,
        message: "This is your current store URL.",
      });
    }

    // ─── ALL GOOD ───
    return NextResponse.json({
      valid: true,
      slug: cleanSlugValue,
      isTaken: false,
      isReserved: false,
      isOwnStore: false,
      message: "URL is available",
    });
  } catch (error: any) {
    console.error("Store slug validation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}