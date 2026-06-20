// app/api/payment-page/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    console.log(`🔍 Checking payment status for reference: ${reference}`);

    // Try by order_reference first (for card payments)
    let { data: payment, error } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", reference)
      .maybeSingle();

    // If not found, try by transfer_reference (for bank transfers)
    if (!payment) {
      const { data: byTransfer, error: transferError } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("transfer_reference", reference)
        .maybeSingle();
      
      if (!transferError && byTransfer) {
        payment = byTransfer;
        console.log(`✅ Found payment by transfer_reference: ${reference}`);
      }
    }

    if (!payment) {
      console.log(`❌ Payment not found for reference: ${reference}`);
      return NextResponse.json({ 
        found: false,
        error: "Payment not found" 
      }, { status: 404 });
    }

    console.log(`✅ Payment status: ${payment.status}`);

    // Build redirect URL if payment is completed
    let redirectUrl = null;
    if (payment.status === "completed") {
      const page = payment.payment_pages;
      const metadata = payment.metadata || {};
      
      // Priority: accessLink > downloadUrl > linkConfig.redirectUrl > page.redirectUrl > default
      if (metadata.accessLink && metadata.accessLink.trim() !== '') {
        redirectUrl = metadata.accessLink;
      } else if (metadata.downloadUrl && metadata.downloadUrl.trim() !== '') {
        redirectUrl = metadata.downloadUrl;
      } else if (page?.page_type === "link" && page.metadata?.linkConfig?.redirectUrl) {
        redirectUrl = page.metadata.linkConfig.redirectUrl;
      } else if (page?.metadata?.redirectUrl) {
        redirectUrl = page.metadata.redirectUrl;
      } else {
        const baseUrl = process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://zidwell.com";
        redirectUrl = `${baseUrl}/payment-page-success?reference=${reference}&status=success`;
      }
    }

    return NextResponse.json({
      success: true,
      found: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        net_amount: payment.net_amount,
        status: payment.status,
        customer_name: payment.customer_name,
        customer_email: payment.customer_email,
        payment_method: payment.payment_method,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        redirectUrl: redirectUrl,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}