// app/api/webhook/services/card-payment.service.ts
import { createClient } from "@supabase/supabase-js";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

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

// ============================================================
// RECORD INSTALLMENT ACCOUNT
// ============================================================
async function recordInstallmentAccount(
  payment: any,
  grossAmount: number
): Promise<any | null> {
  try {
    const { data: accountResult, error } = await supabase.rpc(
      "record_pp_installment_payment",
      {
        p_payment_id: payment.id,
        p_payment_page_id: payment.payment_page_id,
        p_user_id: payment.user_id,
        p_buyer_email: payment.customer_email?.toLowerCase() || null,
        p_buyer_phone: payment.customer_phone || null,
        p_buyer_name: payment.customer_name || null,
        p_amount_net: grossAmount,
        p_selection: {
          selectedStudents: payment.metadata?.selectedStudents || null,
          schoolFields: payment.metadata?.schoolFields || null,
          selectedVariantSku: payment.metadata?.selectedVariantSku || null,
          quantity: payment.metadata?.quantity || null,
          shippingAddress: payment.metadata?.shippingAddress || null,
          bookingDate: payment.metadata?.bookingDate || null,
          bookingTime: payment.metadata?.bookingTime || null,
          customerNote: payment.metadata?.customerNote || null,
          customFields: payment.metadata?.customFields || null,
          referenceCode: payment.metadata?.referenceCode || null,
        },
        p_total_amount:
          Number(payment.metadata?.installment_plan?.totalAmount) ||
          Number(payment.metadata?.totalAmount) ||
          Number(payment.total_amount) ||
          Number(payment.amount) ||
          0,
        p_installment_count:
          Number(payment.metadata?.installment_plan?.installmentCount) ||
          payment.total_installments ||
          null,
        p_installment_amt:
          Number(payment.metadata?.installment_plan?.installmentAmount) ||
          Number(payment.metadata?.installmentAmount) ||
          null,
        p_installment_period:
          payment.metadata?.installment_plan?.period ||
          payment.metadata?.installmentPeriod ||
          null,
        p_student_name:
          Array.isArray(payment.metadata?.selectedStudents) &&
          payment.metadata.selectedStudents.length > 0
            ? payment.metadata.selectedStudents[0]
            : payment.student_name || null,
      }
    );

    if (error) {
      console.error("Installment account failed:", error);
      return null;
    }

    if (accountResult?.account_id) {
      await supabase
        .from("payment_page_payments")
        .update({
          metadata: {
            ...payment.metadata,
            installment_account_id: accountResult.account_id,
          },
        })
        .eq("id", payment.id);
    }

    return accountResult;
  } catch (err) {
    console.error("Installment account error:", err);
    return null;
  }
}

// ============================================================
// BOOKING CONFIRMATION EMAIL
// ============================================================
async function sendBookingConfirmationEmail(
  customerEmail: string,
  customerName: string,
  pageTitle: string,
  bookingDate: string,
  bookingTime: string,
  customerNote?: string
) {
  if (!customerEmail || !customerEmail.includes("@")) return;

  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Booking confirmed - ${pageTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Booking confirmed</h2>
          <p>Hi ${customerName},</p>
          <p>Your booking for <strong>${pageTitle}</strong> is confirmed.</p>
          <p>Date: ${bookingDate}</p>
          <p>Time: ${bookingTime}</p>
          ${customerNote ? `<p>Your note: ${customerNote}</p>` : ""}
          <p style="color:#666;font-size:13px;">The merchant will contact you if anything changes.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Booking email failed:", err);
  }
}

// ============================================================
// WHATSAPP BUTTON BUILDER
// ============================================================
function buildWhatsAppButton(
  rawNumber: string | null | undefined,
  pageTitle: string
): string {
  if (!rawNumber) return "";

  const digits = String(rawNumber).replace(/\D/g, "");
  if (!digits) return "";

  // If it starts with 0, swap to +234 (Nigeria). Otherwise trust the digits.
  const normalized = digits.startsWith("0")
    ? `234${digits.slice(1)}`
    : digits;

  const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(
    `Hi, I just completed my payment for "${pageTitle}" on Zidwell.`
  )}`;

  return `
    <div style="margin: 24px 0; padding: 16px; border: 1px solid #d1fae5; border-radius: 8px; background: #ecfdf5; text-align: center;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #065f46;">Need to reach the merchant?</p>
      <a href="${waUrl}"
         style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
        Chat on WhatsApp
      </a>
      <p style="margin: 12px 0 0; color: #065f46; font-size: 13px;">Tap to message them directly.</p>
    </div>
  `;
}

// ============================================================
// COMPLETION EMAIL
// ============================================================
async function sendCompletionEmail({
  customerEmail,
  customerName,
  pageTitle,
  pageType,
  totalPaid,
  totalAmount,
  installmentCount,
  isInstallment,
  merchantName,
  merchantEmail,
  viewPlanUrl,
  downloadUrl,
  accessLink,
  studentNames,
  whatsappContactNumber,
}: {
  customerEmail: string;
  customerName: string;
  pageTitle: string;
  pageType: string;
  totalPaid: number;
  totalAmount: number;
  installmentCount: number | null;
  isInstallment: boolean;
  merchantName?: string | null;
  merchantEmail?: string | null;
  viewPlanUrl?: string | null;
  downloadUrl?: string | null;
  accessLink?: string | null;
  studentNames?: string[] | null;
  whatsappContactNumber?: string | null;
}): Promise<void> {
  if (!customerEmail || !customerEmail.includes("@")) return;

  const nextStepByType: Record<string, string> = {
    physical:
      "Your order will be shipped shortly. The merchant will contact you with tracking details.",
    digital:
      "Your download link is below. You can also access it any time from the product page.",
    services: "The merchant will contact you to confirm your appointment.",
    real_estate:
      "The merchant will contact you to finalize the paperwork and handover.",
    stock: "Your investment certificate will be issued by the merchant.",
    savings: "Your plan is complete. The merchant will process your payout.",
    crypto: "The merchant will confirm the final transfer of your assets.",
    school:
      "Your child's fees are fully paid. Contact the school for any receipts you need.",
    donation: "Thank you for your donation. A final receipt was sent to you.",
    link: "The merchant has been notified and will contact you if needed.",
  };

  const nextStep =
    nextStepByType[pageType] ||
    "The merchant has been notified and will contact you if needed.";

  const installmentLine =
    isInstallment && installmentCount && installmentCount > 1
      ? `<p>All ${installmentCount} installments paid.</p>`
      : "";

  const merchantLine =
    merchantName || merchantEmail
      ? `<p style="color:#666;font-size:13px;">
           Questions? Contact
           ${merchantName ? `<strong>${merchantName}</strong>` : "the merchant"}
           ${
             merchantEmail
               ? `at <a href="mailto:${merchantEmail}">${merchantEmail}</a>`
               : ""
           }.
         </p>`
      : "";

  const viewPlanLink =
    isInstallment && viewPlanUrl
      ? `<p><a href="${viewPlanUrl}">View your completed plan</a></p>`
      : "";

  const deliveryLinks: string[] = [];
  if (downloadUrl) {
    deliveryLinks.push(
      `<p style="margin: 0 0 8px;"><a href="${downloadUrl}">Download your product</a></p>`
    );
  }
  if (accessLink) {
    deliveryLinks.push(
      `<p style="margin: 0;"><a href="${accessLink}">Access your purchase</a></p>`
    );
  }

  const deliveryBlock =
    pageType === "digital" && deliveryLinks.length > 0
      ? `
        <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <p style="margin: 0 0 12px; font-weight: 600;">Your delivery</p>
          ${deliveryLinks.join("")}
        </div>
      `
      : "";

  const studentBlock =
    pageType === "school" &&
    Array.isArray(studentNames) &&
    studentNames.length > 0
      ? `
        <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <p style="margin: 0 0 8px; font-weight: 600;">Students covered by this payment</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${studentNames
              .map((n) => `<li style="margin-bottom: 4px;">${n}</li>`)
              .join("")}
          </ul>
        </div>
      `
      : "";

  const whatsappBlock = buildWhatsAppButton(whatsappContactNumber, pageTitle);

  const summaryBlock = isInstallment
    ? `
      <h3>Summary</h3>
      <p>Total paid: <strong>₦${totalPaid.toLocaleString()}</strong></p>
      <p>Plan amount: <strong>₦${totalAmount.toLocaleString()}</strong></p>
      ${installmentLine}
    `
    : `
      <h3>Summary</h3>
      <p>Amount paid: <strong>₦${totalPaid.toLocaleString()}</strong></p>
    `;

  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Payment complete - ${pageTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Payment complete</h2>
          <p>Thank you, ${customerName}. You've paid ${
            isInstallment ? "the full amount for" : "for"
          } <strong>${pageTitle}</strong>.</p>

          ${summaryBlock}

          ${studentBlock}

          ${deliveryBlock}

          ${whatsappBlock}

          <h3>What happens next</h3>
          <p>${nextStep}</p>

          ${merchantLine}
          ${viewPlanLink}

          <p style="color:#999;font-size:12px;margin-top:24px;">
            This is an automated message from Zidwell. Please do not reply.
          </p>
        </div>
      `,
    });

    console.log(`Completion email sent to ${customerEmail}`);
  } catch (err) {
    console.error("Completion email failed:", err);
  }
}

// ============================================================
// MAIN WEBHOOK HANDLER
// ============================================================
export async function processCardPaymentWebhook(
  payload: any,
  params: { nombaTransactionId: string; orderReference: string; payment: any }
): Promise<
  | { success: true; message: string; payment_id: string }
  | { error: string; status?: number }
> {
  const { nombaTransactionId, orderReference, payment } = params;

  if (payment.status === "completed") {
    return {
      success: true,
      message: "Already processed",
      payment_id: payment.id,
    };
  }

  try {
    const feeBreakdown = calculateFees(payment.amount);

    // ─── 1. Mark payment completed ───
    const { error: updateError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        nomba_transaction_id: nombaTransactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        amount: feeBreakdown.gross,
        fee: feeBreakdown.totalFee,
        nomba_fee: feeBreakdown.nombaFee,
        app_fee: feeBreakdown.zidwellFee,
        total_fee: feeBreakdown.totalFee,
        net_amount: feeBreakdown.netAmount,
        receipt_sent: false,
        installment_status:
          payment.payment_type === "installment" ? "paid" : null,
      })
      .eq("id", payment.id);

    if (updateError) {
      return { error: "Failed to update payment", status: 500 };
    }

    // ─── 3. Record the installment account ───
    const isInstallment = payment.payment_type === "installment";

    let accountResult: any | null = null;
    let account: any | null = null;
    const pageType = payment.payment_pages?.page_type || "";

    if (isInstallment || pageType === "school") {
      accountResult = await recordInstallmentAccount(
        payment,
        feeBreakdown.gross
      );

      if (accountResult?.account_id) {
        const { data: freshAccount } = await supabase
          .from("payment_page_installment_account")
          .select(
            "id, total_amount, total_paid, remaining_amount, installments_paid, installment_count, status"
          )
          .eq("id", accountResult.account_id)
          .maybeSingle();

        account = freshAccount;
        console.log("📊 Fresh account row:", account);
      }
    }

    // ─── 4. Did this payment complete the plan? ───
    const planCompleted = isInstallment
      ? account != null &&
        Number(account.total_amount) > 0 &&
        Number(account.total_paid) >= Number(account.total_amount) &&
        (Number(account.remaining_amount) <= 0 ||
          account.status === "completed")
      : true;

    if (isInstallment) {
      if (planCompleted) {
        console.log(
          `🎉 Plan COMPLETED for account ${account?.id} on page ${payment.payment_page_id}`
        );
      } else {
        console.log(
          `📊 Plan still active for account ${account?.id} — paid ₦${account?.total_paid} of ₦${account?.total_amount}`
        );
      }
    } else {
      console.log(
        `✅ One-time payment completed on page ${payment.payment_page_id}`
      );
    }

    // ─── 5. Credit store owner wallet ───
    const { error: walletError } = await supabase.rpc(
      "credit_store_owner_wallet",
      {
        p_user_id: payment.user_id,
        p_amount: feeBreakdown.netAmount,
        p_source: "payment_page",
        p_source_id: payment.payment_page_id,
        p_description: `Payment from ${payment.customer_name}`,
      }
    );

    if (walletError) {
      console.error("Wallet credit failed:", walletError);
    }

    // ─── 6. Increment page balance ───
    await supabase.rpc("increment_page_balance", {
      p_page_id: payment.payment_page_id,
      p_amount: feeBreakdown.netAmount,
    });

    // ─── 7. Transaction record with metadata ───
    const txReference = `CARD-${payment.payment_page_id}-${nombaTransactionId}`;

    const txMetadata = {
      payment_page_id: payment.payment_page_id,
      payment_page_title: payment.payment_pages?.title || null,
      payment_page_type: pageType || null,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email || null,
      customer_phone: payment.customer_phone || null,
      gross_amount: feeBreakdown.gross,
      nomba_fee: feeBreakdown.nombaFee,
      zidwell_fee: feeBreakdown.zidwellFee,
      total_fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      fee_percentage: 3.4,
      payment_method: "card",
      nomba_transaction_id: nombaTransactionId,
      order_reference: orderReference || null,
      is_installment: isInstallment,
      installment_account_id: accountResult?.account_id || null,
      plan_completed: planCompleted,
      entity_ids: payment.metadata?.entityIds || ["default"],
      received_at: new Date().toISOString(),
    };

    await supabase.from("transactions").insert({
      user_id: payment.user_id,
      type: "credit",
      amount: feeBreakdown.gross,
      fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      status: "success",
      reference: txReference,
      description: `Payment from ${payment.customer_name}`,
      channel: "payment_page_card",
      sender: {
        name: payment.customer_name,
        email: payment.customer_email,
        phone: payment.customer_phone,
      },
      receiver: {
        user_id: payment.user_id,
        payment_page_id: payment.payment_page_id,
      },
      metadata: txMetadata,
      external_response: {
        transaction_id: nombaTransactionId,
        gross_amount: feeBreakdown.gross,
        nomba_fee: feeBreakdown.nombaFee,
        app_fee: feeBreakdown.zidwellFee,
        total_fee: feeBreakdown.totalFee,
        net_amount: feeBreakdown.netAmount,
        fee_percentage: 3.4,
        payment_method: "card",
        entity_ids: payment.metadata?.entityIds || ["default"],
        is_installment: isInstallment,
        installment_account_id: accountResult?.account_id || null,
        plan_completed: planCompleted,
      },
    });

    // ─── 8. Merchant info ───
    const { data: creator } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", payment.user_id)
      .single();

    // ─── 9. Customer emails ───
    if (payment.customer_email) {
      await sendPaymentPageReceiptWithPDF(
        payment.customer_email,
        payment.payment_pages,
        payment,
        payment.customer_name,
        feeBreakdown.gross,
        nombaTransactionId,
        "card",
        new Date().toISOString(),
        {
          gross_amount: feeBreakdown.gross,
          nomba_fee: feeBreakdown.nombaFee,
          app_fee: feeBreakdown.zidwellFee,
          total_fee: feeBreakdown.totalFee,
          net_amount: feeBreakdown.netAmount,
          fee_percentage: 3.4,
          is_installment: isInstallment,
        }
      ).catch((err) => console.error("Receipt failed:", err));

      if (
        pageType === "services" &&
        planCompleted &&
        payment.metadata?.bookingDate
      ) {
        await sendBookingConfirmationEmail(
          payment.customer_email,
          payment.customer_name,
          payment.payment_pages?.title || "Your Service",
          payment.metadata.bookingDate,
          payment.metadata.bookingTime || "",
          payment.metadata.customerNote
        );
      }

      if (planCompleted) {
        const storeSlug = payment.payment_pages?.metadata?.storeSlug || "";
        const pageSlug = payment.payment_pages?.slug || "";
        const viewPlanUrl =
          isInstallment && storeSlug && pageSlug && account?.id
            ? `${baseUrl}/store/${storeSlug}/${pageSlug}?plan=${account.id}`
            : null;

        const shouldIncludeDelivery =
          pageType === "digital" &&
          payment.metadata?.emailDelivery !== false;

        const paidStudentNames: string[] =
          pageType === "school"
            ? Array.isArray(payment.metadata?.selectedStudents)
              ? payment.metadata.selectedStudents.filter(
                  (n: any) => typeof n === "string" && n.length > 0
                )
              : payment.student_name
              ? [payment.student_name]
              : []
            : [];

        // ✅ WhatsApp contact — pulled from page metadata, only if enabled
        const pageMeta = payment.payment_pages?.metadata || {};
        const whatsappContactNumber =
          pageMeta.whatsappContactEnabled === true &&
          pageMeta.whatsappContactNumber
            ? String(pageMeta.whatsappContactNumber)
            : null;

        await sendCompletionEmail({
          customerEmail: payment.customer_email,
          customerName: payment.customer_name || "Customer",
          pageTitle: payment.payment_pages?.title || "your purchase",
          pageType,
          totalPaid: isInstallment
            ? Number(account?.total_paid) || feeBreakdown.gross
            : feeBreakdown.gross,
          totalAmount: isInstallment
            ? Number(account?.total_amount) ||
              Number(payment.total_amount) ||
              feeBreakdown.gross
            : feeBreakdown.gross,
          installmentCount:
            isInstallment && account?.installment_count
              ? Number(account.installment_count)
              : null,
          isInstallment,
          merchantName: creator?.full_name || null,
          merchantEmail: creator?.email || null,
          viewPlanUrl,
          downloadUrl: shouldIncludeDelivery
            ? payment.metadata?.downloadUrl || null
            : null,
          accessLink: shouldIncludeDelivery
            ? payment.metadata?.accessLink || null
            : null,
          studentNames: paidStudentNames,
          whatsappContactNumber,
        }).catch((err) => console.error("Completion email failed:", err));
      }
    }

    // ─── 10. Merchant notification ───
    if (creator?.email) {
      try {
        const shippingLine =
          planCompleted && payment.metadata?.shippingAddress
            ? `<p>Ship to: ${payment.metadata.shippingAddress.street}, ${payment.metadata.shippingAddress.city}, ${payment.metadata.shippingAddress.state}</p>`
            : "";

        const bookingLine =
          planCompleted && payment.metadata?.bookingDate
            ? `<p>Booking: ${payment.metadata.bookingDate} at ${payment.metadata.bookingTime || ""}</p>`
            : "";

        const donorLine = payment.metadata?.donorMessage
          ? `<p>Message: ${payment.metadata.donorMessage}</p>`
          : "";

        const variantLine = payment.metadata?.selectedVariantSku
          ? `<p>Variant: ${payment.metadata.selectedVariantSku}</p>`
          : "";

        const installmentLine = isInstallment
          ? `<p>Installment: ${payment.installment_number || 1} of ${payment.total_installments || "—"}</p>`
          : "";

        const completedLine = planCompleted
          ? `<p><strong>This buyer has completed their payment${
              isInstallment ? " plan" : ""
            }.</strong></p>`
          : "";

        await transporter.sendMail({
          from: `Zidwell <${process.env.EMAIL_USER}>`,
          to: creator.email,
          subject: `Payment received - ₦${feeBreakdown.netAmount.toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Payment received</h2>
              <p>You received a payment for <strong>${payment.payment_pages?.title}</strong>.</p>
              <p>Amount: ₦${feeBreakdown.gross.toLocaleString()}</p>
              <p>Net: ₦${feeBreakdown.netAmount.toLocaleString()}</p>
              <p>Customer: ${payment.customer_name}</p>
              ${
                payment.customer_email
                  ? `<p>Email: ${payment.customer_email}</p>`
                  : ""
              }
              ${variantLine}
              ${installmentLine}
              ${
                payment.metadata?.quantity > 1
                  ? `<p>Quantity: ${payment.metadata.quantity}</p>`
                  : ""
              }
              ${shippingLine}
              ${bookingLine}
              ${donorLine}
              ${completedLine}
            </div>
          `,
        });
      } catch (err) {
        console.error("Merchant email failed:", err);
      }
    }

    return {
      success: true,
      message: "Payment processed successfully",
      payment_id: payment.id,
    };
  } catch (error: any) {
    console.error("Webhook error:", error);
    return {
      error: error.message || "Failed to process payment",
      status: 500,
    };
  }
}