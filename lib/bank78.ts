// lib/bank78.ts
import { fetchWithRetry } from "./fetch-with-retry";

let cachedToken: string | null = null;
let tokenExpiry = 0;

// ─────────────────────────────────────────────────────────────
// AUTH — client credentials token (cached, refreshed 5 min early)
// ─────────────────────────────────────────────────────────────
export async function getBank78Token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const res = await fetchWithRetry(
    `${process.env.BANK78_BASE_URL}/identity/connect/token`,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.BANK78_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.BANK78_CLIENT_ID!,
        client_secret: process.env.BANK78_SECRET_KEY!,
        grant_type: "client_credentials",
      }).toString(),
    }
  );

  const data = await res.json();
  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.error_description || data?.error || "Bank78 auth failed"
    );
  }

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) - 300;
  return cachedToken!;
}

// ─────────────────────────────────────────────────────────────
// CREATE VIRTUAL NUBAN (user's wallet account)
// ─────────────────────────────────────────────────────────────
export interface CreateWalletParams {
  userId: string;              // your internal user id (uuid)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn?: string;
  nin?: string;
  accountName?: string;        // override for business accounts
  accountType?: 1 | 2;         // 1 = static, 2 = dynamic
}

export interface Bank78Wallet {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string | null;
  accountReference: string;
  reservationReference?: string;
}

export async function createBank78Wallet(
  params: CreateWalletParams
): Promise<{ ok: boolean; wallet?: Bank78Wallet; error?: string; raw?: any }> {
  const token = await getBank78Token();

  const accountReference = `ZIDWELL-${params.userId}`;
  const accountName =
    params.accountName?.trim() ||
    `${params.firstName} ${params.lastName}`.trim();

  const body: Record<string, any> = {
    accountReference,
    accountName,
    emailAddress: params.email,
    phoneNumber: params.phone,
    accountType: params.accountType ?? 1,
    expiresInMinutes: 0,
  };
  if (params.bvn) body.bvn = params.bvn;
  if (params.nin) body.nin = params.nin;

  try {
    const res = await fetchWithRetry(
      `${process.env.BANK78_BASE_URL}/virtual-nuban/api/virtual-nubans/initialize`,
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.BANK78_API_KEY!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const raw = await res.json();
    const payload = raw?.result ?? raw?.data ?? raw;
    const accountNumber: string | undefined = payload?.accountNumber;

    if (!res.ok || !accountNumber) {
      return {
        ok: false,
        error:
          raw?.message ||
          raw?.error_description ||
          raw?.error ||
          "Bank78 wallet creation failed",
        raw,
      };
    }

    return {
      ok: true,
      wallet: {
        accountNumber,
        accountName: payload?.accountName || accountName,
        bankName: payload?.bankName || "Bank78",
        bankCode: payload?.bankCode ?? null,
        accountReference: payload?.accountReference || accountReference,
        reservationReference: payload?.reservationReference,
      },
      raw,
    };
  } catch (err: any) {
    console.error("[BANK78] createBank78Wallet exception:", err.message);
    return { ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// WITHDRAWAL / INTER-BANK TRANSFER (Payout API)
// ─────────────────────────────────────────────────────────────
export interface WithdrawParams {
  reference: string;           // your unique ref
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName?: string;
  amount: number;              // naira
  narration?: string;
}

export interface WithdrawResult {
  ok: boolean;
  batchReference?: string;
  status?: string;
  message?: string;
  raw?: any;
}

export async function createBank78Withdrawal(
  params: WithdrawParams
): Promise<WithdrawResult> {
  const token = await getBank78Token();

  const body = {
    name: "Withdrawal",
    beneficiaries: [
      {
        reference: params.reference,
        accountName: params.accountName,
        accountNumber: params.accountNumber,
        bankCode: params.bankCode,
        bankName: params.bankName || "",
        amount: params.amount,
        narration: params.narration || "Wallet withdrawal",
        isLocal: true,
        isValid: true,
        vat: 0,
        charges: 0,
      },
    ],
  };

  try {
    const res = await fetchWithRetry(
      `${process.env.BANK78_BASE_URL}/payout/bulk`,
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.BANK78_API_KEY!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const raw = await res.json();
    const payload = raw?.result ?? raw?.data ?? raw;

    if (!res.ok) {
      return {
        ok: false,
        message: raw?.message || raw?.error || "Withdrawal request failed",
        raw,
      };
    }

    return {
      ok: true,
      batchReference: payload?.batchReference,
      status: payload?.status,
      message: payload?.message || "Withdrawal submitted",
      raw,
    };
  } catch (err: any) {
    console.error("[BANK78] createBank78Withdrawal exception:", err.message);
    return { ok: false, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// QUERY WITHDRAWAL STATUS
// ─────────────────────────────────────────────────────────────
export async function getBank78WithdrawalStatus(batchReference: string) {
  const token = await getBank78Token();

  const res = await fetchWithRetry(
    `${process.env.BANK78_BASE_URL}/payout/bulk/status/${batchReference}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.BANK78_API_KEY!,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION HISTORY (to reconcile wallet credits)
// ─────────────────────────────────────────────────────────────
export async function getBank78TransactionHistory(params: {
  accountRef: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  accountNumber?: string;
}) {
  const token = await getBank78Token();

  const res = await fetchWithRetry(
    `${process.env.BANK78_BASE_URL}/virtual-nuban/api/virtual-nubans/transaction-history/paginated-filter`,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.BANK78_API_KEY!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountRef: params.accountRef,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        accountNumber: params.accountNumber ?? "",
      }),
    }
  );

  return res.json();
}