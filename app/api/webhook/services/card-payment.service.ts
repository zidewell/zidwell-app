import { createClient } from "@supabase/supabase-js";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

// ============================================================
// ✅ FEE CONFIGURATION - 3% Zidwell fee
// ============================================================
const FEE_CONFIG = {
  ZIDWELL_FEE_PERCENTAGE: 0.03,    // 3% Zidwell platform fee
  NOMBA_FEE_PERCENTAGE: 0.004,     // 0.4% Nomba processing fee
  TOTAL_FEE_PERCENTAGE: 0.034,     // 3.4% Total fee
};

function calculateFees(amount: number): {
  gross: number;
  nombaFee: number;
  zidwellFee: number;
  totalFee: number;
  netAmount: number;
  feePercentage: number;
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
    feePercentage: FEE_CONFIG.TOTAL_FEE_PERCENTAGE * 100,
  };
}

interface CardPaymentWebhookParams {
  nombaTransactionId: string;
  orderReference: string;
  payment: any;
}

export async function processCardPaymentWebhook(
  payload: any,
  params: CardPaymentWebhookParams
): Promise<{ success: true; message: string; payment_id: string } | { error: string; status?: number }> {
  const { nombaTransactionId, orderReference, payment } = params;

  console.log("💳 ========== PROCESSING CARD PAYMENT WEBHOOK ==========");
  console.log("Transaction ID:", nombaTransactionId);
  console.log("Order Reference:", orderReference);
  console.log("Payment ID:", payment.id);

  if (payment.status === "completed") {
    console.log("⏭️ Payment already completed");
    return { success: true, message: "Already processed", payment_id: payment.id };
  }

  try {
    // ✅ Calculate fees with 3% Zidwell rate
    const feeBreakdown = calculateFees(payment.amount);

    console.log(`💰 Fee Breakdown (3% Zidwell):`);
    console.log(`   Gross: ₦${feeBreakdown.gross.toLocaleString()}`);
    console.log(`   Nomba Fee (0.4%): -₦${feeBreakdown.nombaFee.toLocaleString()}`);
    console.log(`   Zidwell Fee (3%): -₦${feeBreakdown.zidwellFee.toLocaleString()}`);
    console.log(`   Total Fees (3.4%): -₦${feeBreakdown.totalFee.toLocaleString()}`);
    console.log(`   Net: ₦${feeBreakdown.netAmount.toLocaleString()}`);

    // ✅ Update payment status with fee breakdown
    const { error: updateError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        nomba_transaction_id: nombaTransactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        receipt_sent: false,
        // ✅ Updated fee fields
        amount: feeBreakdown.gross,
        fee: feeBreakdown.totalFee,
        nomba_fee: feeBreakdown.nombaFee,
        app_fee: feeBreakdown.zidwellFee,  // ✅ 3% Zidwell fee
        total_fee: feeBreakdown.totalFee,
        net_amount: feeBreakdown.netAmount,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { error: "Failed to update payment", status: 500 };
    }

    console.log("✅ Payment updated to completed:", payment.id);

    // ✅ Credit the store owner wallet with net amount
    const { error: walletError } = await supabase.rpc(
      "credit_store_owner_wallet",
      {
        p_user_id: payment.user_id,
        p_amount: feeBreakdown.netAmount,
        p_source: "payment_page",
        p_source_id: payment.payment_page_id,
        p_description: `Card payment from ${payment.customer_name} (3% Zidwell fee)`,
      }
    );

    if (walletError) {
      console.error("❌ Failed to credit store wallet:", walletError);
    } else {
      console.log(`✅ Credited ₦${feeBreakdown.netAmount.toLocaleString()} to store wallet`);
    }

    // ✅ Also update page balance for tracking
    const { error: balanceError } = await supabase.rpc(
      "increment_page_balance",
      {
        p_page_id: payment.payment_page_id,
        p_amount: feeBreakdown.netAmount,
      }
    );

    if (balanceError) {
      console.error("Failed to increment balance:", balanceError);
    }

    // ✅ Create transaction record with fee breakdown
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: payment.user_id,
      type: "credit",
      amount: feeBreakdown.gross,
      fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      status: "success",
      reference: `CARD-${payment.payment_page_id}-${nombaTransactionId}`,
      description: `Card payment for "${payment.payment_pages?.title}" from ${payment.customer_name}`,
      channel: "payment_page_card",
      sender: {
        name: payment.customer_name,
        email: payment.customer_email,
        phone: payment.customer_phone,
        order_reference: orderReference,
      },
      receiver: {
        user_id: payment.user_id,
        payment_page_id: payment.payment_page_id,
      },
      external_response: {
        transaction_id: nombaTransactionId,
        payment_method: "card",
        order_reference: orderReference,
        gross_amount: feeBreakdown.gross,
        nomba_fee: feeBreakdown.nombaFee,
        app_fee: feeBreakdown.zidwellFee,
        total_fee: feeBreakdown.totalFee,
        net_amount: feeBreakdown.netAmount,
        fee_percentage: 3.4,
      },
    });

    if (txError) {
      console.error("Failed to create transaction:", txError);
    }

    // Send receipt to customer
    if (payment.customer_email) {
      console.log(`📧 Sending receipt to: ${payment.customer_email}`);
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
          ...payment.metadata,
          gross_amount: feeBreakdown.gross,
          nomba_fee: feeBreakdown.nombaFee,
          app_fee: feeBreakdown.zidwellFee,
          total_fee: feeBreakdown.totalFee,
          net_amount: feeBreakdown.netAmount,
          fee_percentage: 3.4,
        }
      ).catch(err => console.error("Failed to send receipt:", err));

      await supabase
        .from("payment_page_payments")
        .update({ receipt_sent: true })
        .eq("id", payment.id);
      
      console.log(`✅ Receipt sent to ${payment.customer_email}`);
    }

    // Send notification to page creator
    const { data: creator } = await supabase
      .from("users")
      .select("email")
      .eq("id", payment.user_id)
      .single();

    if (creator?.email) {
      const { transporter } = await import("@/lib/node-mailer");
      try {
        await transporter.sendMail({
          from: `Zidwell <${process.env.EMAIL_USER}>`,
          to: creator.email,
          subject: `💰 Card Payment Received for "${payment.payment_pages?.title}" - ₦${feeBreakdown.netAmount.toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <img src="${baseUrl}/zidwell-header.png" style="width: 100%; margin-bottom: 20px;" />
              <h3 style="color: #22c55e;">✅ Card Payment Received!</h3>
              <p>You've received a card payment for <strong>${payment.payment_pages?.title}</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><strong>Amount:</strong> ₦${feeBreakdown.gross.toLocaleString()}</p>
                <p><strong>Nomba Fee (0.4%):</strong> -₦${feeBreakdown.nombaFee.toLocaleString()}</p>
                <p><strong>Zidwell Fee (3%):</strong> -₦${feeBreakdown.zidwellFee.toLocaleString()}</p>
                <p><strong>Total Fees:</strong> -₦${feeBreakdown.totalFee.toLocaleString()}</p>
                <p><strong>Net Credited:</strong> ₦${feeBreakdown.netAmount.toLocaleString()}</p>
                <p><strong>Customer:</strong> ${payment.customer_name}</p>
                <p><strong>Email:</strong> ${payment.customer_email}</p>
              </div>
              <p>Funds have been added to your store wallet after 3.4% fee deduction.</p>
              <img src="${baseUrl}/zidwell-footer.png" style="width: 100%; margin-top: 20px;" />
            </div>
          `,
        });
        console.log(`✅ Notification sent to creator: ${creator.email}`);
      } catch (err) {
        console.error("Failed to send creator notification:", err);
      }
    }

    console.log("🎉 ========== CARD PAYMENT PROCESSING COMPLETED ==========");
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Gross: ₦${feeBreakdown.gross.toLocaleString()}`);
    console.log(`   Nomba Fee (0.4%): ₦${feeBreakdown.nombaFee.toLocaleString()}`);
    console.log(`   Zidwell Fee (3%): ₦${feeBreakdown.zidwellFee.toLocaleString()}`);
    console.log(`   Net: ₦${feeBreakdown.netAmount.toLocaleString()}`);
    console.log(`   Customer: ${payment.customer_name} (${payment.customer_email})`);

    return {
      success: true,
      message: "Card payment processed successfully",
      payment_id: payment.id,
    };
  } catch (error: any) {
    console.error("Error processing card payment:", error);
    return { error: error.message || "Failed to process card payment", status: 500 };
  }
}