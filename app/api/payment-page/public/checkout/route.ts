// app/api/payment-page/public/checkout/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

const generateOrderReference = (pageId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const shortId = pageId.slice(-12);
  return `PP-${shortId}-${timestamp}-${random}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageSlug, customerName, customerEmail, customerPhone, amount, metadata } = body;

    // Validate required fields
    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    // Calculate final amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (page.page_type === "school" && page.metadata?.feeBreakdown?.length > 0) {
        finalAmount = page.metadata.feeBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
      } else {
        finalAmount = page.price;
      }
    }

    // Fee calculation (creator bears it)
    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;
    const totalForCustomer = finalAmount * numberOfStudents;
    const orderReference = generateOrderReference(page.id);

    // Prepare payment record
    const paymentData: any = {
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
      payment_type: metadata?.isInstallment ? "installment" : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      metadata: metadata,
    };

    // Add student tracking for school payments
    if (page.page_type === "school") {
      if (metadata?.selectedStudents && metadata.selectedStudents.length === 1) {
        paymentData.student_name = metadata.selectedStudents[0];
        paymentData.parent_name = metadata.parentName;
      } else if (metadata?.selectedStudents && metadata.selectedStudents.length > 1) {
        paymentData.selected_students = metadata.selectedStudents;
        paymentData.parent_name = metadata.parentName;
      }
      
      if (metadata?.isInstallment) {
        paymentData.installment_number = metadata.currentInstallment || 1;
        paymentData.total_installments = metadata.totalInstallments;
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Get Nomba token
    const accessToken = await getNombaToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    // Create checkout
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
      await supabase.from("payment_page_payments").update({ status: "failed" }).eq("id", payment.id);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}