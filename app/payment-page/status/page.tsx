// app/api/payment-page/status/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", reference)
      .maybeSingle();

    if (error) {
      console.error("Error fetching payment:", error);
      return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    // ✅ Get redirect URL from payment or page metadata
    let redirectUrl = payment.metadata?.redirectUrl || 
                     payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
                     payment.payment_pages?.metadata?.redirectUrl ||
                     null;

    // If no redirect URL, build from store slug and page slug
    if (!redirectUrl && payment.payment_pages) {
      const storeSlug = payment.payment_pages?.metadata?.storeSlug || '';
      const pageSlug = payment.payment_pages?.slug;
      redirectUrl = `/store/${storeSlug}/${pageSlug}`;
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        redirectUrl: redirectUrl,
      },
    });
  } catch (error: any) {
    console.error("Status API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}