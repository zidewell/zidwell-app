// lib/bank78.ts
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getBank78Token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const url = `${process.env.BANK78_BASE_URL}/identity/connect/token`;
  const body = new URLSearchParams({
    client_id: process.env.BANK78_CLIENT_ID!,
    client_secret: process.env.BANK78_SECRET_KEY!,
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": process.env.BANK78_API_KEY!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();

  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.error_description || data?.error || "Bank78 token failed"
    );
  }

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) - 300;
  return cachedToken!;
}

export interface CreateBank78AccountParams {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn?: string;
  nin?: string;
}

export interface Bank78Account {
  accountNumber: string;
  bankName: string;
  userId: string;
  accountType?: number;
  bankCode?: string | null;
}

export async function createBank78Account(
  params: CreateBank78AccountParams
): Promise<{ ok: boolean; account?: Bank78Account; error?: string; raw?: any }> {
  const token = await getBank78Token();

  const url = `${process.env.BANK78_BASE_URL}/sub-account/api/v1/accounts`;
  const body: Record<string, any> = {
    userId: params.userId,
    firstName: params.firstName,
    lastName: params.lastName,
    emailAddress: params.email,
    phoneNumber: params.phone,
  };
  if (params.bvn) body.bvn = params.bvn;
  if (params.nin) body.nin = params.nin;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": process.env.BANK78_API_KEY!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.json();

    if (!res.ok || !raw?.result?.accountNumber) {
      return {
        ok: false,
        error: raw?.message || "Bank78 account creation failed",
        raw,
      };
    }

    return {
      ok: true,
      account: {
        accountNumber: raw.result.accountNumber,
        bankName: raw.result.bankName || "Bank78",
        userId: raw.result.userId,
        accountType: raw.result.accountType,
        bankCode: raw.result.bankCode,
      },
      raw,
    };
  } catch (err: any) {
    console.error("[BANK78] Create account exception:", err.message);
    return { ok: false, error: err.message };
  }
}