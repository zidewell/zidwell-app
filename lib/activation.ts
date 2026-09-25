// lib/activation.ts
import { getSupabaseAdmin } from "@/lib/suabase-admin";

export const ACTIVATION_FEE = 1000;         // ₦1,000
export const ACTIVATION_MIN_FUNDING = 2000; // ₦2,000

export interface ActivationResult {
  ok: boolean;
  activated?: boolean;
  reason?: string;
  newBalance?: number;
  feeCharged?: number;
}

/**
 * Called when a Bank78 wallet inflow is detected.
 * If the user isn't activated yet and the inflow pushes their balance
 * to at least ₦2,000, debit ₦1,000 and mark them activated.
 *
 * Idempotent: safe to call multiple times.
 */
export async function processActivation(params: {
  userId: string;
  inflowAmount: number;              // in naira
  inflowReference?: string;          // Bank78 ref for reconciliation
  inflowProviderTxId?: string;       // Bank78 tx id
  inflowChannel?: string;
  inflowSender?: Record<string, any>;
}): Promise<ActivationResult> {
  const supabase = getSupabaseAdmin() as any;

  // ─── 1. Load current user state ───
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, wallet_balance, activation_paid, bank78_verified, primary_provider, bank78_personal_account_number, bank78_business_account_number"
    )
    .eq("id", params.userId)
    .single();

  if (error || !user) {
    return { ok: false, reason: "User not found" };
  }

  if (!user.bank78_verified) {
    return { ok: false, reason: "Identity not verified" };
  }

  // ─── 2. Compute the balance after this inflow ───
  const currentBalance = Number(user.wallet_balance || 0);
  const balanceAfterInflow = currentBalance + params.inflowAmount;

  const accountNumber =
    user.bank78_business_account_number ||
    user.bank78_personal_account_number ||
    null;

  // ─── 3. Log the inflow (idempotent via unique reference) ───
  const inflowRef =
    params.inflowReference || `bank78_inflow_${params.userId}_${Date.now()}`;

  try {
    await supabase.from("transactions").insert({
      user_id: params.userId,
      type: "wallet_funding",
      amount: params.inflowAmount,
      status: "success",
      reference: inflowRef,
      narration: "Wallet funding via Bank78",
      description: "Incoming transfer to your Zidwell wallet",
      provider: "bank78",
      provider_transaction_id: params.inflowProviderTxId || null,
      provider_account_id: accountNumber,
      channel: params.inflowChannel || "bank_transfer",
      category: "funding",
      sender: params.inflowSender || null,
      gross_amount: params.inflowAmount,
      net_amount: params.inflowAmount,
      balance_before: currentBalance,
      balance_after: balanceAfterInflow,
      metadata: {
        activation_triggered:
          balanceAfterInflow >= ACTIVATION_MIN_FUNDING,
      },
    });
  } catch (err: any) {
    if (!String(err?.message || "").toLowerCase().includes("duplicate")) {
      console.error("[activation] Failed to log inflow:", err.message);
    }
  }

  // ─── 4. Already activated? Just credit and return ───
  if (user.activation_paid) {
    await supabase
      .from("users")
      .update({ wallet_balance: balanceAfterInflow })
      .eq("id", params.userId);

    return {
      ok: true,
      activated: true,
      reason: "Already activated",
      newBalance: balanceAfterInflow,
    };
  }

  // ─── 5. Not enough yet? Credit, don't activate ───
  if (balanceAfterInflow < ACTIVATION_MIN_FUNDING) {
    await supabase
      .from("users")
      .update({ wallet_balance: balanceAfterInflow })
      .eq("id", params.userId);

    return {
      ok: true,
      activated: false,
      reason: `Below activation minimum (₦${ACTIVATION_MIN_FUNDING})`,
      newBalance: balanceAfterInflow,
    };
  }

  // ─── 6. Activate: debit fee, mark paid ───
  const newBalance = balanceAfterInflow - ACTIVATION_FEE;
  const activationRef = `activation_fee_${params.userId}_${Date.now()}`;

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      wallet_balance: newBalance,
      activation_paid: true,
      activated_at: new Date().toISOString(),
      activation_reference: activationRef,
    })
    .eq("id", params.userId);

  if (updateErr) {
    return { ok: false, reason: "Failed to update wallet" };
  }

  // ─── 7. Log the activation fee ───
  try {
    await supabase.from("transactions").insert({
      user_id: params.userId,
      type: "activation_fee",
      amount: ACTIVATION_FEE,
      status: "success",
      reference: activationRef,
      narration: "Account activation fee",
      description: "One-time fee to activate your Zidwell account",
      provider: "bank78",
      category: "fee",
      gross_amount: ACTIVATION_FEE,
      net_amount: ACTIVATION_FEE,
      balance_before: balanceAfterInflow,
      balance_after: newBalance,
      metadata: {
        inflow_reference: inflowRef,
        inflow_amount: params.inflowAmount,
      },
    });
  } catch (err: any) {
    console.error(
      "[activation] Failed to log activation fee:",
      err.message
    );
  }

  return {
    ok: true,
    activated: true,
    newBalance,
    feeCharged: ACTIVATION_FEE,
  };
}