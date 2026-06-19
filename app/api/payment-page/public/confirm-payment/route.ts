// app/api/payment-page/public/confirm-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get base URL
const getBaseUrl = () => {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferReference, redirectUrl: customRedirectUrl } = body;

    console.log("📝 Confirm Payment Request:", { transferReference, customRedirectUrl });

    if (!transferReference) {
      return NextResponse.json({ error: "Transfer reference required" }, { status: 400 });
    }

    // FIRST: Try to find by transfer_reference (any status)
    let { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("transfer_reference", transferReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("❌ Payment not found:", paymentError);
      return NextResponse.json(
        {
          error: "Payment not found. Please make sure you've made the transfer.",
          found: false,
        },
        { status: 404 }
      );
    }

    console.log("✅ Found payment:", {
      id: payment.id,
      status: payment.status,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
    });

    // If payment is already completed, just return success with redirect
    if (payment.status === "completed") {
      console.log("✅ Payment already completed:", payment.id);
      
      const redirectUrl = getRedirectUrl(payment, customRedirectUrl);
      const { successMessage, thankYouMessage } = getMessages(payment);
      
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        message: "Payment already confirmed",
        redirectUrl: redirectUrl,
        successMessage: successMessage,
        thankYouMessage: thankYouMessage,
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: "completed",
          customer_name: payment.customer_name,
          customer_email: payment.customer_email,
          custom_fields: payment.metadata?.customFields || null,
          students: payment.metadata?.matched_students || payment.selected_students || [],
        },
      });
    }

    // If payment is pending, update it to completed
    if (payment.status === "pending") {
      console.log("🔄 Updating pending payment to completed:", payment.id);

      // Update payment status
      const { error: updateError } = await supabase
        .from("payment_page_payments")
        .update({
          status: "completed",
          confirmed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("❌ Failed to update payment:", updateError);
        return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
      }

      console.log("✅ Payment confirmed:", payment.id);

      // Credit the page balance
      const { error: balanceError } = await supabase.rpc(
        "increment_page_balance",
        {
          p_page_id: payment.payment_page_id,
          p_amount: payment.net_amount,
        }
      );

      if (balanceError) {
        console.error("❌ Failed to increment balance:", balanceError);
      } else {
        console.log(`✅ Balance incremented by ₦${payment.net_amount}`);
      }

      // Create transaction record
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: payment.user_id,
        type: "credit",
        amount: payment.amount,
        fee: payment.fee,
        net_amount: payment.net_amount,
        status: "success",
        reference: `VA-${payment.payment_page_id}-${transferReference}`,
        description: `Payment confirmed for "${payment.payment_pages?.title}" from ${payment.customer_name}`,
        channel: "payment_page_virtual_account",
        sender: {
          name: payment.customer_name,
          email: payment.customer_email,
          phone: payment.customer_phone,
          transfer_reference: transferReference,
          narration: payment.metadata?.narration,
          custom_fields: payment.metadata?.customFields || null,
          students: payment.metadata?.matched_students || payment.selected_students || [],
        },
        receiver: {
          user_id: payment.user_id,
          payment_page_id: payment.payment_page_id,
        },
      });

      if (txError) {
        console.error("❌ Failed to create transaction:", txError);
      }
    }

    // Get redirect URL and messages
    const redirectUrl = getRedirectUrl(payment, customRedirectUrl);
    const { successMessage, thankYouMessage } = getMessages(payment);

    // Get students for display
    const students = payment.metadata?.matched_students || 
                     payment.selected_students || 
                     (payment.student_name ? [payment.student_name] : []);

    return NextResponse.json({
      success: true,
      message: payment.status === "completed" ? "Payment already confirmed" : "Payment confirmed successfully",
      alreadyConfirmed: payment.status === "completed",
      redirectUrl: redirectUrl,
      successMessage: successMessage,
      thankYouMessage: thankYouMessage,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        customer_name: payment.customer_name,
        customer_email: payment.customer_email,
        custom_fields: payment.metadata?.customFields || null,
        students: students,
      },
    });
  } catch (error: any) {
    console.error("❌ Confirm payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper functions
function getRedirectUrl(payment: any, customRedirectUrl?: string): string {
  const baseUrl = getBaseUrl();
  
  // Priority: custom > linkConfig.redirectUrl > default
  if (customRedirectUrl) return customRedirectUrl;
  
  const page = payment.payment_pages;
  if (page?.page_type === "link" && page.metadata?.linkConfig?.redirectUrl) {
    return page.metadata.linkConfig.redirectUrl;
  }
  
  // For school pages or if no redirect URL, use default success page
  return `${baseUrl}/payment-success?reference=${payment.transfer_reference || payment.id}&status=success`;
}

function getMessages(payment: any): { successMessage: string; thankYouMessage: string } {
  const page = payment.payment_pages;
  let successMessage = "Payment successful! Thank you.";
  let thankYouMessage = "We've received your payment and a receipt has been sent to your email.";
  
  if (page?.page_type === "link" && page.metadata?.linkConfig) {
    const linkConfig = page.metadata.linkConfig;
    if (linkConfig.successMessage) successMessage = linkConfig.successMessage;
    if (linkConfig.thankYouMessage) thankYouMessage = linkConfig.thankYouMessage;
  }
  
  return { successMessage, thankYouMessage };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    const redirect = searchParams.get("redirect") === "true";

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("transfer_reference", reference)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({
        found: false,
        status: "not_found",
      });
    }

    if (redirect && payment.status === "completed") {
      const redirectUrl = getRedirectUrl(payment);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({
      found: true,
      status: payment.status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        customer_name: payment.customer_name,
        customer_email: payment.customer_email,
        created_at: payment.created_at,
        confirmed_at: payment.confirmed_at,
        custom_fields: payment.metadata?.customFields || null,
        students: payment.metadata?.matched_students || payment.selected_students || [],
      },
    });
  } catch (error: any) {
    console.error("Check payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}