// app/api/payment-page/public/card-payment/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

// ============================================================
// ✅ FEE CONFIGURATION - Updated
// ============================================================
const FEE_CONFIG = {
  ZIDWELL_FEE_PERCENTAGE: 0.03,    // 3% Zidwell platform fee
  NOMBA_FEE_PERCENTAGE: 0.004,     // 0.4% Nomba processing fee
  TOTAL_FEE_PERCENTAGE: 0.034,     // 3.4% Total fee
  WITHDRAWAL_FEE: 0,               // ✅ FREE
};

// ============================================================
// ✅ FEE CALCULATION - Updated
// ============================================================
function calculateFees(amount: number): {
  gross: number;
  nombaFee: number;
  zidwellFee: number;
  totalFee: number;
  netAmount: number;
} {
  const nombaFee = amount * FEE_CONFIG.NOMBA_FEE_PERCENTAGE;
  const zidwellFee = amount * FEE_CONFIG.ZIDWELL_FEE_PERCENTAGE;
  const totalFee = nombaFee + zidwellFee;
  const netAmount = amount - totalFee;

  return {
    gross: amount,
    nombaFee: Math.round(nombaFee * 100) / 100,
    zidwellFee: Math.round(zidwellFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

const generateOrderReference = (pageId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const shortId = pageId.slice(-12);
  return `CARD-${shortId}-${timestamp}-${random}`;
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
      returnUrl 
    } = body;

    // Validate required fields
    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    // Calculate final amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (page.page_type === "school" && page.metadata?.feeBreakdown?.length > 0) {
        finalAmount = page.metadata.feeBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
      } else {
        finalAmount = page.price;
      }
    }

    // ✅ Calculate fees with 3% Zidwell rate
    const numberOfStudents = metadata?.numberOfStudents || 1;
    const totalForCustomer = finalAmount * numberOfStudents;
    const feeBreakdown = calculateFees(totalForCustomer);

    console.log(`💰 Card Payment Fee Breakdown (3% Zidwell):`);
    console.log(`   Gross: ₦${feeBreakdown.gross.toLocaleString()}`);
    console.log(`   Nomba Fee (0.4%): ₦${feeBreakdown.nombaFee.toLocaleString()}`);
    console.log(`   Zidwell Fee (3%): ₦${feeBreakdown.zidwellFee.toLocaleString()}`);
    console.log(`   Total Fees (3.4%): ₦${feeBreakdown.totalFee.toLocaleString()}`);
    console.log(`   Net to Merchant: ₦${feeBreakdown.netAmount.toLocaleString()}`);

    const orderReference = generateOrderReference(page.id);

    // Get store slug from metadata
    const storeSlug = page.metadata?.storeSlug || metadata?.storeSlug || '';

    // Get redirect URL
    const linkConfig = page.metadata?.linkConfig || {};
    const pageRedirectUrl = linkConfig.redirectUrl || page.metadata?.redirectUrl || null;
    
    let successRedirectUrl = returnUrl || pageRedirectUrl || `/store/${storeSlug}/${page.slug}`;
    
    if (page.page_type === "link" && pageRedirectUrl) {
      successRedirectUrl = pageRedirectUrl;
    }

    console.log(`🔗 Success redirect URL: ${successRedirectUrl}`);

    // ✅ Prepare payment record with fee breakdown
    const paymentData: any = {
      payment_page_id: page.id,
      user_id: page.user_id,
      amount: feeBreakdown.gross,
      fee: feeBreakdown.totalFee,
      nomba_fee: feeBreakdown.nombaFee,
      app_fee: feeBreakdown.zidwellFee,
      total_fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      order_reference: orderReference,
      payment_type: metadata?.isInstallment ? "installment" : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      payment_method: "card_payment",
      metadata: { 
        ...metadata, 
        storeSlug,
        redirectUrl: successRedirectUrl,
        fee_breakdown: feeBreakdown,
        fee_percentage: 3.4,
        withdrawal_fee: 0, // ✅ FREE
      },
    };

    // Add student tracking for school payments
    if (page.page_type === "school") {
      if (metadata?.selectedStudents && metadata.selectedStudents.length === 1) {
        paymentData.student_name = metadata.selectedStudents[0];
        paymentData.parent_name = metadata.parentName;
      } else if (metadata?.selectedStudents && metadata.selectedStudents.length > 1) {
        paymentData.selected_students = metadata.selectedStudents;
        paymentData.parent_name = metadata.parentName;
      }
      
      if (metadata?.isInstallment) {
        paymentData.installment_number = metadata.currentInstallment || 1;
        paymentData.total_installments = metadata.totalInstallments;
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Get Nomba token
    const accessToken = await getNombaToken();
    if (!accessToken) {
      await supabase.from("payment_page_payments").update({ status: "failed" }).eq("id", payment.id);
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    const sessionId = `${payment.id}_${Date.now()}`;

    // Build callback URL
    const callbackUrl = `${baseUrl}/payment/callback?session_id=${sessionId}`;

    // Create checkout
    const checkoutPayload = {
      order: {
        callbackUrl: callbackUrl,
        customerEmail: customerEmail,
        amount: feeBreakdown.gross.toString(),
        currency: "NGN",
        orderReference: orderReference,
        customerId: page.user_id,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card"],
        metadata: {
          type: "payment_page",
          paymentPageId: page.id,
          paymentId: payment.id,
          pageSlug: pageSlug,
          storeSlug: storeSlug,
          redirectUrl: successRedirectUrl,
          fee_breakdown: feeBreakdown,
          withdrawal_fee: 0, // ✅ FREE
        },
      },
      tokenizeCard: false,
    };

    const response = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      await supabase.from("payment_page_payments").update({ status: "failed" }).eq("id", payment);
      throw new Error(data.description || "Failed to create checkout");
    }

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
      amount: feeBreakdown.gross,
      redirectUrl: successRedirectUrl,
      storeSlug: storeSlug,
      fees: feeBreakdown,
      withdrawalFee: 0, // ✅ FREE
    });
  } catch (error: any) {
    console.error("Card payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}