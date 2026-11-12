// lib/store-activation.ts
// Centralized configuration for store activation promo system
// Following 12-Factor: all config from env vars with fail-fast validation

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function intEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid integer for ${name}: ${value}`);
  }
  return parsed;
}

function numEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for ${name}: ${value}`);
  }
  return parsed;
}

export const STORE_ACTIVATION_CONFIG = {
  PROMO_CODE: optionalEnv('STORE_ACTIVATION_PROMO_CODE', 'ZIDSTORE1000'),
  ORIGINAL_FEE: numEnv('STORE_ACTIVATION_ORIGINAL_FEE', 5000),
  PROMO_FEE: numEnv('STORE_ACTIVATION_PROMO_FEE', 1000),
  DURATION_MINUTES: intEnv('STORE_ACTIVATION_PROMO_DURATION_MINUTES', 60),
} as const;

export interface StoreActivationPromo {
  id: string;
  user_id: string;
  promo_code: string;
  original_fee: number;
  discounted_fee: number;
  status: 'active' | 'used' | 'expired';
  expires_at: string;
  used_at: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}