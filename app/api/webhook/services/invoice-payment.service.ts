// app/api/webhook/services/invoice-payment.service.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreditWalletWithAuditParams {
  userId: string;
  amount: number;
  transactionReference: string;
  reason: string;
  description?: string;
  externalResponse?: Record<string, any>;
}

/**
 * Credit a user's wallet with a transaction row + idempotency.
 * Safe to call multiple times — idempotency key prevents double-credit.
 */
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

    // Check for existing tx (extra idempotency safety beyond RPC key)
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

    // Create the transaction row
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
      return { ok: false, message: txError?.message || "Tx insert failed" };
    }

    // Credit atomically with idempotency key
    const { data: newBalance, error: creditError } = await supabase.rpc(
      "mutate_wallet_balance",
      {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_id: txRow.id,
        p_reason: reason,
        p_idempotency_key: `inv_credit_${transactionReference}`,
      }
    );

    if (creditError) {
      console.error("[invoice-payment] Credit RPC failed:", creditError);
      await supabase
        .from("transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", txRow.id);
      return { ok: false, message: creditError.message };
    }

    // Mark tx success
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

    // Update invoice record
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
        invoiceError
      );
      // Non-fatal: money moved, ops can reconcile
    }

    console.log(
      `[invoice-payment] Invoice ${invoiceId} paid: ₦${amount} credited to user ${userId}`
    );
    return { ok: true, message: "Invoice payment processed" };
  } catch (err: any) {
    console.error("[invoice-payment] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}