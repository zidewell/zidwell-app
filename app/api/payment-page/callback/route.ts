import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

async function sendPaymentNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  paymentMethod: string
) {
  const { transporter } = await import("@/lib/node-mailer");
  const headerImageUrl = `${baseUrl}/zidwell-header.png`;
  const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

  await transporter.sendMail({
    from: `Zidwell <${process.env.EMAIL_USER}>`,
    to: creatorEmail,
    subject: `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
        <h3 style="color: #22c55e;">✅ Payment Received!</h3>
        <p>You've received a payment for <strong>${pageTitle}</strong>.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod === "card" ? "Card Payment" : "Bank Transfer"}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
        </div>
        <p>Funds have been added to your page balance.</p>
        <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
      </div>
    `,
  });
}

async function processSuccessfulPayment(payment: any, transactionId?: string) {
  const paymentMethod = payment.payment_method || "card";

  // Update payment record
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: transactionId,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      receipt_sent: false,
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
    }
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
    reference: `PP-${payment.payment_page_id}-${transactionId || payment.order_reference}`,
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
      transaction_id: transactionId,
      payment_method: paymentMethod,
    },
  });

  if (txError) {
    console.error("Failed to create transaction:", txError);
  }

  // Send receipt to customer
  if (payment.customer_email && !payment.receipt_sent) {
    await sendPaymentPageReceiptWithPDF(
      payment.customer_email,
      payment.payment_pages,
      payment,
      payment.customer_name,
      payment.amount,
      transactionId || payment.order_reference,
      paymentMethod,
      new Date().toISOString(),
      payment.metadata
    ).catch(console.error);
    
    await supabase
      .from("payment_page_payments")
      .update({ receipt_sent: true })
      .eq("id", payment.id);
  }

  // Send notification to page creator
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", payment.user_id)
    .single();

  if (creator?.email) {
    await sendPaymentNotificationEmail(
      creator.email,
      payment.payment_pages?.title || "Payment Page",
      payment.amount,
      payment.customer_name,
      payment.customer_email,
      paymentMethod
    ).catch(console.error);
  }

  console.log("✅ Payment processing completed!");
}

export async function GET(request: NextRequest) {
  try {
    console.log("====== Payment Page Callback Received (GET) ======");
    
    const searchParams = request.nextUrl.searchParams;
    const orderReference = searchParams.get("orderReference") || searchParams.get("order_reference");
    const status = searchParams.get("status") || searchParams.get("paymentStatus");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id") || searchParams.get("reference");

    if (!orderReference) {
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?status=error&message=Missing+order+reference`
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=processing`
      );
    }

    if (payment.status === "completed") {
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    }

    if (status === "successful" || status === "success" || status === "completed") {
      await processSuccessfulPayment(payment, transactionId);
      return NextResponse.redirect(
        `${baseUrl}/payment-page/status?reference=${orderReference}&status=success`
      );
    } else if (status === "failed" || status === "error" || status === "cancelled") {
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

    let orderReference = body.orderReference || body.order_reference || body.reference;
    let status = body.status || body.paymentStatus || body.event_type;
    let transactionId = body.transactionId || body.transaction_id || body.id || body.reference;
    
    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }
    if (body.event_type) {
      status = body.event_type;
    }

    if (!orderReference) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const isSuccess = status === "payment_success" || 
                     status === "success" || 
                     status === "successful" ||
                     status === "completed";

    if (isSuccess) {
      await processSuccessfulPayment(payment, transactionId);
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else if (status === "payment_failed" || status === "failed" || status === "error") {
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

    return NextResponse.json({ success: true, message: "Payment processing" });
  } catch (error: any) {
    console.error("POST callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}