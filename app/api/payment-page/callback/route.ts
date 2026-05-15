import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

export async function GET(request: NextRequest) {
  try {
    console.log("====== Payment Page Callback Received (GET) ======");
    
    const searchParams = request.nextUrl.searchParams;
    const orderReference = searchParams.get("orderReference") || searchParams.get("order_reference");
    const status = searchParams.get("status") || searchParams.get("paymentStatus");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id") || searchParams.get("reference");
    const paymentReference = searchParams.get("paymentReference") || searchParams.get("payment_reference");

    console.log("Callback params:", {
      orderReference,
      status,
      transactionId,
      paymentReference,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (!orderReference) {
      console.error("No orderReference provided");
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?status=error&message=Missing+order+reference`
      );
    }

    // First, try to find the payment
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", orderReference);
      
      // Payment might still be processing, show processing page
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=processing`
      );
    }

    // If payment is already completed
    if (payment.status === "completed") {
      console.log("Payment already completed");
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    }

    // If we have status from callback
    if (status === "successful" || status === "success" || status === "completed") {
      console.log("✅ Payment successful via callback, processing...");
      
      await processSuccessfulPayment(payment, transactionId || paymentReference);
      
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    } else if (status === "failed" || status === "error" || status === "cancelled") {
      console.log("❌ Payment failed via callback");
      
      await supabase
        .from("payment_page_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            failure_reason: status,
            failure_transaction_id: transactionId,
          },
        })
        .eq("id", payment.id);
      
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed&reason=${status}`
      );
    }

    // No status provided, show processing page
    console.log("No status provided, showing processing page");
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?reference=${orderReference}&status=processing`
    );
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("====== Payment Page Callback Received (POST) ======");
    
    const body = await request.json();
    console.log("Callback body:", JSON.stringify(body, null, 2));

    // Try to extract data from various possible formats
    let orderReference = body.orderReference || body.order_reference || body.reference;
    let status = body.status || body.paymentStatus || body.event_type;
    let transactionId = body.transactionId || body.transaction_id || body.id || body.reference;
    
    // Handle Nomba's specific format
    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }
    if (body.event_type) {
      status = body.event_type;
    }

    console.log("Extracted data:", { orderReference, status, transactionId });

    if (!orderReference) {
      console.error("No orderReference found in POST body");
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    // Find the payment
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", orderReference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if already processed
    if (payment.status === "completed") {
      console.log("Payment already completed");
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Handle successful payment
    const isSuccess = status === "payment_success" || 
                     status === "success" || 
                     status === "successful" ||
                     status === "completed";

    if (isSuccess) {
      console.log("✅ Payment successful, processing...");
      await processSuccessfulPayment(payment, transactionId);
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else if (status === "payment_failed" || status === "failed" || status === "error") {
      console.log("❌ Payment failed");
      await supabase
        .from("payment_page_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            failure_reason: status,
            failure_transaction_id: transactionId,
          },
        })
        .eq("id", payment.id);
      return NextResponse.json({ success: false, message: "Payment failed" });
    }

    // Still processing
    console.log("Payment still processing");
    return NextResponse.json({ success: true, message: "Payment processing" });
  } catch (error: any) {
    console.error("POST callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processSuccessfulPayment(payment: any, transactionId?: string) {
  // Update payment record
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: transactionId,
      payment_method: "card",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error("Failed to update payment:", updateError);
    throw updateError;
  }

  // Credit the page balance
  const pageCreditAmount = payment.net_amount;
  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    {
      p_page_id: payment.payment_page_id,
      p_amount: pageCreditAmount,
    },
  );

  if (balanceError) {
    console.error("Failed to increment balance:", balanceError);
  } else {
    console.log(`✅ Credited ₦${pageCreditAmount}. New balance: ₦${newBalance}`);
  }

  // Create transaction record
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: payment.user_id,
    type: "credit",
    amount: payment.amount,
    fee: payment.fee,
    net_amount: pageCreditAmount,
    status: "success",
    reference: `PP-${payment.payment_page_id}-${transactionId}`,
    description: `Payment received for page "${payment.payment_pages?.title}" from ${payment.customer_name}`,
    channel: "payment_page",
    sender: {
      name: payment.customer_name,
      email: payment.customer_email,
      phone: payment.customer_phone,
    },
    receiver: {
      user_id: payment.user_id,
      payment_page_id: payment.payment_page_id,
    },
    external_response: {
      nomba_transaction_id: transactionId,
      payment_method: "card",
    },
  });

  if (txError) {
    console.error("Failed to create transaction:", txError);
  }

  console.log("✅ Payment processing completed!");
}