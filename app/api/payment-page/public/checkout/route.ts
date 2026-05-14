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

// Helper function to generate order reference (max 50 chars for Nomba)
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
    const {
      pageSlug,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      metadata,
    } = await request.json();

    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 },
      );
    }

    // Determine final amount - check if fee breakdown exists
    let finalAmount = amount;
    if (!finalAmount) {
      if (
        page.page_type === "school" &&
        page.metadata?.feeBreakdown &&
        page.metadata.feeBreakdown.length > 0
      ) {
        finalAmount = page.metadata.feeBreakdown.reduce(
          (sum: number, item: any) => sum + item.amount,
          0,
        );
      } else if (page.price_type === "open") {
        return NextResponse.json(
          { error: "Amount required for open pricing" },
          { status: 400 },
        );
      } else {
        finalAmount = page.price;
      }
    }

    // Validate minimum amount for investments
    const minAmount = page.metadata?.minimumAmount;
    if (minAmount && finalAmount < minAmount) {
      return NextResponse.json(
        { error: `Minimum amount is ₦${minAmount.toLocaleString()}` },
        { status: 400 },
      );
    }

    // ✅ FIX: Calculate fee (creator bears it, customer pays NO extra fee)
    const fee = Math.min(finalAmount * 0.02, 2000);
    const totalForCustomer = finalAmount; // Customer pays exact amount, no fee added

    // Generate order reference with PP- prefix
    const orderReference = generateOrderReference(page.id);
    
    // Store full reference for internal tracking
    const fullReference = `PP-${page.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Prepare metadata for payment record
    const paymentMetadata: any = {
      ...metadata,
      pageType: page.page_type,
      pageTitle: page.title,
      fullReference,
      feeBorneBy: "creator", // ✅ Track that creator pays the fee
      feeAmount: fee,
    };

    // Add school-specific metadata
    if (page.page_type === "school") {
      paymentMetadata.parentName = metadata?.parentName || "";
      paymentMetadata.childName = metadata?.childName || "";
      paymentMetadata.regNumber = metadata?.regNumber || "";
      paymentMetadata.customFields = metadata?.customFields || {};
    }

    // ✅ Create payment record - creator bears the fee
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: page.id,
        user_id: page.user_id,
        amount: finalAmount,
        fee: fee, // Fee that will be deducted from creator
        net_amount: finalAmount - fee, // Creator receives amount minus fee
        status: "pending",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_reference: orderReference,
        metadata: paymentMetadata,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 },
      );
    }

    // Get Nomba token
    const accessToken = await getNombaToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 },
      );
    }

    // ✅ Create checkout with Nomba - customer pays exact amount (no fee)
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-page/callback`,
        customerEmail: customerEmail,
        amount: totalForCustomer.toString(), // Customer pays exact amount
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
          feeBorneBy: "creator", // ✅ Track who bears the fee
          pageType: page.page_type,
          fullReference,
          ...(page.page_type === "school" && {
            parentName: metadata?.parentName || "",
            childName: metadata?.childName || "",
            regNumber: metadata?.regNumber || "",
          }),
        },
      },
      tokenizeCard: false,
    };

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
      // Update payment status to failed
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      throw new Error(data.description || "Failed to create checkout");
    }

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
      amount: totalForCustomer,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}