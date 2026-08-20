export type FeeResult = {
  nombaFee: number;
  appFee: number;
  totalFee: number;
  totalDebit: number;
};

export type SubscriptionTier = 'free' | 'starter' | 'sme' | 'enterprise' | 'console';

export interface TierFeeConfig {
  transactionFeePercent: number;
  monthlyMaintenanceFee: number;
  activationFee: number;
  transferFee: number;
  hasUnlimitedTransactions: boolean;
}

export const TIER_FEE_CONFIGS: Record<SubscriptionTier, TierFeeConfig> = {
  free: {
    transactionFeePercent: 0.2, // 0.2% per transaction
    monthlyMaintenanceFee: 0,
    activationFee: 1000, // N1000 activation fee
    transferFee: 50,
    hasUnlimitedTransactions: false,
  },
  starter: {
    transactionFeePercent: 0.5, // 0.5% per transaction
    monthlyMaintenanceFee: 0,
    activationFee: 0,
    transferFee: 50,
    hasUnlimitedTransactions: true,
  },
  sme: {
    transactionFeePercent: 0.3, // 0.3% per transaction
    monthlyMaintenanceFee: 0,
    activationFee: 0,
    transferFee: 50,
    hasUnlimitedTransactions: true,
  },
  enterprise: {
    transactionFeePercent: 0.2, // 0.2% per transaction
    monthlyMaintenanceFee: 0,
    activationFee: 0,
    transferFee: 0,
    hasUnlimitedTransactions: true,
  },
  console: {
    transactionFeePercent: 0, // Custom pricing - 0% for standard transactions
    monthlyMaintenanceFee: 0,
    activationFee: 0,
    transferFee: 0,
    hasUnlimitedTransactions: true,
  },
};

export function calculateFees(
  amount: number,
  type: "transfer" | "deposit" | "card",
  paymentMethod: "checkout" | "virtual_account" | "bank_transfer" | "p2p" = "checkout",
  tier: SubscriptionTier = "free"
): FeeResult {
  const am = Number(amount) || 0;
  const tierConfig = TIER_FEE_CONFIGS[tier];

  let nombaFee = 0;
  let appFee = 0;

  // Calculate base transaction fee based on tier
  const transactionFee = am * (tierConfig.transactionFeePercent / 100);

  // Calculate fees based on payment method
  if (paymentMethod === "checkout") {
    // Checkout: Nomba charges 1.4% + ₦1800, we charge same to customer
    const nombaPercentage = am * 0.014; // 1.4%
    nombaFee = nombaPercentage + 1800; // + ₦1800 flat fee
    appFee = tierConfig.hasUnlimitedTransactions ? nombaFee : nombaFee + transactionFee;
  } 
  else if (paymentMethod === "virtual_account") {
    // Virtual Account: Nomba charges 0.5% (₦10 min, ₦100 cap), we charge same
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 10), 100); // Min ₦10, Max ₦100
    appFee = tierConfig.hasUnlimitedTransactions ? nombaFee : nombaFee + transactionFee;
  } 
  else if (paymentMethod === "bank_transfer") {
    // Pay by Transfer: Nomba charges 0.5% (₦20 min, ₦100 cap)
    const nombaPercentage = am * 0.005; // 0.5%
    nombaFee = Math.min(Math.max(nombaPercentage, 20), 100); // Min ₦20, Max ₦100
    
    // Zidwell charges based on tier
    const zidwellFee = tierConfig.transferFee;
    
    // Customer pays Nomba fee + Zidwell tier fee
    appFee = nombaFee + zidwellFee;
  }

  const totalFee = appFee;
  const totalDebit = am + totalFee;

  // round to 2 decimals
  return {
    nombaFee: Math.round(nombaFee * 100) / 100,
    appFee: Math.round(appFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    totalDebit: Math.round(totalDebit * 100) / 100,
  };
}

export function getTierActivationFee(tier: SubscriptionTier): number {
  return TIER_FEE_CONFIGS[tier]?.activationFee || 0;
}

export function getTierTransactionFeePercent(tier: SubscriptionTier): number {
  return TIER_FEE_CONFIGS[tier]?.transactionFeePercent || 0;
}

export function getTierMonthlyMaintenanceFee(tier: SubscriptionTier): number {
  return TIER_FEE_CONFIGS[tier]?.monthlyMaintenanceFee || 0;
}

export function getTierTransferFee(tier: SubscriptionTier): number {
  return TIER_FEE_CONFIGS[tier]?.transferFee || 0;
}

export function hasUnlimitedTransactions(tier: SubscriptionTier): boolean {
  return TIER_FEE_CONFIGS[tier]?.hasUnlimitedTransactions || false;
}

// currency formatter ₦1,000.00
export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
