// app/api/payment-page/public/variant-stock/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseMetadata(raw: any): any {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

/**
 * GET /api/payment-page/public/variant-stock?pageSlug=...
 *
 * Returns per-variant remaining stock for a PHYSICAL product page:
 *   { variantStock: { "<sku or name>": <remaining>, ... } }
 *
 * Rules:
 *   • variant.stock === null | undefined | "" → unlimited → sentinel -1
 *   • variant.stock is any finite number (INCLUDING 0) → real cap
 *   • remaining = declared cap − sum(quantity of completed payments for sku)
 *   • For installment buyers, the FULL metadata.quantity is counted as
 *     sold the moment the first installment payment is completed.
 *
 * Non-physical pages return { variantStock: null }.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSlug = searchParams.get("pageSlug");

    if (!pageSlug) {
      return NextResponse.json(
        { error: "pageSlug is required" },
        { status: 400 }
      );
    }

    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("id, page_type, metadata")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    if (page.page_type !== "physical") {
      return NextResponse.json({ variantStock: null });
    }

    const metadata = parseMetadata(page.metadata);
    const variants = Array.isArray(metadata?.variants)
      ? metadata.variants
      : [];

    if (variants.length === 0) {
      return NextResponse.json({ variantStock: {} });
    }

    // Load every completed payment for this page once.
    const { data: payments, error: payErr } = await supabase
      .from("payment_page_payments")
      .select("metadata")
      .eq("payment_page_id", page.id)
      .eq("status", "completed");

    if (payErr) {
      console.error("[variant-stock] Failed to load payments:", payErr);
      return NextResponse.json(
        { error: "Could not compute stock" },
        { status: 500 }
      );
    }

    // ✅ Aggregate sold units per variant sku.
    //    - Only physical payments with a selectedVariantSku count.
    //    - We use metadata.quantity (defaults to 1). For installment
    //      buyers, quantity is the committed total, so the full count
    //      is reserved from the first installment onward.
    const soldBySku: Record<string, number> = {};
    for (const p of payments || []) {
      const m = parseMetadata((p as any).metadata);
      if (m?.pageType !== "physical" || !m?.selectedVariantSku) continue;

      const sku = String(m.selectedVariantSku);
      const qty = Math.max(1, Number(m?.quantity) || 1);
      soldBySku[sku] = (soldBySku[sku] || 0) + qty;
    }

    const variantStock: Record<string, number> = {};

    for (let i = 0; i < variants.length; i++) {
      const v: any = variants[i];
      const sku = v?.sku || v?.name || `variant-${i}`;

      const raw = v?.stock;

      // ✅ FIX: only null / undefined / "" mean "unlimited".
      //    A numeric 0 is a real cap of zero (sold out).
      const isUnlimited = raw == null || raw === "";

      if (isUnlimited) {
        variantStock[sku] = -1; // unlimited sentinel
        continue;
      }

      const declared = Number(raw);
      if (!Number.isFinite(declared)) {
        variantStock[sku] = -1;
        continue;
      }

      const sold = soldBySku[sku] || 0;
      variantStock[sku] = Math.max(0, declared - sold);
    }

    return NextResponse.json({ variantStock });
  } catch (err: any) {
    console.error("[variant-stock] error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}