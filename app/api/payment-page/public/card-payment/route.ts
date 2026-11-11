// app/api/payment-page/public/card-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { paystackInitialize } from "@/lib/paystack";

const APP_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pageSlug,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      metadata = {},
      returnUrl,
      fulfillmentMethod,
      deliveryAddress,
      deliveryZoneId,
      pickupLocationId,
    } = body;

    if (!pageSlug) {
      return NextResponse.json({ error: "pageSlug required" }, { status: 400 });
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (pageError || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const pageMeta = (page.metadata as Record<string, any>) || {};
    const clientMeta = (metadata as Record<string, any>) || {};

    // ─── Variant stock guard ───
    if (
      page.page_type === "physical" &&
      Array.isArray(pageMeta.variants) &&
      Array.isArray(clientMeta.variantLines) &&
      clientMeta.variantLines.length > 0
    ) {
      const variantStock = pageMeta.variantStock || {};
      for (const line of clientMeta.variantLines) {
        const remaining = Number(variantStock[line.sku] ?? Infinity);
        if (Number.isFinite(remaining) && line.quantity > remaining) {
          return NextResponse.json(
            {
              code:
                remaining <= 0
                  ? "VARIANT_OUT_OF_STOCK"
                  : "INSUFFICIENT_STOCK",
              error:
                remaining <= 0
                  ? `${line.name} just sold out`
                  : `Only ${remaining} ${line.name} left`,
            },
            { status: 409 }
          );
        }
      }
    }

    const reference = `CARD-${crypto.randomUUID()}`;

    // ─── Create pending payment ───
    // All NOT NULL columns without DB defaults must be provided:
    //   amount, net_amount, fee, status, customer_name, order_reference, metadata
    const { data: payment, error: insertErr } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: page.id,
        user_id: page.user_id,
        order_reference: reference,
        amount: Number(amount),
        net_amount: Number(amount),
        fee: 0,
        status: "pending",
        customer_name: customerName || "Customer",
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        payment_type: clientMeta.paymentType || "full",
        is_installment: !!clientMeta.isInstallment,
        metadata: {
          ...clientMeta,
          fulfillmentMethod,
          deliveryAddress,
          deliveryZoneId,
          pickupLocationId,
        },
      } as any)
      .select()
      .single();

    if (insertErr || !payment) {
      console.error("[card-payment] insert failed:", insertErr);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // ─── Initialize Paystack ───
    try {
      const paystack = await paystackInitialize({
        email: customerEmail,
        amountNaira: Number(amount),
        reference,
        callbackUrl: `${APP_URL}/api/payment-page/public/callback`,
        channels: ["card", "bank_transfer"],
        metadata: {
          type: "payment_page",
          paymentMethod: "card",
          page_id: page.id,
          page_slug: page.slug,
          store_slug: clientMeta.storeSlug,
          redirectUrl: returnUrl || null,
          ...clientMeta,
        },
      });

      return NextResponse.json({
        checkoutLink: paystack.authorization_url,
        orderReference: reference,
        paymentId: payment.id,
      });
    } catch (paystackErr: any) {
      console.error("[card-payment] paystack error:", paystackErr);

      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        { error: paystackErr.message || "Paystack initialization failed" },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("[card-payment] unhandled:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
