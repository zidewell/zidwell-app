// app/api/payment-page/public/checkout/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

const generateOrderReference = (pageId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const shortId = pageId.slice(-12);
  return `PP-${shortId}-${timestamp}-${random}`;
};

export async function POST(request: Request) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  console.log(
    `\n========== [${requestId}] PAYMENT-PAGE CHECKOUT START ==========`
  );

  try {
    const body = await request.json();

    const {
      pageSlug,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      metadata,
    } = body;

    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Calculate final amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (
        page.page_type === "school" &&
        page.metadata?.feeBreakdown?.length > 0
      ) {
        finalAmount = page.metadata.feeBreakdown.reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );
      } else {
        finalAmount = page.price;
      }
    }

    // FIX 1: Round everything to 2 decimals — no float artifacts
    finalAmount = Number(Number(finalAmount).toFixed(2));

    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;

    // FIX 2: clean, 2-decimal amount string
    const totalForCustomer = Number(
      (finalAmount * numberOfStudents).toFixed(2)
    );
    const cleanAmount = totalForCustomer.toFixed(2);

    const orderReference = generateOrderReference(page.id);

    console.log(`[${requestId}] 🧮 Amount:`, {
      finalAmount,
      numberOfStudents,
      totalForCustomer,
      cleanAmount,
      orderReference,
    });

    // Prepare payment record
    const paymentData: any = {
      payment_page_id: page.id,
      user_id: page.user_id,
      amount: totalForCustomer,
      fee: Number((fee * numberOfStudents).toFixed(2)),
      net_amount: Number(
        ((finalAmount - fee) * numberOfStudents).toFixed(2)
      ),
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      order_reference: orderReference,
      payment_type: metadata?.isInstallment
        ? "installment"
        : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      metadata: metadata,
    };

    if (page.page_type === "school") {
      if (
        metadata?.selectedStudents &&
        metadata.selectedStudents.length === 1
      ) {
        paymentData.student_name =
          metadata.selectedStudents[0];
        paymentData.parent_name = metadata.parentName;
      } else if (
        metadata?.selectedStudents &&
        metadata.selectedStudents.length > 1
      ) {
        paymentData.selected_students =
          metadata.selectedStudents;
        paymentData.parent_name = metadata.parentName;
      }

      if (metadata?.isInstallment) {
        paymentData.installment_number =
          metadata.currentInstallment || 1;
        paymentData.total_installments =
          metadata.totalInstallments;
      }
    }

    const { data: payment, error: paymentError } =
      await supabase
        .from("payment_page_payments")
        .insert(paymentData)
        .select()
        .single();

    if (paymentError) {
      console.error(
        `[${requestId}] ❌ Payment insert failed:`,
        paymentError
      );
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    const accessToken = await getNombaToken();
    if (!accessToken) {
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    const sessionId = `${payment.id}-${Date.now()}`;

    // ============================================================
    // FIX 3: This is the key change.
    // customerId now uses the PAYER's identity, not the page
    // creator's ID. This matches how subscription & store routes
    // pass the payer's ID, and is what unblocks Transfer.
    // ============================================================
    const payerCustomerId = String(
      metadata?.customerId ||
        customerEmail ||
        payment.id
    );

    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-page/callback?session_id=${encodeURIComponent(
          sessionId
        )}`,
        customerEmail: customerEmail,
        amount: cleanAmount,
        currency: "NGN",
        orderReference: orderReference,
        customerId: payerCustomerId, // ✅ payer, not page creator
        allowedPaymentMethods: ["Card", "Transfer"],
        orderMetaData: {
          type: "payment_page",
          paymentPageId: String(page.id),
          paymentId: String(payment.id),
          pageSlug: String(pageSlug),
          pageOwnerId: String(page.user_id), // creator tracked here
        },
      },
      tokenizeCard: false,
    };

    console.log(
      `[${requestId}] 📤 Nomba payload:`,
      JSON.stringify(checkoutPayload, null, 2)
    );
    console.log(
      `[${requestId}] 🔎 KEY — amount:`,
      checkoutPayload.order.amount
    );
    console.log(
      `[${requestId}] 🔎 KEY — customerId:`,
      checkoutPayload.order.customerId
    );
    console.log(
      `[${requestId}] 🔎 KEY — allowedPaymentMethods:`,
      checkoutPayload.order.allowedPaymentMethods
    );

    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/checkout/order`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    const data = await response.json();

    console.log(
      `[${requestId}] 📥 Nomba response:`,
      JSON.stringify(data, null, 2)
    );

    if (!response.ok || data.code !== "00") {
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      throw new Error(
        data.description || "Failed to create checkout"
      );
    }

    console.log(
      `[${requestId}] ✅ Checkout created:`,
      data.data.checkoutLink
    );

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
      amount: totalForCustomer,
    });
  } catch (error: any) {
    console.error(`[${requestId}] ❌ ERROR:`, error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}