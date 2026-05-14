// app/api/payment-page/public/checkout/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

const generateOrderReference = (pageId: string | number): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const fullPageId = pageId.toString();
  const shortId = fullPageId.slice(-12);
  let reference = `PP-${shortId}-${timestamp}-${random}`;
  if (reference.length > 50) {
    reference = reference.substring(0, 50);
  }
  return reference;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 API Received:", JSON.stringify(body, null, 2));
    
    const {
      pageSlug,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      metadata,
    } = body;

    // Validate required fields
    if (!pageSlug) {
      return NextResponse.json({ error: "Missing pageSlug" }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ error: "Missing customerName" }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: "Missing customerEmail" }, { status: 400 });
    }

    // Get payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      console.error("Page not found:", pageError);
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    console.log("✅ Page found:", { id: page.id, title: page.title, type: page.page_type });

    // Determine final amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (page.page_type === "school" && page.metadata?.feeBreakdown?.length > 0) {
        finalAmount = page.metadata.feeBreakdown.reduce(
          (sum: number, item: any) => sum + item.amount, 0
        );
      } else if (page.price_type === "open") {
        return NextResponse.json({ error: "Amount required for open pricing" }, { status: 400 });
      } else {
        finalAmount = page.price;
      }
    }

    // Calculate fee (creator bears it)
    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;
    const totalForCustomer = finalAmount * numberOfStudents;

    // Generate order reference
    const orderReference = generateOrderReference(page.id);
    const fullReference = `PP-${page.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Prepare metadata for payment record
    const paymentMetadata: any = {
      ...metadata,
      pageType: page.page_type,
      pageTitle: page.title,
      fullReference,
      feeBorneBy: "creator",
      feeAmount: fee,
    };

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: page.id,
        user_id: page.user_id,
        amount: totalForCustomer,
        fee: fee * numberOfStudents,
        net_amount: (finalAmount - fee) * numberOfStudents,
        status: "pending",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || "",
        order_reference: orderReference,
        metadata: paymentMetadata,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    console.log("✅ Payment record created:", { id: payment.id, reference: orderReference });

    // Get Nomba token
    const accessToken = await getNombaToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    // Create checkout payload
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-page/callback`,
        customerEmail: customerEmail,
        amount: totalForCustomer.toString(),
        currency: "NGN",
        orderReference: orderReference,
        customerId: page.user_id,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card", "Transfer"],
        metadata: {
          type: "payment_page",
          paymentPageId: page.id,
          paymentId: payment.id,
          pageSlug: pageSlug,
          originalAmount: finalAmount,
          fee: fee,
          feeBorneBy: "creator",
          pageType: page.page_type,
          fullReference,
          numberOfStudents: numberOfStudents,
        },
      },
      tokenizeCard: false,
    };

    console.log("🚀 Sending to Nomba...");

    const response = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      console.error("Nomba error:", data);
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      throw new Error(data.description || "Failed to create checkout");
    }

    console.log("✅ Checkout created successfully");

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
      amount: totalForCustomer,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}