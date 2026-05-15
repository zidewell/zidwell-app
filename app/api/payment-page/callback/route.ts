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
    console.log("Full URL:", request.url);
    
    const searchParams = request.nextUrl.searchParams;
    
    // Log ALL parameters received
    console.log("All query parameters:", Object.fromEntries(searchParams.entries()));
    
    // Try multiple possible parameter names from Nomba
    let orderReference = 
      searchParams.get("orderReference") || 
      searchParams.get("order_reference") || 
      searchParams.get("reference") ||
      searchParams.get("orderRef") ||
      searchParams.get("tx_ref") ||
      searchParams.get("transaction_reference") ||
      searchParams.get("merchantTxRef") ||
      searchParams.get("tx_ref");
    
    let status = 
      searchParams.get("status") || 
      searchParams.get("paymentStatus") ||
      searchParams.get("event_type") ||
      searchParams.get("state") ||
      searchParams.get("code");
    
    let transactionId = 
      searchParams.get("transactionId") || 
      searchParams.get("transaction_id") || 
      searchParams.get("reference") ||
      searchParams.get("id") ||
      searchParams.get("nomba_transaction_id") ||
      searchParams.get("paymentReference");
    
    // Check if parameters are in the URL fragment (after #)
    if (!orderReference && request.url.includes("#")) {
      const fragment = request.url.split("#")[1];
      console.log("Fragment found:", fragment);
      const fragmentParams = new URLSearchParams(fragment);
      orderReference = fragmentParams.get("orderReference") || fragmentParams.get("order_reference");
      status = fragmentParams.get("status");
      transactionId = fragmentParams.get("transactionId");
    }

    console.log("Extracted params:", {
      orderReference,
      status,
      transactionId,
    });

    // If still no orderReference, try to get from cookies or session
    if (!orderReference) {
      console.error("No orderReference found in callback");
      
      // Try to get from the request body (for POST-style redirects)
      // But we're in GET, so maybe we need to check referrer or other headers
      console.log("Headers:", Object.fromEntries(request.headers.entries()));
      
      // Fallback: redirect to processing page with generic message
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?status=processing&message=Payment+is+being+processed`
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
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=processing&message=Payment+still+processing`
      );
    }

    // If payment is already completed
    if (payment.status === "completed") {
      console.log("Payment already completed, redirecting to success page");
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    }

    // If payment is failed
    if (payment.status === "failed") {
      console.log("Payment failed, redirecting to failure page");
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed`
      );
    }

    // If we have status from callback
    if (status === "successful" || status === "success" || status === "completed" || status === "payment_success" || status === "00") {
      console.log("✅ Payment successful via callback, processing...");
      
      // Process the successful payment
      await processSuccessfulPayment(payment, transactionId);
      
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    } else if (status === "failed" || status === "error" || status === "cancelled" || status === "payment_failed" || status === "01") {
      console.log("❌ Payment failed via callback");
      
      await supabase
        .from("payment_page_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            failure_reason: status,
            failure_transaction_id: transactionId,
            failure_time: new Date().toISOString(),
          },
        })
        .eq("id", payment.id);
      
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed&reason=${status}`
      );
    }

    // No status provided or still processing, show processing page
    console.log("No status provided or still processing, showing processing page");
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?reference=${orderReference}&status=processing`
    );
    
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?status=error&message=${encodeURIComponent(error.message || "Unknown error")}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("====== Payment Page Callback Received (POST) ======");
    
    let body;
    let contentType = request.headers.get("content-type") || "";
    
    console.log("Content-Type:", contentType);
    
    // Try to parse as JSON first
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
        console.log("JSON body received:", JSON.stringify(body, null, 2));
      } catch (e) {
        console.log("Failed to parse JSON, trying form data...");
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
        console.log("Form data:", body);
      }
    } else {
      // Try form data
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      console.log("Form data:", body);
    }

    // Try to extract data from various possible formats
    let orderReference = 
      body.orderReference || 
      body.order_reference || 
      body.reference ||
      body.orderRef ||
      body.tx_ref ||
      body.transaction_reference ||
      body.merchantTxRef;
    
    let status = 
      body.status || 
      body.paymentStatus || 
      body.event_type ||
      body.state ||
      body.code;
    
    let transactionId = 
      body.transactionId || 
      body.transaction_id || 
      body.id || 
      body.reference ||
      body.nomba_transaction_id ||
      body.paymentReference;
    
    // Handle Nomba's specific nested format
    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.order?.reference) {
      orderReference = body.data.order.reference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }
    if (body.data?.transaction?.status) {
      status = body.data.transaction.status;
    }
    if (body.data?.status) {
      status = body.data.status;
    }
    if (body.event_type) {
      status = body.event_type;
    }
    if (body.data?.paymentReference) {
      transactionId = body.data.paymentReference;
    }
    
    // Also check for success flags
    const isSuccessFlag = 
      body.success === true || 
      body.statusCode === "00" ||
      body.statusCode === 200 ||
      body.paymentStatus === "SUCCESS";

    console.log("Extracted data:", { orderReference, status, transactionId, isSuccessFlag });

    if (!orderReference) {
      console.error("No orderReference found in POST body");
      // Return a helpful response so Nomba doesn't retry
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
    const isSuccess = 
      isSuccessFlag ||
      status === "payment_success" || 
      status === "success" || 
      status === "successful" ||
      status === "completed" ||
      status === "SUCCESS" ||
      status === "00" ||
      status === "200";

    if (isSuccess) {
      console.log("✅ Payment successful, processing...");
      await processSuccessfulPayment(payment, transactionId);
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else if (status === "payment_failed" || status === "failed" || status === "error" || status === "FAILED" || status === "01") {
      console.log("❌ Payment failed");
      await supabase
        .from("payment_page_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            failure_reason: status,
            failure_transaction_id: transactionId,
            failure_time: new Date().toISOString(),
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
  console.log("Processing successful payment:", payment.id);
  
  // Check if already processed to avoid duplicate
  if (payment.status === "completed") {
    console.log("Payment already completed, skipping processing");
    return;
  }
  
  // Update payment record
  const { error: updateError, count } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: transactionId || payment.nomba_transaction_id,
      payment_method: payment.payment_method || "card",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("Failed to update payment:", updateError);
    throw updateError;
  }

  if (!count || count === 0) {
    console.log("Payment already updated by another process");
    return;
  }

  // Check if balance was already credited
  if (!payment.balance_credited) {
    // Credit the page balance
    const pageCreditAmount = payment.net_amount || (payment.amount - (payment.fee || 0));
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
      
      // Mark balance as credited
      await supabase
        .from("payment_page_payments")
        .update({ balance_credited: true })
        .eq("id", payment.id);
    }

    // Create transaction record
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: payment.user_id,
      type: "credit",
      amount: payment.amount,
      fee: payment.fee,
      net_amount: pageCreditAmount,
      status: "success",
      reference: `PP-${payment.payment_page_id}-${transactionId || Date.now()}`,
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
    } else {
      await supabase
        .from("payment_page_payments")
        .update({ transaction_created: true })
        .eq("id", payment.id);
    }
  } else {
    console.log("Balance already credited for this payment");
  }

  // Send email receipt if not already sent
  if (payment.customer_email && !payment.customer_email_sent) {
    console.log("Sending receipt email to:", payment.customer_email);
    try {
      const { sendPaymentPageReceiptWithPDF } = await import("@/lib/generate-payment-receipts-pdf");
      const result = await sendPaymentPageReceiptWithPDF(
        payment.customer_email,
        payment.payment_pages || { title: "Payment Page" },
        payment,
        payment.customer_name,
        payment.amount,
        transactionId || payment.nomba_transaction_id || "N/A",
        payment.payment_method || "card",
        new Date().toISOString(),
        payment.metadata || {}
      );
      
      if (result.success) {
        await supabase
          .from("payment_page_payments")
          .update({ customer_email_sent: true })
          .eq("id", payment.id);
        console.log("✅ Receipt email sent and marked as sent");
      }
    } catch (error) {
      console.error("Failed to send receipt email:", error);
    }
  }

  console.log("✅ Payment processing completed!");
}