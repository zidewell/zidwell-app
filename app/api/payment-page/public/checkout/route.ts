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
      `[${requestId}] 📥 Request body:`,
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

    // Validate required fields
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

    // FIX: Round amount to avoid floating-point artifacts
    // e.g. 5000.0000000001 would break Nomba's amount validation
    finalAmount = Number(Number(finalAmount).toFixed(2));

    // Fee calculation (creator bears it)
    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;

    // FIX: Round total to 2 decimals and keep as number, then convert
    // to a clean string in the payload below
    const totalForCustomer = Number(
      (finalAmount * numberOfStudents).toFixed(2)
    );

    const orderReference = generateOrderReference(page.id);

    console.log(`[${requestId}] 🧮 Amount calc:`, {
      finalAmount,
      fee,
      numberOfStudents,
      totalForCustomer,
      totalForCustomerString: totalForCustomer.toFixed(2),
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

    // Add student tracking for school payments
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

    // FIX: use dash instead of underscore in the callback query so
    // Nomba's URL validation is happy
    const sessionId = `${payment.id}-${Date.now()}`;

    // FIX: Build the checkout payload per Nomba docs:
    // - accountId removed from the order (it belongs only in the header
    //   unless you're routing to a sub-account; the header authenticates)
    // - metadata renamed to orderMetaData (that's the documented field)
    // - all orderMetaData values are strings
    // - amount sent as a clean 2-decimal string
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/payment-page/callback?session_id=${encodeURIComponent(
          sessionId
        )}`,
        customerEmail: customerEmail,
        amount: totalForCustomer.toFixed(2),
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
      `[${requestId}] 🔎 KEY — amount:`,
      checkoutPayload.order.amount
    );
    console.log(
      `[${requestId}] 🔎 KEY — allowedPaymentMethods:`,
      checkoutPayload.order.allowedPaymentMethods
    );
    console.log(
      `[${requestId}] 🔎 KEY — callbackUrl:`,
      checkoutPayload.order.callbackUrl
    );
    console.log(
      `[${requestId}] 🔎 KEY — endpoint:`,
      `${process.env.NOMBA_URL}/v1/checkout/order`
    );
    console.log(
      `[${requestId}] 🔎 KEY — accountId header:`,
      process.env.NOMBA_ACCOUNT_ID
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
    console.error(
      `[${requestId}] ❌ ERROR:`,
      error.message
    );
    console.log(
      `[${requestId}] ========== END (ERROR) ==========\n`
    );
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}