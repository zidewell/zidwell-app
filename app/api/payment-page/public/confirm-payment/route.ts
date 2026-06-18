// app/api/payment-page/public/confirm-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferReference } = body;

    console.log("📝 Confirm Payment Request:", { transferReference });

    if (!transferReference) {
      return NextResponse.json({ error: "Transfer reference required" }, { status: 400 });
    }

    // Find the pending payment by transfer reference
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*, payment_pages(*)")
      .eq("transfer_reference", transferReference)
      .eq("status", "pending")
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("❌ Payment not found:", paymentError);
      return NextResponse.json({ 
        error: "Payment not found or already processed",
        found: false 
      }, { status: 404 });
    }

    console.log("✅ Found pending payment:", {
      id: payment.id,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      metadata: payment.metadata,
    });

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
      },
      receiver: {
        user_id: payment.user_id,
        payment_page_id: payment.payment_page_id,
      },
    });

    if (txError) {
      console.error("❌ Failed to create transaction:", txError);
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: "completed",
        customer_name: payment.customer_name,
        customer_email: payment.customer_email,
        custom_fields: payment.metadata?.customFields || null,
      },
    });
  } catch (error: any) {
    console.error("❌ Confirm payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

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
        status: "not_found" 
      });
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
      },
    });
  } catch (error: any) {
    console.error("Check payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}