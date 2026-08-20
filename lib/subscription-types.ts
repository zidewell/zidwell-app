// app/lib/subscription/subscription-types.ts (UPDATED with real plan names)

export interface SubscriptionPlan {
  tier: 'free' | 'starter' | 'sme' | 'enterprise' | 'console';
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  threeMonthAmount: number;
  features: string[];
}

export const PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'FREE',
    monthlyAmount: 0,
    yearlyAmount: 0,
    threeMonthAmount: 0,
    features: [
      'Business bank account at 0.2% per transaction',
      'Business account activation fee: N1000',
      'Payment links and payment APIs',
      'Available for Nigeria only',
    ],
  },
  {
    tier: 'starter',
    name: 'STARTER',
    monthlyAmount: 9900,
    yearlyAmount: 99900,
    threeMonthAmount: 29900,
    features: [
      'Everything in Free, plus:',
      'Business Plan Template',
      'Bookkeeping Tool',
      'Invoice Tool',
      'Receipt Tool',
      'Document Vault',
    ],
  },
  {
    tier: 'sme',
    name: 'SME',
    monthlyAmount: 19900,
    yearlyAmount: 199900,
    threeMonthAmount: 59900,
    features: [
      'Everything in Starter, plus:',
      'Tax tool',
      'Product webpage',
      'One Extra User',
      'Switch between Accounts',
      'Add-ons (additional fee): Payroll, HMO, Tax Filing Support',
    ],
  },
  {
    tier: 'enterprise',
    name: 'ENTERPRISE',
    monthlyAmount: 59900,
    yearlyAmount: 599900,
    threeMonthAmount: 179900,
    features: [
      'Everything in SME, plus:',
      'Advanced Bookkeeping Tool',
      'Connected bank accounts',
      'Contract Tool',
      'Upload bank statements',
      'Downloadable financial statements',
      '2 Extra Users',
      'Add-ons (additional fee): Payroll, HMO, Tax Filing Support',
    ],
  },
  {
    tier: 'console',
    name: 'CONSOLE',
    monthlyAmount: 0,
    yearlyAmount: 0,
    threeMonthAmount: 0,
    features: [
      'Custom Pricing',
      'Sub accounts - create multiple accounts for people and outlets',
      'Multi-users + signatories',
      'Request and Approval workflow',
      'Advanced finance dashboard',
      'Plus every other tool on Zidwell',
    ],
  },
];

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  amount: number;
  payment_method: 'card' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  nomba_transaction_id?: string;
  metadata: {
    planTier: string;
    billingPeriod: 'monthly' | 'yearly';
    [key: string]: any;
  };
  subscription_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  tier: string;
  status: 'active' | 'cancelled' | 'expired';
  expires_at: string;
  auto_renew: boolean;
  payment_method: string;
  started_at: string;
}

export interface ProcessSubscriptionParams {
  nombaTransactionId: string;
  orderReference: string;
  amount?: number;
}

export interface BankTransferSubscriptionParams {
  nombaTransactionId: string;
  aliasAccountReference: string;
  transactionAmount: number;
  customer: any;
  tx: any;
}

// Helper to get plan by tier
export const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
  return PLANS.find(plan => plan.tier === tier);
};

// Helper to get plan price
export const getPlanPrice = (tier: string, billingPeriod: 'monthly' | 'yearly'): number => {
  const plan = getPlanByTier(tier);
  if (!plan) return 0;
  return billingPeriod === 'monthly' ? plan.monthlyAmount : plan.yearlyAmount;
};

// Helper to check if tier has unlimited invoices
export const hasUnlimitedInvoices = (tier: string): boolean => {
  return ['starter', 'sme', 'enterprise', 'console'].includes(tier);
};

// Helper to check if tier has unlimited receipts
export const hasUnlimitedReceipts = (tier: string): boolean => {
  return ['starter', 'sme', 'enterprise', 'console'].includes(tier);
};