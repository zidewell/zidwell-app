// app/api/payment-page/public/card-payment/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeNextDueDate } from "@/lib/installment-utils";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

// ─── FEE CONFIG ───
// Zidwell takes 3%. Processor fee uses Paystack NG formula:
//   min(1.5% * amount + ₦100, ₦2,000)
// The DB column is still named `nomba_fee` (cosmetic — it holds the
// processor fee regardless of provider).
const ZIDWELL_FEE_PERCENTAGE = 0.03;

function calculatePaystackFee(amountNaira: number): number {
  const fee = 0.015 * amountNaira + 100;
  return Math.min(fee, 2000);
}

function calculateFees(amount: number) {
  const nombaFee = calculatePaystackFee(amount);
  const zidwellFee = amount * ZIDWELL_FEE_PERCENTAGE;
  const totalFee = nombaFee + zidwellFee;
  return {
    gross: amount,
    nombaFee: Math.round(nombaFee * 100) / 100,
    zidwellFee: Math.round(zidwellFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    netAmount: Math.round((amount - totalFee) * 100) / 100,
    feePercentage:
      amount > 0 ? Math.round((totalFee / amount) * 10000) / 100 : 0,
  };
}

const generateOrderReference = (pageId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const shortId = pageId.slice(-12);
  // Paystack reference rules: alphanumeric + `-`, `.`, `=`. This is safe.
  return `CARD-${shortId}-${timestamp}-${random}`;
};

function parseMetadata(raw: any): any {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

async function getSoldUnitsForVariant(
  pageId: string,
  variantSku: string
): Promise<number> {
  const { data: payments, error } = await supabase
    .from("payment_page_payments")
    .select("metadata")
    .eq("payment_page_id", pageId)
    .eq("status", "completed");

  if (error) {
    console.error("[card-payment] Failed to load payments:", error);
    throw new Error("Could not verify stock");
  }

  let sold = 0;
  for (const p of payments || []) {
    const m = parseMetadata((p as any).metadata);
    if (
      m?.pageType === "physical" &&
      String(m?.selectedVariantSku) === String(variantSku)
    ) {
      sold += Math.max(1, Number(m?.quantity) || 1);
    }
  }
  return sold;
}

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

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("[card-payment] PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 503 }
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

    const pageMetadata = parseMetadata(page.metadata);

    // ─────────────────────────────────────────────────────────────────
    // ✅ VARIANT STOCK GUARD — physical products only
    // ─────────────────────────────────────────────────────────────────
    if (page.page_type === "physical" && metadata?.selectedVariantSku) {
      const selectedVariantSku = String(metadata.selectedVariantSku);
      const variants = Array.isArray(pageMetadata?.variants)
        ? pageMetadata.variants
        : [];

      const variant = variants.find(
        (v: any) => (v?.sku || v?.name) === selectedVariantSku
      );

      if (!variant) {
        return NextResponse.json(
          {
            error:
              "This variant is no longer available. Please pick another.",
            code: "VARIANT_NOT_FOUND",
          },
          { status: 409 }
        );
      }

      const rawStock = variant.stock;
      const isUnlimitedStock = rawStock == null || rawStock === "";
      const declaredStock = isUnlimitedStock ? 0 : Number(rawStock);
      const hasRealStock = !isUnlimitedStock && Number.isFinite(declaredStock);

      if (hasRealStock) {
        const requestedQty = Math.max(1, Number(metadata?.quantity) || 1);

        let sold = 0;
        try {
          sold = await getSoldUnitsForVariant(page.id, selectedVariantSku);
        } catch {
          return NextResponse.json(
            {
              error: "Could not verify stock right now. Please try again.",
              code: "STOCK_CHECK_FAILED",
            },
            { status: 500 }
          );
        }

        const remaining = declaredStock - sold;

        if (remaining <= 0) {
          return NextResponse.json(
            {
              error:
                "This variant just sold out. Please pick another variant.",
              code: "VARIANT_OUT_OF_STOCK",
              remaining: 0,
            },
            { status: 409 }
          );
        }

        if (requestedQty > remaining) {
          return NextResponse.json(
            {
              error: `Only ${remaining} left in stock for this variant.`,
              code: "INSUFFICIENT_STOCK",
              remaining,
            },
            { status: 409 }
          );
        }
      }
    }

    // ─── Determine amount ───
    let finalAmount = Number(amount) || 0;
    if (!finalAmount) {
      if (
        page.page_type === "school" &&
        pageMetadata?.feeBreakdown?.length > 0
      ) {
        finalAmount = pageMetadata.feeBreakdown.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
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

    const storeSlug =
      pageMetadata?.storeSlug || metadata?.storeSlug || "";
    const linkConfig = pageMetadata?.linkConfig || {};
    const pageRedirectUrl =
      linkConfig.redirectUrl || pageMetadata?.redirectUrl || null;

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
        fee_percentage: feeBreakdown.feePercentage,
        provider: "paystack",
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

    if (page.page_type === "physical") {
      if (metadata?.selectedVariantSku) {
        paymentData.metadata.selectedVariantSku =
          metadata.selectedVariantSku;
      }
      if (metadata?.shippingAddress) {
        paymentData.metadata.shippingAddress = metadata.shippingAddress;
      }
      paymentData.metadata.quantity = Math.max(
        1,
        Number(metadata?.quantity) || 1
      );
    }

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

    if (page.page_type === "digital") {
      paymentData.metadata.emailDelivery = metadata?.emailDelivery !== false;
      paymentData.metadata.downloadUrl = metadata?.downloadUrl || null;
      paymentData.metadata.accessLink = metadata?.accessLink || null;
    }

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

    // ─────────────────────────────────────────────────────────────────
    // ✅ PAYSTACK INITIALIZE
    // ─────────────────────────────────────────────────────────────────
    const paystackPayload = {
      email: customerEmail,
      amount: Math.round(feeBreakdown.gross * 100), // kobo
      currency: "NGN",
      reference: orderReference,
      callback_url: `${baseUrl}/api/payment-page/callback?reference=${orderReference}`,
      // Card + Bank Transfer only (matches old Nomba channels)
      channels: ["card", "bank_transfer"],
      metadata: {
        type: "payment_page",
        paymentPageId: page.id,
        paymentId: payment.id,
        pageSlug,
        storeSlug,
        redirectUrl: successRedirectUrl,
        isInstallment,
        entityIds: metadata?.entityIds || ["default"],
        selectedVariantSku: metadata?.selectedVariantSku || null,
        // Custom fields (for link pages)
        customFields: metadata?.customFields || null,
        referenceCode: metadata?.referenceCode || null,
        // School
        selectedStudents: metadata?.selectedStudents || null,
        parentName: metadata?.parentName || null,
        // Physical
        quantity: metadata?.quantity || null,
        shippingAddress: metadata?.shippingAddress || null,
        // Services
        bookingDate: metadata?.bookingDate || null,
        bookingTime: metadata?.bookingTime || null,
        customerNote: metadata?.customerNote || null,
        // Installment details
        installmentPlan: isInstallment
          ? {
              totalAmount: metadata?.totalAmount || finalAmount,
              installmentCount: totalInstallments,
              installmentAmount: metadata?.installmentAmount,
              period: metadata?.installmentPeriod || "monthly",
            }
          : null,
      },
    };

    console.log("[card-payment] 📤 Paystack init:", {
      reference: orderReference,
      amount_kobo: paystackPayload.amount,
      email: customerEmail,
    });

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    );

    const data = await response.json();

    console.log("[card-payment] 📥 Paystack response:", {
      status: data?.status,
      message: data?.message,
      reference: data?.data?.reference,
    });

    if (!response.ok || !data?.status) {
      await supabase
        .from("payment_page_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      throw new Error(
        data?.message || "Failed to initialize Paystack transaction"
      );
    }

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.authorization_url,
      orderReference,
      amount: feeBreakdown.gross,
      redirectUrl: successRedirectUrl,
      storeSlug,
      fees: feeBreakdown,
      isInstallment,
    });
  } catch (error: any) {
    console.error("[card-payment] ❌ Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}