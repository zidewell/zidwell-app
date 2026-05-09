// app/lib/subscription/subscription-types.ts

export interface SubscriptionPlan {
  tier: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  features: string[];
}

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