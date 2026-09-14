
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

// Generate order reference using the payment ID
const generateOrderReference = (paymentId: string): string => {
  return `PP-${paymentId}-${Date.now()}`;
};

export async function POST(request: Request) {
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

    // Fee calculation (creator bears it)
    const fee = Math.min(finalAmount * 0.02, 2000);

    const numberOfStudents = metadata?.numberOfStudents || 1;

    const totalForCustomer =
      finalAmount * numberOfStudents;

    // Prepare payment record
    const paymentData: any = {
      payment_page_id: page.id,
      user_id: page.user_id,
      amount: totalForCustomer,
      fee: fee * numberOfStudents,
      net_amount:
        (finalAmount - fee) * numberOfStudents,
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      payment_type: metadata?.isInstallment
        ? "installment"
        : "full",
      total_amount:
        metadata?.totalAmount || finalAmount,
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

        paymentData.parent_name =
          metadata.parentName;
      } else if (
        metadata?.selectedStudents &&
        metadata.selectedStudents.length > 1
      ) {
        paymentData.selected_students =
          metadata.selectedStudents;

        paymentData.parent_name =
          metadata.parentName;
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

    if (paymentError || !payment) {
      console.error(
        "Error creating payment:",
        paymentError
      );

      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // Generate order reference AFTER payment is created
    // Uses PP- prefix as requested
    const orderReference =
      generateOrderReference(payment.id);

    // Save order reference to payment record
    const { error: referenceUpdateError } =
      await supabase
        .from("payment_page_payments")
        .update({
          order_reference: orderReference,
        })
        .eq("id", payment.id);

    if (referenceUpdateError) {
      console.error(
        "Failed to save order reference:",
        referenceUpdateError
      );
    }

    // Get Nomba token
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

    // Create unique session ID
    const sessionId =
      `${payment.id}_${Date.now()}`;

    // Nomba checkout payload
    const checkoutPayload = {
      order: {
        callbackUrl:
          `${baseUrl}/api/payment-page/callback?session_id=${sessionId}`,

        customerEmail: customerEmail,

        amount: totalForCustomer.toString(),

        currency: "NGN",

        orderReference: orderReference,

        customerId: page.user_id,

        accountId:
          process.env.NOMBA_ACCOUNT_ID,

        // Allow both Card and Transfer
        allowedPaymentMethods: [
          "Card",
          "Transfer",
        ],

        metadata: {
          type: "payment_page",
          paymentPageId: page.id,
          paymentId: payment.id,
          pageSlug: pageSlug,
        },
      },

      tokenizeCard: false,
    };

    console.log(
      "📤 Nomba payment-page checkout payload:",
      JSON.stringify(
        checkoutPayload,
        null,
        2
      )
    );

    // Create Nomba checkout
    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/checkout/order`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          accountId:
            process.env.NOMBA_ACCOUNT_ID!,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          checkoutPayload
        ),
      }
    );

    const data = await response.json();

    console.log(
      "📥 Nomba payment-page response:",
      JSON.stringify(data, null, 2)
    );

    if (
      !response.ok ||
      data.code !== "00"
    ) {
      console.error(
        "❌ Payment-page checkout creation failed:",
        data
      );

      await supabase
        .from("payment_page_payments")
        .update({
          status: "failed",
        })
        .eq("id", payment.id);

      throw new Error(
        data.description ||
          data.message ||
          "Failed to create checkout"
      );
    }

    console.log(
      "✅ Payment-page checkout created:",
      {
        paymentId: payment.id,
        orderReference,
        amount: totalForCustomer,
        checkoutLink:
          data.data.checkoutLink,
      }
    );

    return NextResponse.json({
      success: true,
      checkoutLink:
        data.data.checkoutLink,
      orderReference,
      amount: totalForCustomer,
    });
  } catch (error: any) {
    console.error(
      "❌ Checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Internal server error",
      },
      { status: 500 }
    );
  }
}
