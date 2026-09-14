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

  console.log(`\n========== [${requestId}] CHECKOUT START ==========`);

  try {
    // ===== DEBUG: Environment =====
    console.log(`[${requestId}] 🔧 ENV CHECK:`, {
      NODE_ENV: process.env.NODE_ENV,
      NOMBA_URL: process.env.NOMBA_URL,
      NOMBA_ACCOUNT_ID: process.env.NOMBA_ACCOUNT_ID
        ? `${process.env.NOMBA_ACCOUNT_ID.slice(
            0,
            6
          )}...${process.env.NOMBA_ACCOUNT_ID.slice(-4)}`
        : "MISSING",
    });

    const body = await request.json();
    console.log(
      `[${requestId}] 📥 Incoming request body:`,
      JSON.stringify(body, null, 2)
    );

    const {
      pageSlug,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      metadata,
    } = body;

    if (!pageSlug || !customerName || !customerEmail) {
      console.warn(`[${requestId}] ⚠️ Missing required fields`);
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
      console.error(
        `[${requestId}] ❌ Page lookup failed:`,
        pageError
      );
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    console.log(`[${requestId}] ✅ Page found:`, {
      id: page.id,
      slug: page.slug,
      page_type: page.page_type,
      price: page.price,
    });

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

    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;
    const totalForCustomer = finalAmount * numberOfStudents;
    const orderReference = generateOrderReference(page.id);

    console.log(`[${requestId}] 🧮 Amount calc:`, {
      finalAmount,
      fee,
      numberOfStudents,
      totalForCustomer,
      orderReference,
    });

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
        paymentData.student_name = metadata.selectedStudents[0];
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

    // Create payment record
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

    console.log(`[${requestId}] ✅ Payment record:`, {
      id: payment.id,
      order_reference: payment.order_reference,
    });

    // Get Nomba token
    const accessToken = await getNombaToken();
    if (!accessToken) {
      console.error(
        `[${requestId}] ❌ Failed to get Nomba token`
      );
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    const sessionId = `${payment.id}_${Date.now()}`;

    // ===== FIXED CHECKOUT PAYLOAD =====
    // - Removed accountId from order (uses parent account by default)
    // - Renamed metadata -> orderMetaData
    // - All orderMetaData values are strings
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-page/callback?session_id=${sessionId}`,
        customerEmail: customerEmail,
        amount: totalForCustomer.toString(),
        currency: "NGN",
        orderReference: orderReference,
        customerId: String(page.user_id),
        allowedPaymentMethods: ["Card", "Transfer"],
        orderMetaData: {
          type: "payment_page",
          paymentPageId: String(page.id),
          paymentId: String(payment.id),
          pageSlug: String(pageSlug),
        },
      },
      tokenizeCard: false,
    };

    console.log(
      `[${requestId}] 📤 Nomba payload:`,
      JSON.stringify(checkoutPayload, null, 2)
    );
    console.log(
      `[${requestId}] 🔎 allowedPaymentMethods:`,
      checkoutPayload.order.allowedPaymentMethods
    );
    console.log(
      `[${requestId}] 🔎 accountId header:`,
      process.env.NOMBA_ACCOUNT_ID
    );
    console.log(
      `[${requestId}] 🔎 Endpoint:`,
      `${process.env.NOMBA_URL}/v1/checkout/order`
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

    console.log(
      `[${requestId}] 📡 Nomba HTTP:`,
      response.status,
      response.statusText
    );

    const data = await response.json();
    console.log(
      `[${requestId}] 📥 Nomba response:`,
      JSON.stringify(data, null, 2)
    );

    if (!response.ok || data.code !== "00") {
      console.error(
        `[${requestId}] ❌ Nomba checkout failed:`,
        data
      );
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
    console.log(
      `[${requestId}] ========== END (SUCCESS) ==========\n`
    );

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
      amount: totalForCustomer,
    });
  } catch (error: any) {
    console.error(`[${requestId}] ❌ ERROR:`, error.message);
    console.log(
      `[${requestId}] ========== END (ERROR) ==========\n`
    );
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}