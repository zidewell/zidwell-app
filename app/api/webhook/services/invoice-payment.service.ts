// app/api/webhook/services/invoice-payment.service.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CreditWalletWithAuditParams {
  userId: string;
  amount: number;
  transactionReference: string;
  reason: string;
  description?: string;
  externalResponse?: Record<string, any>;
}

async function creditWalletWithAudit({
  userId,
  amount,
  transactionReference,
  reason,
  description,
  externalResponse,
}: CreditWalletWithAuditParams): Promise<{
  ok: boolean;
  newBalance?: number;
  txId?: string;
  message: string;
}> {
  try {
    if (amount <= 0) {
      return { ok: false, message: "Amount must be > 0" };
    }

    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("reference", transactionReference)
      .maybeSingle();

    if (existingTx && existingTx.status === "success") {
      return {
        ok: true,
        txId: existingTx.id,
        message: "Already credited",
      };
    }

    const { data: txRow, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "payment_received",
        amount,
        status: "pending",
        reference: transactionReference,
        description: description || reason,
        external_response: externalResponse || null,
      })
      .select()
      .single();

    if (txError || !txRow) {
      if (txError?.code === "23505") {
        return { ok: true, message: "Already credited (race)" };
      }
      console.error("[invoice-payment] Tx insert failed:", txError);
      return {
        ok: false,
        message: txError?.message || "Tx insert failed",
      };
    }

    const { data: newBalance, error: creditError } = await supabase.rpc(
      "mutate_wallet_balance",
      {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_id: txRow.id,
        p_reason: reason,
        p_idempotency_key: `inv_credit_${transactionReference}`,
      },
    );

    if (creditError) {
      console.error("[invoice-payment] Credit RPC failed:", creditError);
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", txRow.id);
      return { ok: false, message: creditError.message };
    }

    await supabase
      .from("transactions")
      .update({
        status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("id", txRow.id);

    return {
      ok: true,
      newBalance: newBalance as number,
      txId: txRow.id,
      message: "Credited",
    };
  } catch (err: any) {
    console.error("[invoice-payment] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}

interface InvoicePaymentParams {
  userId: string;
  amount: number;
  transactionReference: string;
  invoiceId: string;
  invoiceReference?: string;
  payerEmail?: string;
  externalResponse?: Record<string, any>;
}

/**
 * Handle an invoice payment webhook:
 * - Credit the invoice recipient's wallet
 * - Update invoice status
 */
export async function handleInvoicePayment({
  userId,
  amount,
  transactionReference,
  invoiceId,
  invoiceReference,
  payerEmail,
  externalResponse,
}: InvoicePaymentParams): Promise<{ ok: boolean; message: string }> {
  try {
    const creditResult = await creditWalletWithAudit({
      userId,
      amount,
      transactionReference,
      reason: "invoice_payment",
      description: `Invoice payment ${
        invoiceReference || invoiceId
      } from ${payerEmail || "Unknown"}`,
      externalResponse,
    });

    if (!creditResult.ok) {
      return { ok: false, message: creditResult.message };
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) {
      console.error(
        "[invoice-payment] Invoice update failed (wallet already credited):",
        invoiceError,
      );
    }

    console.log(
      `[invoice-payment] Invoice ${invoiceId} paid: ₦${amount} credited to user ${userId}`,
    );
    return { ok: true, message: "Invoice payment processed" };
  } catch (err: any) {
    console.error("[invoice-payment] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}

// ============================================================
// VIRTUAL ACCOUNT INVOICE PAYMENT
// Called by virtual-account.service.ts when it detects an invoice
// reference inside a vact_transfer narration.
// ============================================================
export async function processVirtualAccountInvoicePayment(
  payload: any,
  params: {
    aliasAccountReference: string;
    nombaTransactionId: string;
    transactionAmount: number;
    nombaFee: number;
    customer: any;
    tx: any;
    invoiceRef: string;
  },
): Promise<{ success: boolean; message: string } | { error: string }> {
  const {
    aliasAccountReference,
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    customer,
    tx,
    invoiceRef,
  } = params;

  console.log(
    `[va-invoice] Processing VA invoice payment: ref=${invoiceRef} amount=₦${transactionAmount}`,
  );

  // Find the invoice by its public reference
  const { data: invoice, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id, user_id, invoice_id, status, paid_amount, total_amount, signee_email, initiator_email, from_email, from_name")
    .or(
      `invoice_id.eq.${invoiceRef},invoice_reference.eq.${invoiceRef}`,
    )
    .maybeSingle();

  if (invoiceLookupError || !invoice) {
    console.error(
      `[va-invoice] ❌ Invoice not found: ${invoiceRef}`,
      invoiceLookupError,
    );
    return { error: `Invoice ${invoiceRef} not found` };
  }

  // Deduplicate: don't process the same Nomba transaction twice
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference", `VA-INV-${nombaTransactionId}`)
    .maybeSingle();

  if (existing) {
    return { success: true, message: "Already processed" };
  }

  const userId = invoice.user_id;
  const senderName =
    customer.senderName || customer.name || "Bank Transfer";

  // Create the invoice-payment transaction
  const { data: txRow, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "invoice_payment",
      amount: transactionAmount,
      fee: 0,
      net_amount: transactionAmount,
      status: "pending",
      reference: `VA-INV-${nombaTransactionId}`,
      merchant_tx_ref: nombaTransactionId,
      description: `Invoice ${invoice.invoice_id} payment from ${senderName}`,
      narration: tx.narration || "Invoice payment",
      channel: "virtual_account_invoice",
      sender: {
        name: senderName,
        bank: customer.bankName || null,
        account_number: customer.accountNumber || null,
        bank_code: customer.bankCode || null,
      },
      receiver: {
        user_id: userId,
        invoice_id: invoice.id,
      },
      external_response: {
        nomba_transaction_id: nombaTransactionId,
        invoice_reference: invoiceRef,
        gross_amount: transactionAmount,
        nomba_fee: nombaFee,
      },
    })
    .select("id")
    .single();

  if (txErr || !txRow) {
    console.error("[va-invoice] ❌ Tx insert failed:", txErr);
    return { error: "Failed to create invoice payment transaction" };
  }

  // Credit the invoice recipient's wallet
  const { data: newBalance, error: creditErr } = await supabase.rpc(
    "mutate_wallet_balance",
    {
      p_user_id: userId,
      p_amount: transactionAmount,
      p_transaction_id: txRow.id,
      p_reason: "invoice_payment_via_va",
      p_idempotency_key: `inv_va_${nombaTransactionId}`,
    },
  );

  if (creditErr) {
    console.error("[va-invoice] ❌ Credit failed:", creditErr);
    await supabase
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", txRow.id);
    return { error: creditErr.message };
  }

  // Mark transaction success
  await supabase
    .from("transactions")
    .update({ status: "success", updated_at: new Date().toISOString() })
    .eq("id", txRow.id);

  // Update invoice
  const newPaidAmount =
    Number(invoice.paid_amount || 0) + transactionAmount;
  const totalAmount = Number(invoice.total_amount || 0);
  const isPaid = newPaidAmount >= totalAmount;

  await supabase
    .from("invoices")
    .update({
      status: isPaid ? "paid" : "partially_paid",
      paid_amount: newPaidAmount,
      paid_at: isPaid ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  console.log(
    `[va-invoice] ✅ Invoice ${invoice.invoice_id} credited ₦${transactionAmount} to user ${userId}. New balance: ₦${newBalance}. Paid: ₦${newPaidAmount}/₦${totalAmount}`,
  );

  return {
    success: true,
    message: `Invoice ${invoice.invoice_id} paid via virtual account`,
  };
}