// app/api/paystack/webhook/helpers/verify-signature.ts

import { createHmac, timingSafeEqual } from "crypto";

const DIGITAL_PAYSTACK_SECRET_KEY = process.env.DIGITAL_PAYSTACK_SECRET_KEY!;

export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha512", DIGITAL_PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  try {
    const received = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (received.length !== expectedBuf.length) return false;
    return timingSafeEqual(received, expectedBuf);
  } catch {
    return false;
  }
}

export const PAYSTACK_ALLOWED_IPS = [
  "52.31.139.75",
  "52.49.173.169",
  "52.214.14.220",
] as const;

export function isPaystackIp(
  forwardedFor: string | null,
  realIp: string | null
): boolean {
  const ip =
    (forwardedFor?.split(",")[0] || "").trim() || (realIp || "").trim() || "";
  if (!ip) return true;
  return (PAYSTACK_ALLOWED_IPS as readonly string[]).includes(ip);
}