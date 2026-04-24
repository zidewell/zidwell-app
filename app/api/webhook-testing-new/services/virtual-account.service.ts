import { createClient } from "@supabase/supabase-js";
import { sendVirtualAccountDepositEmail, sendInvoiceCreatorNotificationEmail } from "../helpers/email-helpers";
import { updateInvoiceTotals } from "../helpers/invoice-helpers";
import { sendTransactionReceipt } from "../helpers/receipt-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface VirtualAccountParams {
  aliasAccountReference: string;
  nombaTransactionId: string;
  transactionAmount: number;
  nombaFee: number;
  customer: any;
  tx: any;
}

export async function processVirtualAccountDeposit(payload: any, params: VirtualAccountParams) {
  const {
    aliasAccountReference,
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    customer,
    tx
  } = params;

  console.log("🏦 Processing virtual account deposit...");
  console.log("🔍 Virtual Account Details:", {
    userId: aliasAccountReference,
    amount: transactionAmount,
    nombaFee,
    narration: tx.narration,
  });

  const userId = aliasAccountReference;
  const narration = tx.narration || "";
  const senderName = customer.senderName || customer.name || "Bank Transfer";
  const netAmount = transactionAmount - nombaFee;
  const invoiceMatch = narration.match(/INV[-_][A-Z0-9]{4,}/i);

  // Check if this is an invoice payment
  if (invoiceMatch) {
    const invoiceRef = invoiceMatch[0].toUpperCase();
    console.log("🧾 Found invoice reference in narration:", invoiceRef);

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("invoice_id", invoiceRef)
      .single();

    if (invoice) {
      console.log("✅ Found invoice for VA payment:", {
        invoice_id: invoice.invoice_id,
        owner_id: invoice.user_id,
        depositor_id: userId,
      });

      // Check for duplicate payment
      const { data: existingPayment } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("nomba_transaction_id", nombaTransactionId)
        .maybeSingle();

      if (existingPayment) {
        console.log("⚠️ Duplicate VA invoice payment, updating totals only");
        await updateInvoiceTotals(invoice, transactionAmount);
        return { success: true };
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("invoice_payments")
        .insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          order_reference: nombaTransactionId,
          payer_name: senderName,
          amount: transactionAmount,
          paid_amount: transactionAmount,
          fee: nombaFee,
          net_amount: netAmount,
          status: "completed",
          nomba_transaction_id: nombaTransactionId,
          payment_method: "virtual_account",
          narration,
          paid_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("❌ Failed to create VA invoice payment:", paymentError);
        return { error: "Payment record failed" };
      }

      const creditUserId = invoice.user_id;
      const isCrossUser = invoice.user_id !== userId;

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: creditUserId,
        type: "credit",
        amount: transactionAmount,
        fee: nombaFee,
        net_amount: netAmount,
        status: "success",
        reference: `VA-INV-${invoice.invoice_id}-${nombaTransactionId}`,
        description: `Payment received for invoice ${invoice.invoice_id} via virtual account from ${senderName}`,
        channel: "virtual_account",
        sender: {
          name: senderName,
          bank: customer.bankName,
          user_id: isCrossUser ? userId : null
        },
        receiver: {
          name: invoice.from_name,
          email: invoice.from_email
        },
        external_response: {
          nomba_transaction_id: nombaTransactionId,
          nomba_fee: nombaFee,
          gross_amount: transactionAmount,
          net_amount: netAmount,
          is_cross_user: isCrossUser
        },
      });

      // Credit wallet
      const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
        user_id: creditUserId,
        amt: netAmount,
      });

      if (creditError) {
        console.error("❌ Failed to credit invoice owner:", creditError);
      } else {
        console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to invoice owner ${creditUserId}`);
      }

      // Update invoice totals
      await updateInvoiceTotals(invoice, transactionAmount);

      // Send TRANSACTION RECEIPT to payer (NEW FEATURE)
      await sendTransactionReceipt(
        invoice.client_email,
        senderName,
        invoice,
        {
          amount: transactionAmount,
          nombaFee,
          netAmount,
          transactionId: nombaTransactionId,
          paymentMethod: "virtual_account",
          paidAt: new Date().toISOString(),
          narration,
        }
      );

      // Send notification to invoice creator
      const { data: creator } = await supabase
        .from("users")
        .select("email")
        .eq("id", invoice.user_id)
        .single();

      if (creator?.email) {
        sendInvoiceCreatorNotificationEmail(
          creator.email,
          invoice.invoice_id,
          netAmount,
          senderName,
          invoice,
          nombaFee,
        ).catch(console.error);
      }

      // Send deposit email to depositor if cross-user
      if (isCrossUser) {
        sendVirtualAccountDepositEmail(
          userId,
          transactionAmount,
          nombaTransactionId,
          customer.bankName || "N/A",
          tx.aliasAccountNumber || "N/A",
          tx.aliasAccountName || "N/A",
          senderName,
          narration,
          nombaFee,
        ).catch(console.error);
      }

      return {
        success: true,
        message: "Invoice payment via virtual account processed",
        gross_amount: transactionAmount,
        fee_deducted: nombaFee,
        net_credit: netAmount,
      };
    }
  }

  // Regular wallet deposit (no invoice)
  console.log("💰 Regular wallet deposit via virtual account");

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("merchant_tx_ref", nombaTransactionId)
    .maybeSingle();

  if (!existingTx) {
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "virtual_account_deposit",
        amount: transactionAmount,
        fee: nombaFee,
        net_amount: netAmount,
        status: "success",
        reference: nombaTransactionId,
        merchant_tx_ref: nombaTransactionId,
        description: "Virtual account deposit",
        narration: narration,
        channel: "virtual_account",
        sender: {
          name: senderName,
          bank: customer.bankName,
          account_number: customer.accountNumber
        },
        external_response: {
          nomba_transaction_id: nombaTransactionId,
          nomba_fee: nombaFee,
          gross_amount: transactionAmount,
          net_amount: netAmount,
        },
      });

    if (txError) {
      console.error("❌ Failed to create VA transaction:", txError);
      return { error: "Failed to create transaction" };
    }

    // Credit wallet
    const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
      user_id: userId,
      amt: netAmount,
    });

    if (creditError) {
      console.error("❌ Failed to credit wallet:", creditError);

      const { data: user } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", userId)
        .single();

      if (user) {
        const newBalance = Number(user.wallet_balance) + netAmount;
        await supabase
          .from("users")
          .update({ wallet_balance: newBalance })
          .eq("id", userId);
      }
    } else {
      console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to wallet ${userId}`);
    }

    // Send deposit email
    sendVirtualAccountDepositEmail(
      userId,
      transactionAmount,
      nombaTransactionId,
      customer.bankName || "N/A",
      tx.aliasAccountNumber || "N/A",
      tx.aliasAccountName || "N/A",
      senderName,
      narration,
      nombaFee,
    ).catch(console.error);
  } else {
    console.log("⚠️ Duplicate VA deposit detected, skipping");
  }

  return {
    success: true,
    message: "Virtual account deposit processed",
    gross_amount: transactionAmount,
    fee_deducted: nombaFee,
    net_credit: netAmount,
  };
}