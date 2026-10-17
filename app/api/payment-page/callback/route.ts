// app/api/payment-page/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const sessionId = sp.get("session_id");
    const orderReference =
      sp.get("orderReference") || sp.get("order_reference");
    // Paystack sends `reference` (and `trxref`) on redirect
    const paystackReference =
      sp.get("reference") || sp.get("trxref");
    const status =
      sp.get("status") || sp.get("paymentStatus");

    console.log(`📞 Callback:`, {
      sessionId,
      orderReference,
      paystackReference,
      status,
    });

    // ─── 1. Determine payment lookup key ───
    let payment: any = null;
    let redirectUrl: string | null = null;

    // Paystack branch — reference IS our order_reference
    if (paystackReference) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("order_reference", paystackReference)
        .maybeSingle();

      if (!error && data) {
        payment = data;
        redirectUrl =
          payment.metadata?.redirectUrl ||
          payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
          payment.payment_pages?.metadata?.redirectUrl ||
          null;
      }
    }

    // Legacy Nomba: session_id → paymentId
    if (!payment && sessionId) {
      const paymentId = sessionId.split("_")[0];
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("id", paymentId)
        .maybeSingle();

      if (!error && data) {
        payment = data;
        redirectUrl =
          payment.metadata?.redirectUrl ||
          payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
          payment.payment_pages?.metadata?.redirectUrl ||
          null;
      }
    }

    // Legacy Nomba: order_reference
    if (!payment && orderReference) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("order_reference", orderReference)
        .maybeSingle();

      if (!error && data) {
        payment = data;
        redirectUrl =
          payment.metadata?.redirectUrl ||
          payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
          payment.payment_pages?.metadata?.redirectUrl ||
          null;
      }
    }

    // ─── 2. Build final redirect ───
    let finalRedirectUrl = redirectUrl;

    if (!finalRedirectUrl && payment) {
      const storeSlug =
        payment.payment_pages?.metadata?.storeSlug || "";
      const pageSlug = payment.payment_pages?.slug;
      finalRedirectUrl = `/store/${storeSlug}/${pageSlug}`;
    }

    if (!finalRedirectUrl) finalRedirectUrl = "/";

    const isSuccess =
      status === "success" ||
      status === "successful" ||
      status === "completed" ||
      (payment && payment.status === "completed");

    if (isSuccess) {
      console.log(`✅ Payment success, redirecting to ${finalRedirectUrl}`);
      if (
        finalRedirectUrl.startsWith("http://") ||
        finalRedirectUrl.startsWith("https://")
      ) {
        return NextResponse.redirect(finalRedirectUrl);
      }
      const successUrl = `${baseUrl}${finalRedirectUrl}?payment=success&reference=${
        paystackReference || orderReference || payment?.order_reference || ""
      }`;
      return NextResponse.redirect(successUrl);
    }

    // Not yet confirmed — send to status page which polls
    console.log(`⏳ Payment status: ${status || payment?.status || "unknown"}`);
    const statusUrl = `${baseUrl}/payment-page/status?reference=${
      paystackReference || orderReference || payment?.order_reference || ""
    }&status=${status || payment?.status || "processing"}`;
    return NextResponse.redirect(statusUrl);
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?status=error&message=${encodeURIComponent(
        error.message
      )}`
    );
  }
}