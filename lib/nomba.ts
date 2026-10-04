// lib/nomba.ts
// ─────────────────────────────────────────────────────────────
// Nomba helper — token cache + virtual account creation.
// ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getNombaToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if it exists and isn't expired
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const url = `${process.env.NOMBA_URL}/v1/auth/token/issue`;
  const options = {
    method: "POST",
    headers: {
      accountId: process.env.NOMBA_ACCOUNT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.NOMBA_CLIENT_ID!,
      client_secret: process.env.NOMBA_PRIVATE_KEY!,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error_description || "Failed to get Nomba token"
      );
    }

    if (!data.data?.access_token) {
      throw new Error("No access token in response");
    }

    cachedToken = data.data.access_token;

    let expiresIn =
      data.expires_in ||
      data.expiresIn ||
      data.expiresAt ||
      data.data.expires_in;

    if (!expiresIn) {
      expiresIn = 3600;
    }

    // Set expiry with 5-minute safety margin
    tokenExpiry = now + expiresIn - 300;

    return cachedToken;
  } catch (error) {
    // Clear cache on error
    cachedToken = null;
    tokenExpiry = 0;
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Virtual account creation
// ─────────────────────────────────────────────────────────────

export interface NombaAccount {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  accountRef: string;
}

export async function createNombaAccount(params: {
  accountName: string;
  accountRef: string;   // The user's UUID — Nomba echoes this back in webhooks
  bvn: string;
}): Promise<{
  ok: boolean;
  account?: NombaAccount;
  error?: string;
  raw?: any;
}> {
  const token = await getNombaToken();

  try {
    const res = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: params.accountName,
          accountRef: params.accountRef,
          bvn: params.bvn,
        }),
      }
    );

    const raw = await res.json();

    if (!res.ok || !raw?.data) {
      return {
        ok: false,
        error:
          raw?.message ||
          raw?.error_description ||
          "Nomba account creation failed",
        raw,
      };
    }

    return {
      ok: true,
      account: {
        bankName: raw.data.bankName,
        bankAccountName: raw.data.bankAccountName,
        bankAccountNumber: raw.data.bankAccountNumber,
        accountRef: raw.data.accountRef || params.accountRef,
      },
      raw,
    };
  } catch (err: any) {
    console.error("[NOMBA] Create account exception:", err.message);
    return { ok: false, error: err.message };
  }
}