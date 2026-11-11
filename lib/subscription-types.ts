// lib/subscription-types.ts

export interface SubscriptionPlan {
  tier: "free" | "starter" | "sme" | "enterprise" | "console";
  name: string;
  yearlyAmount: number;
  features: string[];
  addons?: string[];
}

export const PLANS: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "Free",
    yearlyAmount: 0,
    features: [
      "Up to 5 invoices",
      "Up to 5 receipts",
      "Business Plan Template",
      "Basic financial overview",
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    yearlyAmount: 99900,
    features: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "Online storefront",
      "Document Vault",
    ],
  },
  {
    tier: "sme",
    name: "SME",
    yearlyAmount: 199900,
    features: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "One Extra User",
    ],
    addons: [
      "Payroll",
      "HMO",
      "Tax Filing Support",
      "Virtual office/mailing address",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    yearlyAmount: 599900,
    features: [
      "Business bank account",
      "Increased transaction limits",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Connect Your Bank Accounts",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "Three Extra Users",
      "Dedicated support team",
    ],
    addons: [
      "Payroll",
      "HMO",
      "Tax Filing Support",
      "Virtual office/mailing address",
    ],
  },
  {
    tier: "console",
    name: "Console",
    yearlyAmount: 0,
    features: [
      "Everything in Enterprise",
      "Sub Accounts",
      "Roles & Permissions",
      "Approvals",
      "Unlimited users",
      "Custom pricing",
    ],
  },
];

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  amount: number;
  payment_method: "card" | "bank_transfer";
  status: "pending" | "completed" | "failed";
  reference: string;
  nomba_transaction_id?: string;
  metadata: {
    planTier: string;
    billingPeriod: "yearly";
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
  status: "active" | "cancelled" | "expired";
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

export const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
  return PLANS.find((plan) => plan.tier === tier);
};

export const getPlanPrice = (tier: string): number => {
  const plan = getPlanByTier(tier);
  if (!plan) return 0;
  return plan.yearlyAmount;
};

export const hasUnlimitedInvoices = (tier: string): boolean => {
  return ["starter", "sme", "enterprise", "console"].includes(tier);
};

export const hasUnlimitedReceipts = (tier: string): boolean => {
  return ["starter", "sme", "enterprise", "console"].includes(tier);
};