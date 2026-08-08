// app/lib/subscription/subscription-types.ts (UPDATED with real plan names)

export interface SubscriptionPlan {
  tier: 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  features: string[];
}

export const PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    monthlyAmount: 0,
    yearlyAmount: 0,
    features: [
      'Manual bookkeeping — Global',
      'Auto-bookkeeping (Wallet users, Nigeria)',
      'Payment Links & Sales pages (Nigeria)',
      'Free business bank account (Nigeria)',
      'Up to 5 invoices — Global',
      'Up to 5 receipts — Global',
      'Basic financial overview',
    ],
  },
  {
    tier: 'solopreneur',
    name: 'Solopreneur',
    monthlyAmount: 4900,
    yearlyAmount: 49000,
    features: [
      'Everything in Free, plus:',
      'Up to 10 invoices',
      'Unlimited receipts',
      'Branded invoices',
      'Better expense tracking',
      'Basic financial insights',
    ],
  },
  {
    tier: 'sme',
    name: 'SME',
    monthlyAmount: 29900,
    yearlyAmount: 299000,
    features: [
      'Everything in Solopreneur, plus:',
      'Upload bank statements (PDF / Excel / CSV)',
      'Connect up to 3 bank accounts — Nigeria',
      'Auto-bookkeeping from connected accounts — Nigeria',
      'Unlimited invoices & receipts',
      'Vault — store financial documents safely',
      'Tax calculator',
      'Financial statements (view): P&L · Cashflow · Balance Sheet',
      '1 extra team member',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    monthlyAmount: 100000,
    yearlyAmount: 1000000,
    features: [
      'Everything in SME, plus:',
      'Multi-user access (full team)',
      'Role-based permissions',
      'Approvals for payments, invoices, receipts, transfers',
      'Connect up to 5 bank accounts — Nigeria',
      'Downloadable financial reports',
      '10 contracts',
      'Dedicated onboarding support',
    ],
  },
  {
    tier: 'corporation',
    name: 'Corporation',
    monthlyAmount: 300000,
    yearlyAmount: 3000000,
    features: [
      'Everything in Enterprise, plus:',
      'Unlimited contracts',
      'Department-based access (HR, Finance, Ops…)',
      'Connect unlimited bank accounts — Nigeria',
      'Simple payroll system',
      'Advanced financial reporting',
      'Custom financial structure setup',
      'Priority onboarding & dedicated account manager',
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
  return ['sme', 'enterprise', 'corporation'].includes(tier);
};

// Helper to check if tier has unlimited receipts
export const hasUnlimitedReceipts = (tier: string): boolean => {
  return ['solopreneur', 'sme', 'enterprise', 'corporation'].includes(tier);
};