// app/api/payment-page/public/card-payment/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import { computeNextDueDate } from "@/lib/installment-utils";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

const FEE_CONFIG = {
  ZIDWELL_FEE_PERCENTAGE: 0.03,
  NOMBA_FEE_PERCENTAGE: 0.004,
  TOTAL_FEE_PERCENTAGE: 0.034,
};

function calculateFees(amount: number) {
  const nombaFee = amount * FEE_CONFIG.NOMBA_FEE_PERCENTAGE;
  const zidwellFee = amount * FEE_CONFIG.ZIDWELL_FEE_PERCENTAGE;
  const totalFee = nombaFee + zidwellFee;
  return {
    gross: amount,
    nombaFee: Math.round(nombaFee * 100) / 100,
    zidwellFee: Math.round(zidwellFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    netAmount: Math.round((amount - totalFee) * 100) / 100,
    feePercentage: FEE_CONFIG.TOTAL_FEE_PERCENTAGE * 100,
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
      returnUrl,
    } = body;

    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Determine amount
    let finalAmount = Number(amount) || 0;
    if (!finalAmount) {
      if (
        page.page_type === "school" &&
        page.metadata?.feeBreakdown?.length > 0
      ) {
        finalAmount = page.metadata.feeBreakdown.reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        );
      } else {
        finalAmount = Number(page.price) || 0;
      }
    }

    if (finalAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const feeBreakdown = calculateFees(finalAmount);
    const orderReference = generateOrderReference(page.id);

    const storeSlug = page.metadata?.storeSlug || metadata?.storeSlug || "";
    const linkConfig = page.metadata?.linkConfig || {};
    const pageRedirectUrl =
      linkConfig.redirectUrl || page.metadata?.redirectUrl || null;

    let successRedirectUrl =
      returnUrl || pageRedirectUrl || `/store/${storeSlug}/${page.slug}`;

    if (page.page_type === "link" && pageRedirectUrl) {
      successRedirectUrl = pageRedirectUrl;
    }

    const isInstallment =
      metadata?.isInstallment === true ||
      (page.price_type === "installment" &&
        metadata?.paymentType === "installment");

    const totalInstallments =
      metadata?.totalInstallments ||
      metadata?.installmentCount ||
      page.installment_count ||
      1;

    const currentInstallment = metadata?.currentInstallment || 1;

    // ─── BUILD PAYMENT RECORD ───
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
      payment_type: isInstallment ? "installment" : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      payment_method: "card_payment",
      installment_number: isInstallment ? currentInstallment : null,
      total_installments: isInstallment ? totalInstallments : null,
      installment_status: isInstallment ? "pending" : null,
      next_installment_due: isInstallment
        ? computeNextDueDate(
            (metadata?.installmentPeriod || "monthly") as
              | "weekly"
              | "bi-weekly"
              | "monthly",
            currentInstallment
          )
        : null,
      metadata: {
        ...metadata,
        storeSlug,
        redirectUrl: successRedirectUrl,
        fee_breakdown: feeBreakdown,
        fee_percentage: 3.4,
        entity_ids: metadata?.entityIds || ["default"],
        installment_plan: isInstallment
          ? {
              totalAmount: metadata?.totalAmount || finalAmount,
              installmentCount: totalInstallments,
              installmentAmount: metadata?.installmentAmount,
              period: metadata?.installmentPeriod || "monthly",
            }
          : null,
      },
    };

    // School: student tracking
    if (page.page_type === "school") {
      const selectedStudents = metadata?.selectedStudents || [];
      if (selectedStudents.length === 1) {
        paymentData.student_name = selectedStudents[0];
        paymentData.parent_name = metadata?.parentName || customerName;
      } else if (selectedStudents.length > 1) {
        paymentData.selected_students = selectedStudents;
        paymentData.parent_name = metadata?.parentName || customerName;
      }
    }

    // Physical: variant + shipping
    if (page.page_type === "physical") {
      if (metadata?.selectedVariantSku) {
        paymentData.metadata.selectedVariantSku = metadata.selectedVariantSku;
      }
      if (metadata?.shippingAddress) {
        paymentData.metadata.shippingAddress = metadata.shippingAddress;
      }
    }

    // Services: booking + note
    if (page.page_type === "services") {
      if (metadata?.bookingDate) {
        paymentData.metadata.bookingDate = metadata.bookingDate;
      }
      if (metadata?.bookingTime) {
        paymentData.metadata.bookingTime = metadata.bookingTime;
      }
      if (metadata?.customerNote) {
        paymentData.metadata.customerNote = metadata.customerNote;
      }
    }

    // Digital: delivery info
    if (page.page_type === "digital") {
      paymentData.metadata.emailDelivery = metadata?.emailDelivery !== false;
      paymentData.metadata.downloadUrl = metadata?.downloadUrl || null;
      paymentData.metadata.accessLink = metadata?.accessLink || null;
    }

    // Donation: message
    if (page.page_type === "donation" && metadata?.donorMessage) {
      paymentData.metadata.donorMessage = metadata.donorMessage;
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

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

    const sessionId = `${payment.id}_${Date.now()}`;
    const callbackUrl = `${baseUrl}/payment/callback?session_id=${sessionId}`;

    const checkoutPayload = {
      order: {
        callbackUrl,
        customerEmail,
        amount: feeBreakdown.gross.toString(),
        currency: "NGN",
        orderReference,
        customerId: page.user_id,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card"],
        metadata: {
          type: "payment_page",
          paymentPageId: page.id,
          paymentId: payment.id,
          pageSlug,
          storeSlug,
          redirectUrl: successRedirectUrl,
          fee_breakdown: feeBreakdown,
          isInstallment,
          entityIds: metadata?.entityIds || ["default"],
        },
      },
      tokenizeCard: false,
    };

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

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      throw new Error(data.description || "Failed to create checkout");
    }

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference,
      amount: feeBreakdown.gross,
      redirectUrl: successRedirectUrl,
      storeSlug,
      fees: feeBreakdown,
      isInstallment,
    });
  } catch (error: any) {
    console.error("Card payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}