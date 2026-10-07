// lib/activation.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const ACTIVATION_FEE = 1000;
export const ACTIVATION_MIN_FUNDING = 2000;

export interface ActivationResult {
  ok: boolean;
  activated?: boolean;
  reason?: string;
  newBalance?: number;
  feeCharged?: number;
}

const debug = (label: string, data?: any) =>
  console.log(`[activation] ${label}`, data ?? "");

/**
 * Fee-only activation.
 *
 * Runs AFTER a wallet deposit has been credited. Only debits the
 * ₦1,000 activation fee if the balance has reached ₦2,000+.
 *
 *   - Already activated?  → no-op
 *   - Balance < ₦2,000?   → no-op
 *   - Otherwise:          → debit ₦1,000, mark activated
 *
 * Idempotent. Safe to call multiple times for the same user.
 */
export async function processActivation(params: {
  userId: string;
  inflowAmount: number;
  inflowReference?: string;
  inflowProviderTxId?: string;
  inflowChannel?: string;
  inflowSender?: Record<string, any>;
}): Promise<ActivationResult> {
  const supabase = getSupabaseAdmin() as any;

  debug("Processing activation for", {
    userId: params.userId,
    inflowAmount: params.inflowAmount,
  });

  // ─── 1. Load user ───
  const { data: user, error } = await supabase
    .from("users")
    .select("id, wallet_balance, activation_paid")
    .eq("id", params.userId)
    .single();

  if (error || !user) {
    debug("User not found", error);
    return { ok: false, reason: "User not found" };
  }

  // ─── 2. Already activated ───
  if (user.activation_paid) {
    debug("Already activated — no-op");
    return {
      ok: true,
      activated: true,
      reason: "Already activated",
      newBalance: Number(user.wallet_balance),
    };
  }

  // ─── 3. Below minimum ───
  const currentBalance = Number(user.wallet_balance || 0);
  if (currentBalance < ACTIVATION_MIN_FUNDING) {
    debug("Below activation minimum", {
      currentBalance,
      minimum: ACTIVATION_MIN_FUNDING,
    });
    return {
      ok: true,
      activated: false,
      reason: `Below activation minimum (₦${ACTIVATION_MIN_FUNDING})`,
      newBalance: currentBalance,
    };
  }

  // ─── 4. Debit the fee ───
  const newBalance = currentBalance - ACTIVATION_FEE;
  const activationRef = `activation_fee_${params.userId}_${Date.now()}`;

  debug("Debiting activation fee", {
    currentBalance,
    newBalance,
    fee: ACTIVATION_FEE,
  });

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
    console.error("[activation] User update failed:", updateErr.message);

    // Rollback: restore balance + deactivate
    try {
      await supabase
        .from("users")
        .update({
          wallet_balance: currentBalance,
          activation_paid: false,
          activated_at: null,
          activation_reference: null,
        })
        .eq("id", params.userId);
      debug("Rolled back activation flag");
    } catch (rollbackErr: any) {
      console.error(
        "[activation] Rollback failed:",
        rollbackErr.message
      );
    }

    return { ok: false, reason: "Failed to update wallet" };
  }

  // ─── 5. Log the fee ───
  try {
    await supabase.from("transactions").insert({
      user_id: params.userId,
      type: "activation_fee",
      amount: ACTIVATION_FEE,
      status: "success",
      reference: activationRef,
      narration: "Account activation fee",
      description: "One-time fee to activate your Zidwell account",
      provider: "nomba",
      category: "fee",
      gross_amount: ACTIVATION_FEE,
      net_amount: ACTIVATION_FEE,
      balance_before: currentBalance,
      balance_after: newBalance,
      metadata: {
        inflow_reference: params.inflowReference || null,
        inflow_amount: params.inflowAmount,
        inflow_channel: params.inflowChannel || "virtual_account",
        inflow_sender: params.inflowSender || null,
        activation_paid_at: new Date().toISOString(),
      },
    });
    debug("Fee logged");
  } catch (logErr: any) {
    // Non-fatal — the user is activated; the log is for audit only
    console.warn(
      "[activation] Failed to log fee (non-fatal):",
      logErr.message
    );
  }

  debug("Activation successful", { newBalance });

  return {
    ok: true,
    activated: true,
    newBalance,
    feeCharged: ACTIVATION_FEE,
  };
}