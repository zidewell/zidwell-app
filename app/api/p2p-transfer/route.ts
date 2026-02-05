import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer"; 

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

// Logger helper for cleaner logging
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error ? error.message || error : '');
  },
  success: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data || '');
  }
};

// Email helper functions
async function sendP2PSuccessEmailNotification(
  userId: string,
  receiverName: string,
  amount: number,
  transactionRef: string,
  narration: string,
  isInvoicePayment: boolean = false,
  invoiceReference?: string
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) {
      logger.error("Failed to fetch user for P2P success email", error);
      return;
    }

    const subject = isInvoicePayment 
      ? `✅ Invoice Payment Sent - ₦${amount.toLocaleString()}`
      : `✅ P2P Transfer Successful - ₦${amount.toLocaleString()}`;
    
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      text: `${greeting}

Your ${isInvoicePayment ? 'invoice payment' : 'P2P transfer'} was successful!

💰 Transaction Details:
• Amount: ₦${amount.toLocaleString()}
• ${isInvoicePayment ? 'Invoice Reference:' : 'Recipient:'} ${isInvoicePayment ? invoiceReference : receiverName}
• Transaction Reference: ${transactionRef}
• Narration: ${narration || "N/A"}
• Date: ${new Date().toLocaleString()}
• Status: ✅ Success

${isInvoicePayment 
  ? `The invoice payment has been processed successfully.`
  : `The funds should be available in the recipient's wallet immediately.`
}

Thank you for using Zidwell!

Best regards,
Zidwell Team`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />
    
    <p>${greeting}</p>
    
    <h3 style="color: #22c55e;">
      ✅ ${isInvoicePayment ? 'Invoice Payment' : 'P2P Transfer'} Successful
    </h3>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h4 style="margin-top: 0;">Transaction Details:</h4>
      <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
      <p><strong>${isInvoicePayment ? 'Invoice Reference:' : 'Recipient:'}</strong> ${isInvoicePayment ? invoiceReference : receiverName}</p>
      <p><strong>Transaction Reference:</strong> ${transactionRef}</p>
      <p><strong>Narration:</strong> ${narration || "N/A"}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">Success</span></p>
    </div>
    
    <p style="color: #64748b;">
      ${isInvoicePayment 
        ? `The invoice payment has been processed successfully.`
        : `The funds should be available in the recipient's wallet immediately.`
      }
    </p>
    
    <p>Thank you for using Zidwell!</p>
    
    <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px; margin-bottom: 20px;" />
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #64748b; font-size: 14px;">
      Best regards,<br>
      <strong>Zidwell Team</strong>
    </p>
  </div>
`,
    });

    logger.success(`P2P success email sent to ${user.email}`, { amount });
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
  invoiceReference?: string
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", receiverId)
      .single();

    if (error || !user) {
      logger.error("Failed to fetch user for P2P received email", error);
      return;
    }

    const subject = isInvoicePayment 
      ? `💰 Invoice Payment Received - ₦${amount.toLocaleString()}`
      : `💰 P2P Transfer Received - ₦${amount.toLocaleString()}`;
    
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      text: `${greeting}

You've received a ${isInvoicePayment ? 'invoice payment' : 'P2P transfer'}!

💰 Transaction Details:
• Amount: ₦${amount.toLocaleString()}
• ${isInvoicePayment ? 'Invoice Reference:' : 'Sender:'} ${isInvoicePayment ? invoiceReference : senderName}
• Transaction Reference: ${transactionRef}
• Narration: ${narration || "N/A"}
• Date: ${new Date().toLocaleString()}
• Status: ✅ Received

${isInvoicePayment 
  ? `The invoice payment has been credited to your wallet.`
  : `The funds have been credited to your wallet and are ready to use.`
}

Thank you for using Zidwell!

Best regards,
Zidwell Team`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />
    
    <p>${greeting}</p>
    
    <h3 style="color: #22c55e;">
      💰 ${isInvoicePayment ? 'Invoice Payment' : 'P2P Transfer'} Received
    </h3>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h4 style="margin-top: 0;">Transaction Details:</h4>
      <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
      <p><strong>${isInvoicePayment ? 'Invoice Reference:' : 'Sender:'}</strong> ${isInvoicePayment ? invoiceReference : senderName}</p>
      <p><strong>Transaction Reference:</strong> ${transactionRef}</p>
      <p><strong>Narration:</strong> ${narration || "N/A"}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">Received</span></p>
    </div>
    
    <p style="color: #64748b;">
      ${isInvoicePayment 
        ? `The invoice payment has been credited to your wallet.`
        : `The funds have been credited to your wallet and are ready to use.`
      }
    </p>
    
    <p>Thank you for using Zidwell!</p>
    
    <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px; margin-bottom: 20px;" />
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #64748b; font-size: 14px;">
      Best regards,<br>
      <strong>Zidwell Team</strong>
    </p>
  </div>
`,
    });

    logger.success(`P2P received email sent to ${user.email}`, { amount });
  } catch (emailError) {
    logger.error("Failed to send P2P received email", emailError);
  }
}

async function sendInvoiceCreatorNotificationWithFees(
  creatorEmail: string,
  invoiceId: string,
  totalAmount: number,
  userAmount: number,
  platformFee: number,
  customerName: string,
  customerEmail: string,
  invoice: any
) {
  try {
    const subject = `💰 New Payment Received for Invoice ${invoiceId} - ₦${totalAmount.toLocaleString()}`;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject,
      text: `Hi,

Great news! You've received a new payment for your invoice via P2P transfer.

📋 Invoice Details:
• Invoice ID: ${invoiceId}
• Customer: ${customerName}
• Customer Email: ${customerEmail || "Not provided"}

💰 Payment Breakdown:
• Total Payment Received: ₦${totalAmount.toLocaleString()}
• Platform Service Fee (2%): ₦${platformFee.toLocaleString()}
• Amount Credited to Your Wallet: ₦${userAmount.toLocaleString()}
• Payment Method: P2P Transfer

✅ Your wallet has been credited with ₦${userAmount.toLocaleString()}

Thank you for using Zidwell!

Best regards,
Zidwell Team`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />
    
    <h2 style="color: #22c55e;">💰 New Payment Received!</h2>
    
    <p>Great news! You've received a new payment for your invoice via P2P transfer.</p>
    
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin-top: 0;">📋 Invoice Details</h3>
      <p><strong>Invoice ID:</strong> ${invoiceId}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Customer Email:</strong> ${customerEmail || "Not provided"}</p>
    </div>
    
    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin-top: 0;">💰 Payment Breakdown</h3>
      <p><strong>Total Payment Received:</strong> ₦${totalAmount.toLocaleString()}</p>
      <p><strong>Platform Service Fee (2%):</strong> ₦${platformFee.toLocaleString()}</p>
      <p><strong>Amount Credited to Your Wallet:</strong> <span style="color: #22c55e; font-weight: bold;">₦${userAmount.toLocaleString()}</span></p>
      <p><strong>Payment Method:</strong> P2P Transfer</p>
    </div>
    
    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
      <h3 style="margin-top: 0;">✅ Wallet Updated</h3>
      <p>Your wallet has been successfully credited with <strong>₦${userAmount.toLocaleString()}</strong></p>
      <p>The funds are now available for use in your Zidwell Wallet.</p>
    </div>
    
    <p>Thank you for using Zidwell!</p>
    
    <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px; margin-bottom: 20px;" />
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #64748b; font-size: 14px;">
      Best regards,<br>
      <strong>Zidwell Team</strong>
    </p>
  </div>
`,
    });

    logger.success(`Invoice creator notification sent to ${creatorEmail}`);
  } catch (emailError) {
    logger.error("Failed to send invoice creator notification", emailError);
  }
}

// Helper function to update invoice totals - EXACTLY LIKE WEBHOOK
async function updateInvoiceTotals(
  invoice: any,
  paidAmountNaira: number,
  supabase: any
) {
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
      // For multiple payments, user can pay any amount
      // Calculate if enough has been paid to complete a quantity
      const quantityPaidSoFar = Math.floor(newPaidAmount / totalAmount);
      
      // Update paid quantity if more quantities have been completed
      if (quantityPaidSoFar > currentPaidQty) {
        newPaidQuantity = quantityPaidSoFar;
        logger.info(`Quantity increased: ${currentPaidQty} → ${newPaidQuantity}`);
      }

      // ✅ FIX: For multiple payments, always mark as partially_paid after first payment
      // unless ALL quantities are already completed
      if (newPaidQuantity >= targetQty) {
        newStatus = "paid";
        logger.info("All quantities paid - marking as fully paid");
      } else if (newPaidAmount > 0) {
        newStatus = "partially_paid";
        logger.info("Multiple payments - marking as partially_paid");
      } else {
        newStatus = invoice.status;
      }
    } else {
      // Single payment mode
      if (newPaidAmount >= totalAmount) {
        newStatus = "paid";
        logger.info("Full amount paid - marking as paid");
      } else if (newPaidAmount > 0) {
        newStatus = "partially_paid";
        logger.info("Partial payment received");
      } else {
        newStatus = invoice.status;
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
      logger.info("Setting paid_at timestamp");
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoice.id);

    if (updateError) {
      logger.error("Failed to update invoice", updateError);
      throw updateError;
    }

    logger.success("Invoice totals updated", {
      invoice_id: invoice.invoice_id,
      newPaidAmount,
      newPaidQuantity,
      targetQty,
      newStatus,
    });

    return { newPaidAmount, newPaidQuantity, newStatus };
  } catch (error) {
    logger.error("Error in updateInvoiceTotals", error);
    throw error;
  }
}

// Main API function
export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { userId, receiverAccountId, amount, narration, pin } =
      await req.json();

    if (!userId || !pin || !amount || amount < 100 || !receiverAccountId) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // ✅ Verify user + PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, transaction_pin, wallet_balance, wallet_id, bank_name, bank_account_number, email"
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    if (
      user.bank_name !== "Nombank MFB" &&
      user.bank_name !== "Nombank(Amucha) MFB"
    ) {
      return NextResponse.json(
        { message: "Only Nombank MFB users can perform transfers" },
        { status: 403 }
      );
    }

    // ✅ Check balance
    if (user.wallet_balance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // ✅ Get receiver details
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, wallet_id, bank_name, bank_account_number, email"
      )
      .eq("wallet_id", receiverAccountId)
      .single();

    if (!receiver) {
      return NextResponse.json(
        { message: "Receiver wallet not found" },
        { status: 404 }
      );
    }

    if (
      receiver.bank_name !== "Nombank MFB" &&
      receiver.bank_name !== "Nombank(Amucha) MFB"
    ) {
      return NextResponse.json(
        { message: "You can only transfer to other Nombank MFB users" },
        { status: 403 }
      );
    }

    // ✅ Prevent self-transfer by checking bank_account_number
    if (user.bank_account_number === receiver.bank_account_number) {
      return NextResponse.json(
        { message: "You cannot transfer to your own account" },
        { status: 400 }
      );
    }

    // ✅ Also check wallet_id as an additional safeguard
    if (user.wallet_id === receiver.wallet_id) {
      return NextResponse.json(
        { message: "You cannot transfer to your own wallet" },
        { status: 400 }
      );
    }

    const receiverName = `${receiver.first_name} ${receiver.last_name}`;
    const senderName = `${user.first_name} ${user.last_name}`;

    // Create unique references for sender and receiver transactions
    const timestamp = Date.now();
    const senderTxRef = `P2P_SND_${timestamp}_${userId}`;
    const receiverTxRef = `P2P_RCV_${timestamp}_${receiver.id}`;
    // Create unique reference for invoice payment transaction
    const invoiceTxRef = `INV_P2P_${timestamp}_${userId}`;
    // Create a linked transaction ID for both records
    const linkedTransactionId = `P2P_${timestamp}`;

    let senderDescription = `P2P transfer to ${receiverName}`;
    let receiverDescription = `P2P transfer from ${senderName}`;

    // ========== INVOICE PAYMENT CHECK ==========
    let invoicePaymentData = null;
    let invoiceDetails = null;
    
    if (narration) {
      const invoicePattern = /INV[-_][A-Z0-9]{4}/i;
      const narrationMatch = narration.match(invoicePattern);
      
      if (narrationMatch) {
        const invoiceReference = narrationMatch[0].toUpperCase();
        logger.info("Found invoice reference in P2P narration", { invoiceReference });
        
        let { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("invoice_id", invoiceReference)
          .single();

        if (invoiceError) {
          ({ data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .select("*")
            .ilike("invoice_id", invoiceReference)
            .single());
        }

        if (invoiceError || !invoice) {
          logger.warn("Invoice not found with reference", { invoiceReference });
        } else {
          // Check if P2P receiver is the invoice owner
          if (invoice.user_id === receiver.id) {
            logger.info("P2P receiver is invoice owner - processing as invoice payment");
            invoicePaymentData = {
              isInvoicePayment: true,
              invoice_id: invoice.id,
              invoice_reference: invoiceReference,
              invoice_owner_id: invoice.user_id,
              invoice_total: invoice.total_amount,
              allow_multiple_payments: invoice.allow_multiple_payments || false,
            };
            invoiceDetails = invoice;
            
            // Update descriptions
            senderDescription = `P2P payment for invoice ${invoiceReference} to ${receiverName}`;
            receiverDescription = `P2P payment for invoice ${invoiceReference} from ${senderName}`;
          } else {
            logger.warn("P2P receiver is NOT invoice owner", { 
              invoiceOwner: invoice.user_id, 
              receiver: receiver.id 
            });
          }
        }
      }
    }
    // ========== END INVOICE PAYMENT CHECK ==========

    // ✅ 1. Deduct from sender
    const { data: deductionResult, error: deductionError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "p2p_transfer",
        reference: senderTxRef, 
        description: senderDescription,
      }
    );

    if (deductionError) {
      return NextResponse.json(
        {
          message: "Failed to deduct from sender",
          error: deductionError.message,
        },
        { status: 500 }
      );
    }

    // Check if deduction was successful
    if (
      !deductionResult ||
      deductionResult[0]?.status === "INSUFFICIENT_FUNDS"
    ) {
      return NextResponse.json(
        { message: "Insufficient funds for transfer" },
        { status: 400 }
      );
    }

    // Get the transaction ID from deduction result
    const transactionId = deductionResult[0]?.transaction_id;

    // ✅ 2. Credit receiver with FULL AMOUNT (fees will be deducted separately)
    const { error: creditError } = await supabase.rpc(
      "increment_wallet_balance",
      {
        user_id: receiver.id,
        amt: amount,
      }
    );

    if (creditError) {
      logger.error("Credit failed, refunding sender...", creditError);

      // If credit fails, refund the sender
      await supabase.rpc("increment_wallet_balance", {
        user_id: userId,
        amt: amount,
      });

      return NextResponse.json(
        {
          message: "Transfer failed, funds refunded",
          error: creditError.message,
        },
        { status: 500 }
      );
    }

    let platformFee = 0;
    let netAmount = amount;
    
    if (invoicePaymentData?.isInvoicePayment && invoiceDetails) {
      logger.info("Processing invoice payment via P2P");
      
      // Apply 2% platform fee for invoice payments
      const platformFeePercentage = 0.02;
      platformFee = Math.round(amount * platformFeePercentage);
      netAmount = amount - platformFee;
      
      logger.info("Invoice payment fee calculation", {
        total_amount: amount,
        platform_fee: platformFee,
        net_amount: netAmount,
      });
      
      const { error: paymentRecordError } = await supabase
        .from("invoice_payments")
        .insert([
          {
            invoice_id: invoicePaymentData.invoice_id,
            user_id: receiver.id,
            order_reference: invoiceTxRef, // Use unique reference
            payer_name: senderName,
            payer_user_id: userId,
            payer_email: user.email || "N/A", 
            amount: amount,
            paid_amount: amount,
            fee_amount: platformFee,
            platform_fee: platformFee,
            user_received: netAmount,
            status: "completed",
            payment_method: "p2p_transfer",
            nomba_transaction_id: invoiceTxRef,
            bank_name: user.bank_name || "Nombank MFB",
            bank_account: user.bank_account_number || "N/A",
            narration: narration,
            paid_at: new Date().toISOString(),
            is_reusable: false,
            payment_attempts: 1,
            created_at: new Date().toISOString(),
          },
        ]);
      
      if (paymentRecordError) {
        logger.error("Failed to create invoice payment record", paymentRecordError);
      } else {
        logger.success("Invoice payment record created in invoice_payments table");
      }
      
      // ✅ DEDUCT PLATFORM FEE FROM RECEIVER'S WALLET
      if (platformFee > 0) {
        const { error: feeDeductionError } = await supabase.rpc(
          "deduct_wallet_balance",
          {
            user_id: receiver.id,
            amt: platformFee,
            transaction_type: "debit",
            reference: `PLATFORM_FEE_${invoiceTxRef}`,
            description: `2% platform fee for invoice ${invoicePaymentData.invoice_reference}`,
          }
        );
        
        if (feeDeductionError) {
          logger.error("Failed to deduct platform fee", feeDeductionError);
        } else {
          logger.success(`Deducted platform fee from receiver`, {
            receiverId: receiver.id,
            platformFee,
            netAmount
          });
        }
      }
      
      // ✅ UPDATE INVOICE TOTALS - EXACTLY LIKE WEBHOOK
      try {
        await updateInvoiceTotals(invoiceDetails, amount, supabase);
        logger.success("Invoice totals updated");
      } catch (invoiceError) {
        logger.error("Error updating invoice totals", invoiceError);
      }
      
      // ✅ CREATE TRANSACTION RECORD FOR INVOICE PAYMENT - USE UNIQUE REFERENCE
      const transactionDescription = `P2P payment of ₦${amount} for invoice ${invoicePaymentData.invoice_reference}`;
      
      try {
        const { error: invoiceTxError } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: receiver.id,
              type: "invoice_payment",
              amount: netAmount, 
              status: "success",
              reference: invoiceTxRef, // Use unique reference to avoid duplicate
              description: transactionDescription,
              narration: `Payment received for Invoice #${invoicePaymentData.invoice_reference} via P2P transfer`,
              fee: platformFee,
              total_deduction: amount,
              channel: "p2p_transfer",
              sender: {
                name: senderName,
                bank: user.bank_name || "Nombank MFB",
                account_number: user.bank_account_number || "N/A",
                type: "customer",
              },
              receiver: {
                name: receiverName,
                email: receiver.email || "N/A",
                type: "merchant",
              },
              external_response: {
                invoice_payment: true,
                invoice_reference: invoicePaymentData.invoice_reference,
                allow_multiple_payments: invoicePaymentData.allow_multiple_payments,
                fee_breakdown: {
                  total_payment: amount,
                  user_received: netAmount,
                  platform_revenue: platformFee,
                  platform_percentage: "2%",
                  calculation: `₦${amount} total - ₦${platformFee} (2% platform) = ₦${netAmount} to user`,
                },
              },
            },
          ]);
          
        if (invoiceTxError) {
          logger.error("Failed to create invoice transaction record", invoiceTxError);
        } else {
          logger.success("Invoice transaction record created");
        }
      } catch (txError) {
        logger.error("Error creating transaction record", txError);
      }
    }

    // ✅ 3. Update the sender's transaction record
    const externalResponse: any = {
      status: "success",
      type: "internal_p2p",
      bank_check: "Nombank MFB verified",
      self_transfer_check: "Verified - not self-transfer",
      timestamp: new Date().toISOString(),
      linked_transaction_id: linkedTransactionId,
      counterparty_reference: receiverTxRef,
    };

    // Add invoice payment info if applicable
    if (invoicePaymentData?.isInvoicePayment) {
      externalResponse.invoice_payment = true;
      externalResponse.invoice_reference = invoicePaymentData.invoice_reference;
      externalResponse.platform_fee_applied = true;
      externalResponse.platform_fee = platformFee;
      externalResponse.net_amount = netAmount;
      externalResponse.allow_multiple_payments = invoicePaymentData.allow_multiple_payments;
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        sender: {
          name: senderName,
          accountNumber: user.bank_account_number,
          bankName: user.bank_name,
        },
        receiver: {
          name: receiverName,
          accountNumber: receiver.bank_account_number,
          bankName: receiver.bank_name,
        },
        fee: 0,
        total_deduction: amount,
        narration: narration,
        description: senderDescription,
        external_response: externalResponse,
      })
      .eq("reference", senderTxRef)
      .eq("user_id", userId);

    if (updateError) {
      logger.error("Failed to update transaction record", updateError);
    }

    // ✅ 4. Create receiver's transaction record
    const receiverExternalResponse = {
      ...externalResponse,
      counterparty_reference: senderTxRef,
    };

    const receiverTxType = invoicePaymentData?.isInvoicePayment ? "invoice_payment" : "p2p_credit";
    const receiverTxAmount = invoicePaymentData?.isInvoicePayment ? netAmount : amount;
    const receiverTxDescription = invoicePaymentData?.isInvoicePayment 
      ? `Invoice payment received for ${invoicePaymentData.invoice_reference}`
      : `P2P transfer received from ${senderName}`;

    const { error: receiverTxError } = await supabase
      .from("transactions")
      .insert({
        user_id: receiver.id,
        type: receiverTxType,
        amount: receiverTxAmount,
        status: "success",
        reference: receiverTxRef,
        narration: narration,
        description: receiverTxDescription,
        sender: {
          name: senderName,
          accountNumber: user.bank_account_number,
          bankName: user.bank_name,
        },
        receiver: {
          name: receiverName,
          accountNumber: receiver.bank_account_number,
          bankName: receiver.bank_name,
        },
        fee: invoicePaymentData?.isInvoicePayment ? platformFee : 0,
        total_deduction: 0,
        external_response: receiverExternalResponse,
      });

    if (receiverTxError) {
      logger.error("Failed to create receiver transaction", receiverTxError);
    }

    // ✅ 5. Send email notifications
    try {
      sendP2PSuccessEmailNotification(
        userId,
        receiverName,
        amount,
        linkedTransactionId,
        narration,
        invoicePaymentData?.isInvoicePayment || false,
        invoicePaymentData?.invoice_reference
      ).catch(err => logger.error("Sender email failed", err));

      sendP2PReceivedEmailNotification(
        receiver.id,
        senderName,
        receiverTxAmount,
        linkedTransactionId,
        narration,
        invoicePaymentData?.isInvoicePayment || false,
        invoicePaymentData?.invoice_reference
      ).catch(err => logger.error("Receiver email failed", err));

      if (invoicePaymentData?.isInvoicePayment && receiver.email) {
        sendInvoiceCreatorNotificationWithFees(
          receiver.email,
          invoicePaymentData.invoice_reference,
          amount,
          netAmount,
          platformFee,
          senderName,
          user.email || "N/A",
          invoiceDetails
        ).catch(err => logger.error("Invoice creator email failed", err));
      }
    } catch (emailError) {
      logger.error("Email notification setup error", emailError);
    }

    // ✅ 6. Update wallet history
    try {
      await supabase.from("wallet_history").insert({
        user_id: userId,
        transaction_id: transactionId,
        amount: -amount,
        transaction_type: "debit",
        reference: senderTxRef, 
        description: senderDescription,
        created_at: new Date().toISOString(),
        linked_transaction_id: linkedTransactionId,
      });

      await supabase.from("wallet_history").insert({
        user_id: receiver.id,
        transaction_id: transactionId,
        amount: receiverTxAmount,
        transaction_type: "credit",
        reference: receiverTxRef,
        description: receiverTxDescription,
        created_at: new Date().toISOString(),
        linked_transaction_id: linkedTransactionId,
      });
    } catch (historyError) {
      logger.error("Failed to update wallet history", historyError);
    }

    // ✅ 7. Prepare response
    const responseData: any = {
      message: "P2P transfer completed successfully.",
      transactionRef: linkedTransactionId,
      senderRef: senderTxRef,
      receiverRef: receiverTxRef,
      amount,
      receiverName,
      bankVerification: "Nombank MFB verified",
      selfTransferCheck: "Verified - not self-transfer",
      timestamp: new Date().toISOString(),
      emailsSent: true,
    };

    if (invoicePaymentData?.isInvoicePayment) {
      responseData.invoicePayment = true;
      responseData.invoiceReference = invoicePaymentData.invoice_reference;
      responseData.platformFee = platformFee;
      responseData.netAmount = netAmount;
      responseData.invoiceStatus = invoiceDetails?.status || "partially_paid";
      responseData.allowMultiplePayments = invoicePaymentData.allow_multiple_payments;
      responseData.message = `P2P payment for invoice ${invoicePaymentData.invoice_reference} completed successfully.`;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error("P2P API error", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );
  }
}