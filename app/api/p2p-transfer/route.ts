// app/api/transfer/p2p/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { generateTransferReceipt } from "../webhook/helpers/email-helpers";
import { sendP2PSuccessEmail, sendP2PReceivedEmail } from "@/lib/p2p-emails";

const logger = {
  info: (m: string, d?: any) =>
    console.log(`ℹ️ ${m}`, d ? JSON.stringify(d) : ""),
  error: (m: string, e?: any) => console.error(`❌ ${m}`, e?.message || e),
  success: (m: string, d?: any) =>
    console.log(`✅ ${m}`, d ? JSON.stringify(d) : ""),
  warn: (m: string, d?: any) => console.warn(`⚠️ ${m}`, d || ""),
};

// ─────────────────────────────────────────────────────────────
// Safely read an unnamed-column RPC result row by position
// (works whether Postgres names them tx_id/?column?/?column?1
//  or something else)
// ─────────────────────────────────────────────────────────────
function readDeductResult(raw: any): {
  txId: string | null;
  newBalance: number | null;
  status: string | null;
} {
  if (!raw) return { txId: null, newBalance: null, status: null };

  // Supabase returns an array of rows
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return { txId: null, newBalance: null, status: null };

  // Preferred: read by known key if Postgres happened to name them
  if ("tx_id" in row) {
    // Columns may also be named ?column? and ?column?1
    const keys = Object.keys(row);
    const balanceKey = keys.find(
      (k) => k !== "tx_id" && typeof row[k] === "number",
    );
    const statusKey = keys.find(
      (k) => k !== "tx_id" && typeof row[k] === "string",
    );
    return {
      txId: row.tx_id ?? null,
      newBalance: balanceKey != null ? Number(row[balanceKey]) : null,
      status: statusKey != null ? String(row[statusKey]) : null,
    };
  }

  // Fallback: read by position (Postgres/Supabase preserve column order)
  const values = Object.values(row);
  return {
    txId: (values[0] as string) ?? null,
    newBalance: values[1] != null ? Number(values[1]) : null,
    status: (values[2] as string) ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// Invoice totals helper (unchanged)
// ─────────────────────────────────────────────────────────────
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
    const qtyPaid = Math.floor(newPaidAmount / totalAmount);
    if (qtyPaid > currentPaidQty) newPaidQuantity = qtyPaid;
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

function extractInvoiceReference(narration: string): string | null {
  if (!narration) return null;
  const patterns = [
    /INV[-_][A-Z0-9]{4,}/i,
    /INVOICE[-_][A-Z0-9]{4,}/i,
    /INV[A-Z0-9]{4,}/i,
  ];
  for (const p of patterns) {
    const m = narration.match(p);
    if (m) return m[0].toUpperCase();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const body = {
      error: "Please login to access transactions",
      logout: true,
    };
    if (newTokens) return createAuthResponse(body, { status: 401, newTokens });
    return NextResponse.json(body, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const {
      userId,
      receiverAccountId,
      amount,
      narration,
      pin,
      category,
      categoryId,
    } = await req.json();

    // ─── 1. Validate ───
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

    // ─── 2. Load sender ───
    const { data: sender, error: userErr } = await supabase
      .from("users")
      .select(
        "id, full_name, transaction_pin, wallet_balance, wallet_id, bank_name, bank_account_number, bank78_personal_account_number, bank78_personal_bank_name, email, pin_attempts, pin_locked_until",
      )
      .eq("id", userId)
      .single();

    if (userErr || !sender) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ─── 3. PIN lock check ───
    if (
      sender.pin_locked_until &&
      new Date(sender.pin_locked_until) > new Date()
    ) {
      const mins = Math.ceil(
        (new Date(sender.pin_locked_until).getTime() - Date.now()) / 60000,
      );
      return NextResponse.json(
        {
          message: `PIN locked. Try again in ${mins} minutes.`,
          locked: true,
          lockedUntil: sender.pin_locked_until,
        },
        { status: 401 },
      );
    }

    // ─── 4. Verify PIN ───
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const pinOk = await bcrypt.compare(plainPin, sender.transaction_pin);

    if (!pinOk) {
      const attempts = (sender.pin_attempts || 0) + 1;
      const update: any = { pin_attempts: attempts };
      if (attempts >= 3) {
        update.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000);
      }
      await supabase.from("users").update(update).eq("id", userId);

      return NextResponse.json(
        {
          message: `Invalid transaction PIN. ${
            3 - attempts
          } attempt(s) remaining.`,
          remainingAttempts: Math.max(0, 3 - attempts),
        },
        { status: 401 },
      );
    }

    await supabase
      .from("users")
      .update({ pin_attempts: 0, pin_locked_until: null })
      .eq("id", userId);

    // ─── 5. Bank78-only guard ───
    const senderBank =
      sender.bank78_personal_bank_name || sender.bank_name || "";
    if (!senderBank.includes("Bank78")) {
      return NextResponse.json(
        { message: "Only Bank78 wallet users can perform P2P transfers" },
        { status: 403 },
      );
    }

    const senderBalanceBefore = Number(sender.wallet_balance || 0);
    if (senderBalanceBefore < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 },
      );
    }

    // ─── 6. Load receiver ───
    const { data: receiver, error: receiverErr } = await supabase
      .from("users")
      .select(
        "id, full_name, wallet_id, bank_name, bank_account_number, bank78_personal_account_number, bank78_personal_bank_name, email, wallet_balance",
      )
      .eq("wallet_id", receiverAccountId)
      .single();

    if (receiverErr || !receiver) {
      return NextResponse.json(
        { message: "Receiver wallet not found" },
        { status: 404 },
      );
    }

    if (
      sender.id === receiver.id ||
      sender.wallet_id === receiver.wallet_id ||
      sender.bank_account_number === receiver.bank_account_number
    ) {
      return NextResponse.json(
        { message: "You cannot transfer to your own account" },
        { status: 400 },
      );
    }

    const senderName = sender.full_name || "Zidwell User";
    const receiverName = receiver.full_name || "Zidwell User";
    const receiverBalanceBefore = Number(receiver.wallet_balance || 0);

    // ─── 7. References ───
    const ts = Date.now();
    const senderTxRef = `P2P_SND_${ts}_${userId}`;
    const receiverTxRef = `P2P_RCV_${ts}_${receiver.id}`;
    const invoiceTxRef = `INV_P2P_${ts}_${userId}`;
    const linkedTransactionId = `P2P_${ts}`;

    let senderDescription = `P2P transfer to ${receiverName}`;
    let receiverDescription = `P2P transfer from ${senderName}`;

    // ─── 8. Invoice detection ───
    let invoicePaymentData: any = null;
    let invoiceDetails: any = null;

    if (narration) {
      const invRef = extractInvoiceReference(narration);
      if (invRef) {
        let { data: invoice, error: invErr } = await supabase
          .from("invoices")
          .select("*")
          .eq("invoice_id", invRef)
          .single();

        if (invErr) {
          const { data: alt } = await supabase
            .from("invoices")
            .select("*")
            .ilike("invoice_id", invRef)
            .single();
          invoice = alt;
        }

        if (invoice && invoice.user_id === receiver.id) {
          invoicePaymentData = {
            isInvoicePayment: true,
            invoice_id: invoice.id,
            invoice_reference: invRef,
            invoice_owner_id: invoice.user_id,
            allow_multiple_payments: invoice.allow_multiple_payments || false,
          };
          invoiceDetails = invoice;
          senderDescription = `P2P payment for invoice ${invRef} to ${receiverName}`;
          receiverDescription = `P2P payment for invoice ${invRef} from ${senderName}`;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 9. DEDUCT sender
    // Your RPC returns TABLE(tx_id, current_balance - amt, 'OK'|'INSUFFICIENT_FUNDS')
    // We read the row by position because the columns are unnamed.
    // ═══════════════════════════════════════════════════════════
    const { data: deductRaw, error: deductErr } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "p2p_transfer",
        reference: senderTxRef,
        description: senderDescription,
      },
    );

    if (deductErr) {
      logger.error("deduct_wallet_balance failed", deductErr);
      return NextResponse.json(
        { message: "Failed to process transfer" },
        { status: 500 },
      );
    }

    const {
      txId: transactionId,
      newBalance: rpcNewBalance,
      status: rpcStatus,
    } = readDeductResult(deductRaw);

    if (rpcStatus === "INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        { message: "Insufficient funds for transfer" },
        { status: 400 },
      );
    }

    if (rpcStatus !== "OK" || !transactionId) {
      logger.error("deduct_wallet_balance unexpected result", { deductRaw });
      return NextResponse.json(
        { message: "Failed to process transfer" },
        { status: 500 },
      );
    }

    // Re-fetch sender balance to be safe
    const { data: senderAfter } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();
    const senderBalanceAfter = Number(
      senderAfter?.wallet_balance ?? rpcNewBalance ?? 0,
    );

    // ═══════════════════════════════════════════════════════════
    // 10. CREDIT receiver
    // increment_wallet_balance returns void — only check for errors.
    // ═══════════════════════════════════════════════════════════
    const { error: creditErr } = await supabase.rpc(
      "increment_wallet_balance",
      { user_id: receiver.id, amt: amount },
    );

    if (creditErr) {
      logger.error(
        "increment_wallet_balance failed, refunding sender",
        creditErr,
      );

      // Rollback sender debit
      await supabase.rpc("increment_wallet_balance", {
        user_id: userId,
        amt: amount,
      });

      // Mark sender tx as failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          description: `${senderDescription} — failed, refunded`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)
        .eq("user_id", userId);

      return NextResponse.json(
        { message: "Transfer failed, funds refunded" },
        { status: 500 },
      );
    }

    const { data: receiverAfter } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", receiver.id)
      .single();
    const receiverBalanceAfter = Number(receiverAfter?.wallet_balance || 0);

    // ─── 11. Platform fee on invoice payments ───
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
          payer_name: senderName,
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
        // Deduct platform fee from receiver via existing RPC
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
          category: category || narration,
          category_id: categoryId || null,
          balance_before: receiverBalanceBefore,
          balance_after: receiverBalanceAfter - platformFee,
          external_response: {
            invoice_payment: true,
            invoice_reference: invoicePaymentData.invoice_reference,
            fee_breakdown: {
              total_payment: amount,
              user_received: netAmount,
              platform_revenue: platformFee,
            },
          },
          sender: {
            name: senderName,
            accountNumber: sender.bank_account_number,
            bankName: sender.bank_name,
          },
          receiver: {
            name: receiverName,
            accountNumber: receiver.bank_account_number,
            bankName: receiver.bank_name,
          },
        },
      ]);
    }

    // ─── 12. Update sender transaction row to success ───
    await supabase
      .from("transactions")
      .update({
        status: "success",
        sender: {
          name: senderName,
          accountNumber: sender.bank_account_number,
          bankName: sender.bank_name,
        },
        receiver: {
          name: receiverName,
          accountNumber: receiver.bank_account_number,
          bankName: receiver.bank_name,
        },
        fee: 0,
        total_deduction: amount,
        narration,
        category: category || narration,
        category_id: categoryId || null,
        balance_before: senderBalanceBefore,
        balance_after: senderBalanceAfter,
        deducted_at: new Date().toISOString(),
        description: senderDescription,
        external_response: {
          status: "success",
          type: "internal_p2p",
          linked_transaction_id: linkedTransactionId,
          balances: {
            sender: {
              before: senderBalanceBefore,
              after: senderBalanceAfter,
              deducted: amount,
            },
            receiver: {
              before: receiverBalanceBefore,
              after: invoicePaymentData?.isInvoicePayment
                ? receiverBalanceAfter - platformFee
                : receiverBalanceAfter,
              credited: invoicePaymentData?.isInvoicePayment
                ? netAmount
                : amount,
              fee_deducted: invoicePaymentData?.isInvoicePayment
                ? platformFee
                : 0,
            },
          },
        },
      })
      .eq("id", transactionId)
      .eq("user_id", userId);

    // ─── 13. Insert receiver transaction row ───
    await supabase.from("transactions").insert({
      user_id: receiver.id,
      type: invoicePaymentData?.isInvoicePayment
        ? "invoice_payment"
        : "p2p_credit",
      amount: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
      status: "success",
      reference: receiverTxRef,
      narration,
      category: category || narration,
      category_id: categoryId || null,
      balance_before: receiverBalanceBefore,
      balance_after: invoicePaymentData?.isInvoicePayment
        ? receiverBalanceAfter - platformFee
        : receiverBalanceAfter,
      description: receiverDescription,
      fee: invoicePaymentData?.isInvoicePayment ? platformFee : 0,
      external_response: {
        status: "success",
        type: "internal_p2p",
        linked_transaction_id: linkedTransactionId,
        balances: {
          sender: {
            before: senderBalanceBefore,
            after: senderBalanceAfter,
            deducted: amount,
          },
          receiver: {
            before: receiverBalanceBefore,
            after: invoicePaymentData?.isInvoicePayment
              ? receiverBalanceAfter - platformFee
              : receiverBalanceAfter,
            credited: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
            fee_deducted: invoicePaymentData?.isInvoicePayment
              ? platformFee
              : 0,
          },
        },
      },
      sender: {
        name: senderName,
        accountNumber: sender.bank_account_number,
        bankName: sender.bank_name,
      },
      receiver: {
        name: receiverName,
        accountNumber: receiver.bank_account_number,
        bankName: receiver.bank_name,
      },
    });

    // ─── 14. Receipt + emails ───
    const receiptId = transactionId || linkedTransactionId;

    const receiptHtml = generateTransferReceipt({
      transactionId: receiptId,
      amount: Number(amount),
      date: new Date().toISOString(),
      recipientName: receiverName,
      recipientAccount:
        receiver.bank_account_number || receiver.wallet_id || "N/A",
      recipientBank: receiver.bank_name || "Zidwell",
      senderName,
      senderAccount: sender.bank_account_number || "N/A",
      narration: narration || "N/A",
      fee: 0,
      type: "p2p",
    });

    await Promise.all([
      sendP2PSuccessEmail({
        userId,
        receiverName,
        amount,
        transactionRef: linkedTransactionId,
        transactionId: receiptId,
        narration,
        isInvoicePayment: invoicePaymentData?.isInvoicePayment || false,
        invoiceReference: invoicePaymentData?.invoice_reference,
        receiptHtml,
      }).catch((e) => logger.error("Sender email failed", e)),

      sendP2PReceivedEmail({
        receiverId: receiver.id,
        senderName,
        amount: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
        transactionRef: linkedTransactionId,
        narration,
        isInvoicePayment: invoicePaymentData?.isInvoicePayment || false,
        invoiceReference: invoicePaymentData?.invoice_reference,
      }).catch((e) => logger.error("Receiver email failed", e)),
    ]);

    // ─── 15. Response ───
    const responseData: any = {
      message: "P2P transfer completed successfully.",
      transactionRef: linkedTransactionId,
      transactionId: receiptId,
      amount,
      receiverName,
      category: category || narration,
      categoryId: categoryId || null,
      balances: {
        sender: {
          before: senderBalanceBefore,
          after: senderBalanceAfter,
          deducted: amount,
        },
        receiver: {
          before: receiverBalanceBefore,
          after: invoicePaymentData?.isInvoicePayment
            ? receiverBalanceAfter - platformFee
            : receiverBalanceAfter,
          credited: invoicePaymentData?.isInvoicePayment ? netAmount : amount,
        },
      },
    };

    if (invoicePaymentData?.isInvoicePayment) {
      Object.assign(responseData, {
        invoicePayment: true,
        invoiceReference: invoicePaymentData.invoice_reference,
        platformFee,
        netAmount,
      });
    }

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    logger.error("P2P API error", err);
    return NextResponse.json(
      { error: "Server error: " + (err.message || err.description) },
      { status: 500 },
    );
  }
}
