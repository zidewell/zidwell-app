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
  /** Optional: override the account name (used for business accounts) */
  accountName?: string;
  /** Optional: static (1) or dynamic (2). Defaults to 1 (static). */
  accountType?: 1 | 2;
}

export interface Bank78Account {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string | null;
  userId: string;
  accountType?: number;
  accountReference?: string;
  reservationReference?: string;
}

export async function createBank78Account(
  params: CreateBank78AccountParams
): Promise<{ ok: boolean; account?: Bank78Account; error?: string; raw?: any }> {
  const token = await getBank78Token();

  const url = `${process.env.BANK78_BASE_URL}/virtual-nuban/api/virtual-nubans/initialize`;

  // Build a stable, unique accountReference — this is how you map the
  // virtual NUBAN back to your internal user. Keep it deterministic.
  const accountReference = `ZIDWELL-${params.userId}`;

  const accountName =
    params.accountName?.trim() ||
    `${params.firstName} ${params.lastName}`.trim();

  const body: Record<string, any> = {
    accountReference,
    accountName,
    emailAddress: params.email,
    phoneNumber: params.phone,
    // Static virtual NUBAN by default (permanent wallet account).
    accountType: params.accountType ?? 1,
    // Keep expiresInMinutes at 0 for static accounts.
    expiresInMinutes: 0,
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

    // Bank78 wraps the payload. From the docs, the response contains
    // accountNumber / accountName / bankCode / bankName / accountReference.
    const payload = raw?.result ?? raw?.data ?? raw;

    const accountNumber: string | undefined = payload?.accountNumber;
    const bankName: string | undefined = payload?.bankName;

    if (!res.ok || !accountNumber) {
      return {
        ok: false,
        error:
          raw?.message ||
          raw?.error_description ||
          raw?.error ||
          "Bank78 virtual NUBAN creation failed",
        raw,
      };
    }

    return {
      ok: true,
      account: {
        accountNumber,
        accountName: payload?.accountName || accountName,
        bankName: bankName || "Bank78",
        bankCode: payload?.bankCode ?? null,
        userId: params.userId,
        accountType: payload?.accountType ?? body.accountType,
        accountReference: payload?.accountReference || accountReference,
        reservationReference: payload?.reservationReference,
      },
      raw,
    };
  } catch (err: any) {
    console.error("[BANK78] Create virtual NUBAN exception:", err.message);
    return { ok: false, error: err.message };
  }
}