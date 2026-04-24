import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    console.log("====== Payment Page Callback Received ======");
    
    const searchParams = request.nextUrl.searchParams;
    const orderReference = searchParams.get("orderReference");
    const status = searchParams.get("status");
    const transactionId = searchParams.get("transactionId");
    const paymentReference = searchParams.get("paymentReference");

    console.log("Callback params:", {
      orderReference,
      status,
      transactionId,
      paymentReference,
    });

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*, users(email, full_name))")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", orderReference);
      // Redirect to error page
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed`
      );
    }

    // Check if payment is already completed
    if (payment.status === "completed") {
      console.log("Payment already completed, redirecting to success page");
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    }

    // Handle different statuses
    if (status === "successful" || status === "success") {
      console.log("✅ Payment successful, processing...");
      
      // Update payment record
      const { error: updateError } = await supabase
        .from("payment_page_payments")
        .update({
          status: "completed",
          nomba_transaction_id: transactionId || paymentReference,
          payment_method: "card",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update payment:", updateError);
        return NextResponse.redirect(
          `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed`
        );
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
          callback_status: status,
        },
      });

      if (txError) {
        console.error("Failed to create transaction:", txError);
      }

      // Redirect to success page
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    } else {
      // Payment failed
      console.log("❌ Payment failed:", status);
      
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

      // Redirect to failure page
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=failed&reason=${status}`
      );
    }
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/payment-page/status?reference=unknown&status=error`
    );
  }
}

// Also handle POST requests (some payment gateways use POST)
export async function POST(request: NextRequest) {
  try {
    console.log("====== Payment Page POST Callback Received ======");
    
    const body = await request.json();
    console.log("Callback body:", body);

    const orderReference = body.orderReference || body.order_reference;
    const status = body.status || body.paymentStatus;
    const transactionId = body.transactionId || body.transaction_id || body.paymentReference;

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", orderReference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if payment is already completed
    if (payment.status === "completed") {
      console.log("Payment already completed");
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // Handle successful payment
    if (status === "successful" || status === "success") {
      console.log("✅ Payment successful, processing...");
      
      // Update payment record
      await supabase
        .from("payment_page_payments")
        .update({
          status: "completed",
          nomba_transaction_id: transactionId,
          payment_method: "card",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Credit the page balance
      const pageCreditAmount = payment.net_amount;
      await supabase.rpc("increment_page_balance", {
        p_page_id: payment.payment_page_id,
        p_amount: pageCreditAmount,
      });

      // Create transaction record
      await supabase.from("transactions").insert({
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
      });

      return NextResponse.json({ success: true, message: "Payment processed" });
    } else {
      // Payment failed
      console.log("❌ Payment failed:", status);
      
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

      return NextResponse.json({ success: false, message: "Payment failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}