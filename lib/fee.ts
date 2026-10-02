// lib/fee.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tier-based fee engine for Zidwell transfers.
//
// TIER 3 (default):
//   Per transfer: ₦100K  | Daily: ₦500K   | Inflow: ₦50  | Outflow: ₦50 flat
// TIER 2:
//   Per transfer: ₦5M    | Daily: ₦50M    | Inflow: ₦100 | Outflow: 0.2% (min ₦50)
// TIER 1:
//   Per transfer: ₦10M   | Daily: ₦100M   | Inflow: ₦100 | Outflow: 0.1% (min ₦100)
//
// Per-user overrides:
//   Users may have `custom_outflow_percent` and `custom_outflow_min` set.
//   When set, these REPLACE the tier defaults for OUTFLOW only.
//   Inflow always uses the tier default.
// ─────────────────────────────────────────────────────────────────────────────

export type AccountTier = "tier_3" | "tier_2" | "tier_1";
export type TransferDirection = "inflow" | "outflow";

// ✅ Per-user custom overrides
export type CustomOverrides = {
  custom_outflow_percent?: number | null;
  custom_outflow_min?: number | null;
};

export type FeeResult = {
  nombaFee: number;
  appFee: number;
  totalFee: number;
  totalDebit: number;
  tier: AccountTier;
  direction: TransferDirection;
  feeLabel: string;
  usedCustomRate: boolean;
};

// ─── TIER CONFIG ────────────────────────────────────────────────
export const TIER_CONFIG = {
  tier_3: {
    label: "Tier 3",
    perTransferLimit: 100_000,
    dailyLimit: 500_000,
    inflowFee: 50,
    outflowFeeFlat: 50,
    outflowPercent: 0,
    outflowMin: 50,
    outflowIsPercent: false,
    kycRequirement: "BVN with face, CAC Number (RC or BN)",
  },
  tier_2: {
    label: "Tier 2",
    perTransferLimit: 5_000_000,
    dailyLimit: 50_000_000,
    inflowFee: 100,
    outflowFeeFlat: 0,
    outflowPercent: 0.002, // 0.2%
    outflowMin: 50,
    outflowIsPercent: true,
    kycRequirement:
      "BVN with face, CAC Number (RC or BN), Address verification (utility bill), location tracking enabled",
  },
  tier_1: {
    label: "Tier 1",
    perTransferLimit: 10_000_000,
    dailyLimit: 100_000_000,
    inflowFee: 100,
    outflowFeeFlat: 0,
    outflowPercent: 0.001, // 0.1%
    outflowMin: 100,
    outflowIsPercent: true,
    kycRequirement:
      "BVN with face, CAC Number (RC or BN), Address verification (utility bill), location tracking enabled, video call with account owner",
  },
} as const;

// ─── FEE CALCULATOR ─────────────────────────────────────────────
export function calculateFees(
  amount: number,
  type: "transfer" | "deposit" | "card",
  paymentMethod:
    | "checkout"
    | "virtual_account"
    | "bank_transfer"
    | "p2p" = "checkout",
  tier: AccountTier = "tier_3",
  direction: TransferDirection = "outflow",
  overrides: CustomOverrides = {}
): FeeResult {
  const am = Number(amount) || 0;
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.tier_3;

  let nombaFee = 0;
  let appFee = 0;
  let feeLabel = "";
  let usedCustomRate = false;

  // ── Bank transfer ──
  if (paymentMethod === "bank_transfer") {
    nombaFee = Math.min(Math.max(am * 0.005, 20), 100);

    if (direction === "inflow") {
      appFee = config.inflowFee;
      feeLabel = `Inflow fee — ${config.label} (₦${config.inflowFee} flat)`;
    } else {
      const hasCustomPercent =
        overrides.custom_outflow_percent != null &&
        Number.isFinite(Number(overrides.custom_outflow_percent));

      const hasCustomMin =
        overrides.custom_outflow_min != null &&
        Number.isFinite(Number(overrides.custom_outflow_min));

      if (hasCustomPercent) {
        const pct = Number(overrides.custom_outflow_percent);
        const min = hasCustomMin
          ? Number(overrides.custom_outflow_min)
          : config.outflowMin;

        const pctFee = am * pct;
        appFee = Math.max(pctFee, min);
        usedCustomRate = true;
        feeLabel = `Outflow — ${config.label} (custom ${(pct * 100).toFixed(
          2
        )}%, min ₦${min.toLocaleString()})`;
      } else if (config.outflowIsPercent) {
        const pctFee = am * config.outflowPercent;
        appFee = Math.max(pctFee, config.outflowMin);
        feeLabel = `Outflow — ${config.label} (${
          config.outflowPercent * 100
        }%, min ₦${config.outflowMin})`;
      } else {
        appFee = config.outflowFeeFlat;
        feeLabel = `Outflow — ${config.label} (₦${config.outflowFeeFlat} flat)`;
      }
    }
  }
  // ── Checkout ──
  else if (paymentMethod === "checkout") {
    const nombaPercentage = am * 0.014;
    nombaFee = nombaPercentage + 1800;
    appFee = nombaFee;
    feeLabel = "Checkout fee (1.4% + ₦1,800)";
  }
  // ── Virtual account ──
  else if (paymentMethod === "virtual_account") {
    const nombaPercentage = am * 0.005;
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100);
    appFee = nombaFee;
    feeLabel = "Virtual account fee (0.5%, min ₦10, max ₦100)";
  }

  const totalFee = appFee;
  const totalDebit = am + totalFee;

  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    appFee: Math.round(appFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
    tier,
    direction,
    feeLabel,
    usedCustomRate,
  };
}

// ─── LIMIT CHECKER ──────────────────────────────────────────────
export type LimitCheckResult = {
  allowed: boolean;
  reason?: string;
  perTransferLimit: number;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
};

export function checkTransferLimits(
  amount: number,
  tier: AccountTier,
  dailyTotalSoFar: number = 0
): LimitCheckResult {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.tier_3;
  const dailyRemaining = Math.max(config.dailyLimit - dailyTotalSoFar, 0);

  if (amount > config.perTransferLimit) {
    return {
      allowed: false,
      reason: `Amount exceeds your ${config.label} per-transfer limit of ${formatNaira(
        config.perTransferLimit
      )}`,
      perTransferLimit: config.perTransferLimit,
      dailyLimit: config.dailyLimit,
      dailyUsed: dailyTotalSoFar,
      dailyRemaining,
    };
  }

  if (dailyTotalSoFar + amount > config.dailyLimit) {
    return {
      allowed: false,
      reason: `This transfer would exceed your ${config.label} daily limit of ${formatNaira(
        config.dailyLimit
      )}. Used today: ${formatNaira(dailyTotalSoFar)}. Remaining: ${formatNaira(
        dailyRemaining
      )}`,
      perTransferLimit: config.perTransferLimit,
      dailyLimit: config.dailyLimit,
      dailyUsed: dailyTotalSoFar,
      dailyRemaining,
    };
  }

  return {
    allowed: true,
    perTransferLimit: config.perTransferLimit,
    dailyLimit: config.dailyLimit,
    dailyUsed: dailyTotalSoFar,
    dailyRemaining,
  };
}

// ─── CURRENCY FORMATTER ─────────────────────────────────────────
export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);