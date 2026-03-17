// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import {
  sendInvoiceCreatorNotification,
  sendPaymentSuccessEmail,
} from "@/lib/invoice-email-confirmation";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

// ==================== HELPER FUNCTIONS ====================

async function updateInvoiceTotals(invoice: any, paidAmountNaira: number) {
  try {
    const paidAmount = paidAmountNaira;
    const targetQty = Number(invoice.target_quantity || 1);
    const totalAmount = Number(invoice.total_amount || 0);
    const currentPaidAmount = Number(invoice.paid_amount || 0);
    const currentPaidQty = Number(invoice.paid_quantity || 0);

    let newPaidAmount = currentPaidAmount + paidAmount;
    let newPaidQuantity = currentPaidQty;
    let newStatus = invoice.status;

    if (invoice.allow_multiple_payments) {
      const quantityPaidSoFar = Math.floor(newPaidAmount / totalAmount);
      if (quantityPaidSoFar > currentPaidQty) {
        newPaidQuantity = quantityPaidSoFar;
      }
      if (newPaidQuantity >= targetQty) {
        newStatus = "paid";
      } else if (newPaidQuantity > 0 || newPaidAmount > 0) {
        newStatus = "partially_paid";
      }
    } else {
      if (newPaidAmount >= totalAmount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partially_paid";
      }
    }

    const updateData: any = {
      paid_amount: newPaidAmount,
      paid_quantity: newPaidQuantity,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
      throw updateError;
    }

    return { newPaidAmount, newPaidQuantity, newStatus };
  } catch (error) {
    console.error("Error in updateInvoiceTotals:", error);
    throw error;
  }
}

async function sendSubscriptionConfirmationEmail(
  userId: string,
  planTier: string,
  amount: number,
  isYearly: boolean,
  paymentMethod: string,
  transactionId: string,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("User not found for subscription email:", error);
      return;
    }

    const planDisplay = planTier.charAt(0).toUpperCase() + planTier.slice(1);
    const billingPeriod = isYearly ? "Yearly" : "Monthly";
    const expiryDate = new Date();
    if (isYearly) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const features = {
      zidlite: [
        "10 Invoices",
        "10 Receipts",
        "2 Contracts",
        "Unlimited transfers at N50 each",
        "WhatsApp support",
      ],
      growth: [
        "Unlimited Invoices & Receipts",
        "5 Contracts",
        "Bookkeeping tool",
        "Tax Calculator",
        "WhatsApp Community access",
      ],
      premium: [
        "Everything in Growth",
        "Unlimited Contracts",
        "Invoice Payment Reminders",
        "Financial Statement Preparation",
        "Tax Filing Support",
        "Priority support",
      ],
      elite: [
        "Everything in Premium",
        "Full Tax Filing Support",
        "VAT, PAYE, WHT Filing",
        "CFO-Level Guidance",
        "Annual Audit Coordination",
        "Direct WhatsApp Support",
      ],
    };

    const featureList = features[planTier as keyof typeof features] || [];

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎉 Welcome to Zidwell ${planDisplay}! Your subscription is active`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />
          
          <h2 style="color: #22c55e; text-align: center;">🎉 Subscription Activated!</h2>
          <p style="font-size: 16px;">Hi ${user.first_name || "there"},</p>
          <p style="font-size: 16px;">Thank you for subscribing to <strong>Zidwell ${planDisplay}</strong>! Your subscription is now active.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2b825b;">📋 Subscription Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0;"><strong>Plan:</strong></td><td>${planDisplay}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Billing:</strong></td><td>${billingPeriod}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td>₦${amount.toLocaleString()}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Payment Method:</strong></td><td>${paymentMethod === "card" ? "💳 Card" : "🏦 Bank Transfer"}</td></tr>
              <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td><span style="color: #22c55e;">Active</span></td></tr>
              <tr><td style="padding: 8px 0;"><strong>Renewal Date:</strong></td><td>${expiryDate.toLocaleDateString()}</td></tr>
            </table>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #2563eb;">✨ Your ${planDisplay} Features:</h3>
            <ul style="list-style-type: none; padding: 0;">
              ${featureList.map((feature) => `<li style="padding: 5px 0;">✅ ${feature}</li>`).join("")}
            </ul>
          </div>
          
          <p style="font-size: 16px;">We're excited to help you grow your business!</p>
          
          <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px; margin-bottom: 20px;" />
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Best regards,<br>
            <strong>The Zidwell Team</strong>
          </p>
        </div>
      `,
    });

    console.log(`✅ Subscription email sent to ${user.email}`);
  } catch (error) {
    console.error("Failed to send subscription email:", error);
  }
}

async function handleSubscriptionPayment(
  payload: any,
  transactionAmount: number,
  nombaTransactionId: string,
  paymentMethod: string,
) {
  console.log("💰 Processing subscription payment...");

  try {
    // Extract metadata from various possible locations
    const metadata =
      payload.data?.order?.metadata ||
      payload.data?.metadata ||
      payload.data?.order ||
      {};

    const userId =
      metadata.userId ||
      payload.data?.customer?.userId ||
      payload.data?.merchant?.userId;
    const planTier = metadata.planTier || "growth";
    const isYearly = metadata.isYearly || false;
    const orderReference = payload.data?.order?.orderReference;

    console.log("📦 Subscription details:", {
      userId,
      planTier,
      isYearly,
      paymentMethod,
      amount: transactionAmount,
    });

    if (!userId) {
      console.error("❌ No userId found for subscription");
      return { success: false, error: "No userId found" };
    }

    // Check for duplicate processing
    const { data: existingPayment } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("reference", nombaTransactionId)
      .maybeSingle();

    if (existingPayment) {
      console.log("⚠️ Duplicate subscription payment detected");
      return { success: true, message: "Already processed" };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    if (isYearly) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Deactivate any existing active subscriptions
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active");

    // Create new subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        tier: planTier,
        status: "active",
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error("❌ Failed to create subscription:", subError);
      return { success: false, error: subError.message };
    }

    console.log(`✅ Subscription created: ${subscription.id}`);

    // Update user's subscription tier
    const { error: userError } = await supabase
      .from("users")
      .update({
        subscription_tier: planTier,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (userError) {
      console.error("❌ Failed to update user subscription tier:", userError);
    }

    // Record the payment
    const { error: paymentError } = await supabase
      .from("subscription_payments")
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        amount: transactionAmount,
        payment_method: paymentMethod,
        status: "completed",
        reference: nombaTransactionId || orderReference,
        metadata: {
          tier: planTier,
          isYearly,
          orderReference,
          ...metadata,
        },
        paid_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("❌ Failed to record subscription payment:", paymentError);
    }

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "🎉 Subscription Activated",
      message: `Your ${planTier} plan has been activated! You now have access to all premium features.`,
      type: "success",
      channels: ["email", "in_app"],
    });

    // Send confirmation email (non-blocking)
    sendSubscriptionConfirmationEmail(
      userId,
      planTier,
      transactionAmount,
      isYearly,
      paymentMethod,
      nombaTransactionId || orderReference,
    ).catch(console.error);

    return {
      success: true,
      subscriptionId: subscription.id,
      planTier,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error("❌ Error in subscription payment handling:", error);
    return { success: false, error: error.message };
  }
}

async function sendVirtualAccountDepositEmail(
  userId: string,
  amount: number,
  transactionId: string,
  bankName: string,
  accountNumber: string,
  accountName: string,
  senderName: string,
  narration?: string,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) return;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `💰 Account Deposit Received - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Deposit Successful</h3>
          <p>Hi ${user.first_name || "there"},</p>
          <p>Your account has been credited with <strong>₦${amount.toLocaleString()}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Bank:</strong> ${bankName}</p>
            <p><strong>Account:</strong> ${accountNumber}</p>
            <p><strong>Sender:</strong> ${senderName}</p>
            <p><strong>Narration:</strong> ${narration || "N/A"}</p>
          </div>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send deposit email:", error);
  }
}

async function sendWithdrawalEmail(
  userId: string,
  status: "success" | "failed",
  amount: number,
  recipientName: string,
  recipientAccount: string,
  bankName: string,
  transactionId?: string,
  errorDetail?: string,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) return;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject:
        status === "success"
          ? `✅ Transfer Successful - ₦${amount.toLocaleString()}`
          : `❌ Transfer Failed - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
            ${status === "success" ? "✅ Transfer Successful" : "❌ Transfer Failed"}
          </h3>
          <p>Hi ${user.first_name || "there"},</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Recipient:</strong> ${recipientName}</p>
            <p><strong>Account:</strong> ${recipientAccount}</p>
            <p><strong>Bank:</strong> ${bankName}</p>
            ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
          </div>
          ${status === "failed" ? '<p style="color: #22c55e;">✅ Your wallet has been refunded.</p>' : ""}
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send withdrawal email:", error);
  }
}

async function sendInvoiceCreatorNotificationEmail(
  creatorEmail: string,
  invoiceId: string,
  amount: number,
  customerName: string,
  invoice: any,
) {
  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received!</h3>
          <p>You've received a payment for invoice <strong>${invoiceId}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          <p>Your wallet has been credited with the full amount.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send invoice notification:", error);
  }
}

// ==================== MAIN WEBHOOK HANDLER ====================

export async function POST(req: NextRequest) {
  try {
    console.log("====== Nomba Webhook Received ======");

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
      console.log("Event type:", payload.event_type || payload.eventType);
    } catch (err) {
      console.error("Failed to parse JSON");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify signature
    const timestamp = req.headers.get("nomba-timestamp");
    const signature =
      req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

    if (!timestamp || !signature) {
      console.warn("Missing signature headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Construct hash payload as per Nomba docs
    const hashingPayload = `${payload.event_type}:${payload.requestId}:${
      payload.data?.merchant?.userId || ""
    }:${payload.data?.merchant?.walletId || ""}:${
      payload.data?.transaction?.transactionId || ""
    }:${payload.data?.transaction?.type || ""}:${
      payload.data?.transaction?.time || ""
    }:${payload.data?.transaction?.responseCode || ""}`;

    const message = `${hashingPayload}:${timestamp}`;
    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // Timing-safe compare
    const receivedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Signature verified");

    // Extract common fields
    const eventType = payload.event_type || payload.eventType;
    const tx = payload.data?.transaction || {};
    const order = payload.data?.order || {};
    const customer = payload.data?.customer || {};

    const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
    const merchantTxRef = tx.merchantTxRef || tx.merchant_tx_ref;
    const orderReference = order.orderReference;
    const aliasAccountReference =
      tx.aliasAccountReference || tx.alias_account_reference;
    const transactionAmount = safeNum(
      tx.transactionAmount ?? tx.amount ?? order.amount ?? 0,
    );
    const txStatus = (tx.status || payload.data?.status || "")
      .toString()
      .toLowerCase();
    const transactionType = (tx.type || "").toLowerCase();

    console.log("Processing:", {
      eventType,
      amount: transactionAmount,
      reference: nombaTransactionId,
    });

    // ========== 1. SUBSCRIPTION PAYMENTS (Highest Priority) ==========
    const isSubscription =
      orderReference?.startsWith("SUB_") ||
      orderReference?.includes("SUB-") ||
      payload.data?.order?.metadata?.type === "subscription" ||
      payload.data?.order?.metadata?.isSubscription === true ||
      payload.data?.metadata?.subscription === true ||
      merchantTxRef?.includes("SUB-") ||
      tx.narration?.includes("SUB-");

    if (isSubscription) {
      console.log("📱 Subscription payment detected");

      if (eventType === "payment_success" || txStatus === "success") {
        const paymentMethod =
          transactionType.includes("vact") ||
          transactionType.includes("transfer") ||
          order.paymentMethod === "Transfer"
            ? "bank_transfer"
            : "card";

        const result = await handleSubscriptionPayment(
          payload,
          transactionAmount,
          nombaTransactionId || orderReference,
          paymentMethod,
        );
        if (result.success) {
          console.log("✅ Subscription activated:", result);
          // Don't add duplicate success property - just return the result
          return NextResponse.json(result, { status: 200 });
        } else {
          console.error("❌ Subscription failed:", result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
      } else if (eventType === "payment_failed" || txStatus === "failed") {
        console.log("❌ Subscription payment failed");

        // Notify user if we have userId
        const userId =
          payload.data?.order?.metadata?.userId ||
          payload.data?.metadata?.userId;
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "❌ Subscription Payment Failed",
            message: "Your subscription payment failed. Please try again.",
            type: "error",
          });
        }

        return NextResponse.json(
          { success: false, message: "Payment failed" },
          { status: 200 },
        );
      }
    }

    // ========== 2. INVOICE PAYMENTS ==========
    const isInvoicePayment =
      orderReference ||
      payload.data?.order?.callbackUrl?.includes(
        "/api/invoice-payment-callback",
      ) ||
      payload.data?.order?.metadata?.invoiceId;

    if (
      isInvoicePayment &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("🧾 Processing invoice payment...");

      // Find invoice ID
      let invoiceId =
        payload.data?.order?.metadata?.invoiceId || orderReference;

      if (!invoiceId) {
        console.error("No invoice ID found");
        return NextResponse.json({ error: "No invoice ID" }, { status: 400 });
      }

      // Look up invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error("Invoice not found:", invoiceId);
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 },
        );
      }

      console.log("✅ Found invoice:", invoice.invoice_id);

      // Check for duplicate
      const { data: existingPayment } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("nomba_transaction_id", nombaTransactionId)
        .maybeSingle();

      if (existingPayment) {
        console.log("⚠️ Duplicate payment, updating totals only");
        await updateInvoiceTotals(invoice, transactionAmount);
        return NextResponse.json({ success: true });
      }

      const customerEmail = order.customerEmail || customer.email;
      const customerName = order.customerName || customer.name || "Customer";

      // Create payment record
      const { error: paymentError } = await supabase
        .from("invoice_payments")
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          order_reference: orderReference || nombaTransactionId,
          payer_email: customerEmail || invoice.client_email,
          payer_name: customerName || invoice.client_name,
          amount: transactionAmount,
          paid_amount: transactionAmount,
          status: "completed",
          nomba_transaction_id: nombaTransactionId,
          payment_method: order.paymentMethod || "card_payment",
          paid_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("Failed to create payment record:", paymentError);
        return NextResponse.json(
          { error: "Payment record failed" },
          { status: 500 },
        );
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: invoice.user_id,
        type: "credit",
        amount: transactionAmount,
        status: "success",
        reference: `INV-${invoice.invoice_id}-${nombaTransactionId}`,
        description: `Payment received for invoice ${invoice.invoice_id} from ${customerName}`,
        channel: "invoice_payment",
        sender: { name: customerName, email: customerEmail },
        receiver: { name: invoice.from_name, email: invoice.from_email },
        external_response: { nomba_transaction_id: nombaTransactionId },
      });

      // Credit wallet - FULL AMOUNT (NO FEE DEDUCTION)
      const { error: creditError } = await supabase.rpc(
        "increment_wallet_balance",
        {
          user_id: invoice.user_id,
          amt: transactionAmount,
        },
      );

      if (creditError) {
        console.error("Failed to credit wallet:", creditError);
      } else {
        console.log(
          `✅ Credited ₦${transactionAmount} to user ${invoice.user_id}`,
        );
      }

      // Update invoice totals
      await updateInvoiceTotals(invoice, transactionAmount);

      // Send notifications (non-blocking)
      if (customerEmail) {
        sendPaymentSuccessEmail(
          customerEmail,
          invoice.invoice_id,
          transactionAmount,
          customerName,
          invoice,
        ).catch(console.error);
      }

      // Get creator email and notify
      const { data: creator } = await supabase
        .from("users")
        .select("email")
        .eq("id", invoice.user_id)
        .single();

      if (creator?.email) {
        sendInvoiceCreatorNotificationEmail(
          creator.email,
          invoice.invoice_id,
          transactionAmount,
          customerName,
          invoice,
        ).catch(console.error);
      }

      return NextResponse.json({ success: true });
    }

    // ========== 3. VIRTUAL ACCOUNT DEPOSITS ==========
    if (
      aliasAccountReference &&
      (eventType === "payment_success" || txStatus === "success")
    ) {
      console.log("🏦 Processing virtual account deposit...");

      const userId = aliasAccountReference;
      const narration = tx.narration || "";
      const senderName =
        customer.senderName || customer.name || "Bank Transfer";

      // Check if narration contains invoice reference (e.g., INV-1234)
      const invoiceMatch = narration.match(/INV[-_][A-Z0-9]{4,}/i);

      if (invoiceMatch) {
        // This is an invoice payment via VA
        const invoiceRef = invoiceMatch[0].toUpperCase();
        console.log("🧾 Found invoice reference in narration:", invoiceRef);

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*")
          .eq("invoice_id", invoiceRef)
          .single();

        if (invoice) {
          if (invoice.user_id !== userId) {
            // Payment to someone else's invoice
            console.log("💰 Cross-user invoice payment");

            await supabase.from("invoice_payments").insert({
              invoice_id: invoice.id,
              user_id: invoice.user_id,
              order_reference: nombaTransactionId,
              payer_name: senderName,
              amount: transactionAmount,
              paid_amount: transactionAmount,
              status: "completed",
              nomba_transaction_id: nombaTransactionId,
              payment_method: "virtual_account",
              narration,
              paid_at: new Date().toISOString(),
            });

            // Credit invoice owner
            await supabase.rpc("increment_wallet_balance", {
              user_id: invoice.user_id,
              amt: transactionAmount,
            });

            await updateInvoiceTotals(invoice, transactionAmount);

            console.log(`✅ Credited invoice owner ₦${transactionAmount}`);
          } else {
            // Self payment
            console.log("💰 Self invoice payment");

            await supabase.from("invoice_payments").insert({
              invoice_id: invoice.id,
              user_id: invoice.user_id,
              order_reference: nombaTransactionId,
              payer_name: senderName,
              amount: transactionAmount,
              paid_amount: transactionAmount,
              status: "completed",
              nomba_transaction_id: nombaTransactionId,
              payment_method: "virtual_account",
              narration,
              paid_at: new Date().toISOString(),
            });

            await supabase.rpc("increment_wallet_balance", {
              user_id: invoice.user_id,
              amt: transactionAmount,
            });

            await updateInvoiceTotals(invoice, transactionAmount);

            console.log(`✅ Credited self ₦${transactionAmount}`);
          }

          return NextResponse.json({ success: true });
        }
      }

      // Regular deposit (no invoice)
      console.log("💰 Regular wallet deposit");

      // Check for duplicate
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("*")
        .eq("merchant_tx_ref", nombaTransactionId)
        .maybeSingle();

      if (!existingTx) {
        // Create transaction
        await supabase.from("transactions").insert({
          user_id: userId,
          type: "virtual_account_deposit",
          amount: transactionAmount,
          status: "success",
          reference: nombaTransactionId,
          merchant_tx_ref: nombaTransactionId,
          description: "Virtual account deposit",
          narration: narration,
          channel: "virtual_account",
          sender: { name: senderName, bank: customer.bankName },
        });

        // Credit wallet - FULL AMOUNT
        await supabase.rpc("increment_wallet_balance", {
          user_id: userId,
          amt: transactionAmount,
        });

        console.log(`✅ Credited wallet ₦${transactionAmount}`);

        // Send email notification (non-blocking)
        sendVirtualAccountDepositEmail(
          userId,
          transactionAmount,
          nombaTransactionId,
          customer.bankName || "N/A",
          tx.aliasAccountNumber || "N/A",
          tx.aliasAccountName || "N/A",
          senderName,
          narration,
        ).catch(console.error);
      }

      return NextResponse.json({ success: true });
    }

    // ========== 4. WITHDRAWALS/TRANSFERS ==========
    const isPayout =
      eventType?.toLowerCase().includes("payout") ||
      transactionType.includes("transfer") ||
      transactionType.includes("payout");

    if (isPayout) {
      console.log("💸 Processing payout...");

      // Find the pending transaction
      const searchRefs = [nombaTransactionId, merchantTxRef].filter(Boolean);

      let pendingTx = null;

      for (const ref of searchRefs) {
        const { data } = await supabase
          .from("transactions")
          .select("*")
          .or(`merchant_tx_ref.eq.${ref},reference.eq.${ref}`)
          .in("status", ["pending", "processing"])
          .maybeSingle();

        if (data) {
          pendingTx = data;
          break;
        }
      }

      if (!pendingTx) {
        console.log("No matching pending transaction found");
        return NextResponse.json(
          { message: "No matching transaction" },
          { status: 200 },
        );
      }

      if (eventType === "payout_success" || txStatus === "success") {
        console.log("✅ Payout successful");

        // Update to success
        await supabase
          .from("transactions")
          .update({
            status: "success",
            external_response: {
              ...pendingTx.external_response,
              nomba_data: payload,
              completed_at: new Date().toISOString(),
            },
          })
          .eq("id", pendingTx.id);

        // Send success email
        const receiver = pendingTx.receiver || {};
        sendWithdrawalEmail(
          pendingTx.user_id,
          "success",
          pendingTx.amount,
          receiver.name || "N/A",
          receiver.accountNumber || "N/A",
          receiver.bankName || "N/A",
          pendingTx.id,
        ).catch(console.error);
      } else if (eventType === "payout_failed" || txStatus === "failed") {
        console.log("❌ Payout failed - refunding user");

        // Update to failed
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            external_response: {
              ...pendingTx.external_response,
              nomba_data: payload,
              failed_at: new Date().toISOString(),
              error: tx.responseMessage || "Transaction failed",
            },
          })
          .eq("id", pendingTx.id);

        // Refund the user - FULL AMOUNT
        const refundAmount = pendingTx.total_deduction || pendingTx.amount;
        await supabase.rpc("increment_wallet_balance", {
          user_id: pendingTx.user_id,
          amt: refundAmount,
        });

        console.log(
          `✅ Refunded ₦${refundAmount} to user ${pendingTx.user_id}`,
        );

        // Send failure email
        const receiver = pendingTx.receiver || {};
        sendWithdrawalEmail(
          pendingTx.user_id,
          "failed",
          pendingTx.amount,
          receiver.name || "N/A",
          receiver.accountNumber || "N/A",
          receiver.bankName || "N/A",
          pendingTx.id,
          tx.responseMessage || "Transaction failed - refunded",
        ).catch(console.error);
      }

      return NextResponse.json({ success: true });
    }

    // Default response for unhandled events
    console.log("ℹ️ Unhandled event type:", eventType);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
