// app/api/p2p-transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;
const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

const logger = {
  info: (message: string, data?: any) =>
    console.log(`ℹ️ ${message}`, data ? JSON.stringify(data) : ""),
  error: (message: string, error?: any) =>
    console.error(`❌ ${message}`, error?.message || error),
  success: (message: string, data?: any) =>
    console.log(`✅ ${message}`, data ? JSON.stringify(data) : ""),
  warn: (message: string, data?: any) =>
    console.warn(`⚠️ ${message}`, data || ""),
};

async function sendP2PSuccessEmailNotification(
  userId: string,
  receiverName: string,
  amount: number,
  transactionRef: string,
  narration: string,
  isInvoicePayment: boolean = false,
  invoiceReference?: string,
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();
    if (error || !user) return;

    const subject = isInvoicePayment
      ? `✅ Invoice Payment Sent - ₦${amount.toLocaleString()}`
      : `✅ P2P Transfer Successful - ₦${amount.toLocaleString()}`;
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `<div><img src="${headerImageUrl}" style="width:100%;" /><div style="padding:20px;"><p>${greeting}</p><h3>✅ ${isInvoicePayment ? "Invoice Payment" : "P2P Transfer"} Successful</h3><p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p><p><strong>${isInvoicePayment ? "Invoice:" : "Recipient:"}</strong> ${isInvoicePayment ? invoiceReference : receiverName}</p><p><strong>Reference:</strong> ${transactionRef}</p><p>Thank you for using Zidwell!</p></div><img src="${footerImageUrl}" style="width:100%;" /></div>`,
    });
  } catch (emailError) {
    logger.error("Failed to send P2P success email", emailError);
  }
}

async function sendP2PReceivedEmailNotification(
  receiverId: string,
  senderName: string,
  amount: number,
  transactionRef: string,
  narration: string,
  isInvoicePayment: boolean = false,
  invoiceReference?: string,
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", receiverId)
      .single();
    if (error || !user) return;

    const subject = isInvoicePayment
      ? `💰 Invoice Payment Received - ₦${amount.toLocaleString()}`
      : `💰 P2P Transfer Received - ₦${amount.toLocaleString()}`;
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `<div><img src="${headerImageUrl}" style="width:100%;" /><div style="padding:20px;"><p>${greeting}</p><h3>💰 ${isInvoicePayment ? "Invoice Payment" : "P2P Transfer"} Received</h3><p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p><p><strong>${isInvoicePayment ? "Invoice:" : "Sender:"}</strong> ${isInvoicePayment ? invoiceReference : senderName}</p><p><strong>Reference:</strong> ${transactionRef}</p><p>Thank you for using Zidwell!</p></div><img src="${footerImageUrl}" style="width:100%;" /></div>`,
    });
  } catch (emailError) {
    logger.error("Failed to send P2P received email", emailError);
  }
}

async function updateInvoiceTotals(
  invoice: any,
  paidAmountNaira: number,
  supabase: any,
) {
  const targetQty = Number(invoice.target_quantity || 1);
  const totalAmount = Number(invoice.total_amount || 0);
  const currentPaidAmount = Number(invoice.paid_amount || 0);
  const currentPaidQty = Number(invoice.paid_quantity || 0);

  let newPaidAmount = currentPaidAmount + paidAmountNaira;
  let newPaidQuantity = currentPaidQty;
  let newStatus = invoice.status;

  if (invoice.allow_multiple_payments) {
    const quantityPaidSoFar = Math.floor(newPaidAmount / totalAmount);
    if (quantityPaidSoFar > currentPaidQty) newPaidQuantity = quantityPaidSoFar;
    if (newPaidQuantity >= targetQty) newStatus = "paid";
    else if (newPaidAmount > 0) newStatus = "partially_paid";
  } else {
    if (newPaidAmount >= totalAmount) newStatus = "paid";
    else if (newPaidAmount > 0) newStatus = "partially_paid";
  }

  const updateData: any = {
    paid_amount: newPaidAmount,
    paid_quantity: newPaidQuantity,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "paid") updateData.paid_at = new Date().toISOString();

  await supabase.from("invoices").update(updateData).eq("id", invoice.id);
  return { newPaidAmount, newPaidQuantity, newStatus };
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { userId, receiverAccountId, amount, narration, pin } =
      await req.json();

    if (!userId || !pin || !amount || amount < 100 || !receiverAccountId) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 },
      );
    }

    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
    }

    const { data: sender, error: userError } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, transaction_pin, wallet_balance, wallet_id, bank_name, bank_account_number, email",
      )
      .eq("id", userId)
      .single();

    if (userError || !sender)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, sender.transaction_pin);
    if (!isValid)
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 },
      );

    if (
      sender.bank_name !== "Nombank MFB" &&
      sender.bank_name !== "Nombank(Amucha) MFB"
    ) {
      return NextResponse.json(
        { message: "Only Nombank MFB users can perform transfers" },
        { status: 403 },
      );
    }

    if (sender.wallet_balance < amount)
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 },
      );

    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, wallet_id, bank_name, bank_account_number, email",
      )
      .eq("wallet_id", receiverAccountId)
      .single();

    if (!receiver)
      return NextResponse.json(
        { message: "Receiver wallet not found" },
        { status: 404 },
      );

    if (
      sender.bank_account_number === receiver.bank_account_number ||
      sender.wallet_id === receiver.wallet_id
    ) {
      return NextResponse.json(
        { message: "You cannot transfer to your own account" },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const senderTxRef = `P2P_SND_${timestamp}_${userId}`;
    const receiverTxRef = `P2P_RCV_${timestamp}_${receiver.id}`;
    const invoiceTxRef = `INV_P2P_${timestamp}_${userId}`;
    const linkedTransactionId = `P2P_${timestamp}`;

    let senderDescription = `P2P transfer to ${receiver.first_name} ${receiver.last_name}`;
    let receiverDescription = `P2P transfer from ${sender.first_name} ${sender.last_name}`;

    let invoicePaymentData = null;
    let invoiceDetails = null;

    if (narration) {
      const invoicePattern = /INV[-_][A-Z0-9]{4}/i;
      const narrationMatch = narration.match(invoicePattern);
      if (narrationMatch) {
        const invoiceReference = narrationMatch[0].toUpperCase();
        let { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("invoice_id", invoiceReference)
          .single();
        if (invoiceError)
          ({ data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .select("*")
            .ilike("invoice_id", invoiceReference)
            .single());

        if (invoice && invoice.user_id === receiver.id) {
          invoicePaymentData = {
            isInvoicePayment: true,
            invoice_id: invoice.id,
            invoice_reference: invoiceReference,
            invoice_owner_id: invoice.user_id,
            allow_multiple_payments: invoice.allow_multiple_payments || false,
          };
          invoiceDetails = invoice;
          senderDescription = `P2P payment for invoice ${invoiceReference} to ${receiver.first_name} ${receiver.last_name}`;
          receiverDescription = `P2P payment for invoice ${invoiceReference} from ${sender.first_name} ${sender.last_name}`;
        }
      }
    }

    const { data: deductionResult, error: deductionError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "p2p_transfer",
        reference: senderTxRef,
        description: senderDescription,
      },
    );

    if (
      deductionError ||
      !deductionResult ||
      deductionResult[0]?.status === "INSUFFICIENT_FUNDS"
    ) {
      return NextResponse.json(
        { message: "Insufficient funds for transfer" },
        { status: 400 },
      );
    }

    const transactionId = deductionResult[0]?.transaction_id;
    const { error: creditError } = await supabase.rpc(
      "increment_wallet_balance",
      { user_id: receiver.id, amt: amount },
    );

    if (creditError) {
      await supabase.rpc("increment_wallet_balance", {
        user_id: userId,
        amt: amount,
      });
      return NextResponse.json(
        { message: "Transfer failed, funds refunded" },
        { status: 500 },
      );
    }

    let platformFee = 0;
    let netAmount = amount;

    if (invoicePaymentData?.isInvoicePayment && invoiceDetails) {
      platformFee = Math.round(amount * 0.02);
      netAmount = amount - platformFee;

      await supabase.from("invoice_payments").insert([
        {
          invoice_id: invoicePaymentData.invoice_id,
          user_id: receiver.id,
          order_reference: invoiceTxRef,
          payer_name: `${sender.first_name} ${sender.last_name}`,
          payer_user_id: userId,
          payer_email: sender.email || "N/A",
          amount,
          paid_amount: amount,
          fee_amount: platformFee,
          platform_fee: platformFee,
          user_received: netAmount,
          status: "completed",
          payment_method: "p2p_transfer",
          narration,
          paid_at: new Date().toISOString(),
        },
      ]);

      if (platformFee > 0) {
        await supabase.rpc("deduct_wallet_balance", {
          user_id: receiver.id,
          amt: platformFee,
          transaction_type: "debit",
          reference: `PLATFORM_FEE_${invoiceTxRef}`,
          description: `2% platform fee for invoice ${invoicePaymentData.invoice_reference}`,
        });
      }

      await updateInvoiceTotals(invoiceDetails, amount, supabase);

      await supabase.from("transactions").insert([
        {
          user_id: receiver.id,
          type: "invoice_payment",
          amount: netAmount,
          status: "success",
          reference: invoiceTxRef,
          description: `P2P payment of ₦${amount} for invoice ${invoicePaymentData.invoice_reference}`,
          fee: platformFee,
          channel: "p2p_transfer",
          external_response: {
            invoice_payment: true,
            invoice_reference: invoicePaymentData.invoice_reference,
            fee_breakdown: {
              total_payment: amount,
              user_received: netAmount,
              platform_revenue: platformFee,
            },
          },
        },
      ]);
    }

    await supabase
      .from("transactions")
      .update({
        status: "success",
        sender: {
          name: `${sender.first_name} ${sender.last_name}`,
          accountNumber: sender.bank_account_number,
          bankName: sender.bank_name,
        },
        receiver: {
          name: `${receiver.first_name} ${receiver.last_name}`,
          accountNumber: receiver.bank_account_number,
          bankName: receiver.bank_name,
        },
        fee: 0,
        total_deduction: amount,
        narration,
        description: senderDescription,
        external_response: {
          status: "success",
          type: "internal_p2p",
          linked_transaction_id: linkedTransactionId,
        },
      })
      .eq("reference", senderTxRef)
      .eq("user_id", userId);

    await supabase.from("transactions").insert({
      user_id: receiver.id,
      type: invoicePaymentData?.isInvoicePayment
        ? "invoice_payment"
        : "p2p_credit",
      amount: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
      status: "success",
      reference: receiverTxRef,
      narration,
      description: invoicePaymentData?.isInvoicePayment
        ? `Invoice payment received for ${invoicePaymentData.invoice_reference}`
        : `P2P transfer received from ${sender.first_name} ${sender.last_name}`,
      fee: invoicePaymentData?.isInvoicePayment ? platformFee : 0,
    });

    sendP2PSuccessEmailNotification(
      userId,
      `${receiver.first_name} ${receiver.last_name}`,
      amount,
      linkedTransactionId,
      narration,
      invoicePaymentData?.isInvoicePayment || false,
      invoicePaymentData?.invoice_reference,
    ).catch((err) => logger.error("Sender email failed", err));
    sendP2PReceivedEmailNotification(
      receiver.id,
      `${sender.first_name} ${sender.last_name}`,
      invoicePaymentData?.isInvoicePayment ? netAmount : amount,
      linkedTransactionId,
      narration,
      invoicePaymentData?.isInvoicePayment || false,
      invoicePaymentData?.invoice_reference,
    ).catch((err) => logger.error("Receiver email failed", err));

    await supabase
      .from("wallet_history")
      .insert({
        user_id: userId,
        transaction_id: transactionId,
        amount: -amount,
        transaction_type: "debit",
        reference: senderTxRef,
        description: senderDescription,
        linked_transaction_id: linkedTransactionId,
      });
    await supabase
      .from("wallet_history")
      .insert({
        user_id: receiver.id,
        transaction_id: transactionId,
        amount: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
        transaction_type: "credit",
        reference: receiverTxRef,
        description: receiverDescription,
        linked_transaction_id: linkedTransactionId,
      });

    const responseData = {
      message: "P2P transfer completed successfully.",
      transactionRef: linkedTransactionId,
      amount,
      receiverName: `${receiver.first_name} ${receiver.last_name}`,
    };
    if (invoicePaymentData?.isInvoicePayment)
      Object.assign(responseData, {
        invoicePayment: true,
        invoiceReference: invoicePaymentData.invoice_reference,
        platformFee,
        netAmount,
      });

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error("P2P API error", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 },
    );
  }
}
