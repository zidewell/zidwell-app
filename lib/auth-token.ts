import crypto from "crypto";

const TOKEN_SECRET = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
const TOKEN_EXPIRY_SECONDS = 300;

if (!TOKEN_SECRET) {
  throw new Error("ENCRYPTION_KEY or NEXTAUTH_SECRET environment variable must be set for auth tokens");
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  plan: string;
  exp: number;
}

export function generateAuthToken(payload: {
  userId: string;
  email: string;
  plan: string;
}): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const fullPayload = { ...payload, exp };

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET!)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET!)
      .update(payloadBase64)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as AuthTokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
