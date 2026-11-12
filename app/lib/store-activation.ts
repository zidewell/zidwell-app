// app/lib/store-activation.ts

export const STORE_ACTIVATION_CONFIG = {
  PROMO_CODE: process.env.STORE_ACTIVATION_PROMO_CODE || "ZIDSTORE1000",
  ORIGINAL_FEE: Number(process.env.STORE_ACTIVATION_ORIGINAL_FEE) || 5000,
  PROMO_FEE: Number(process.env.STORE_ACTIVATION_PROMO_FEE) || 1000,
  DURATION_MINUTES: Number(process.env.STORE_ACTIVATION_PROMO_DURATION_MINUTES) || 60,
};

export type PromoStatus = 'active' | 'used' | 'expired';

export interface StoreActivationPromo {
  id: string;
  user_id: string;
  promo_code: string;
  original_fee: number;
  discounted_fee: number;
  status: PromoStatus;
  expires_at: string;
  used_at?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}
