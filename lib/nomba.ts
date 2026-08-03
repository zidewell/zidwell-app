let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getNombaToken() {
  const now = Math.floor(Date.now() / 1000);

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
      throw new Error(data.error_description || "Failed to get Nomba token");
    }

    if (!data.data?.access_token) {
      throw new Error("No access token in response");
    }

    cachedToken = data.data.access_token;

    let expiresIn = data.expires_in || data.expiresIn || data.expiresAt || data.data.expires_in;

    if (!expiresIn) {
      expiresIn = 3600;
    }

    tokenExpiry = now + expiresIn - 300;

    return cachedToken;
  } catch (error) {
    cachedToken = null;
    tokenExpiry = 0;

    throw error;
  }
}

export function clearNombaToken() {
  cachedToken = null;
  tokenExpiry = 0;
}