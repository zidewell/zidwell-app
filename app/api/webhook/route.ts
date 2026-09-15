// app/api/webhook/helpers/signature-verification.ts

import { createHmac, timingSafeEqual } from "crypto";

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

export async function verifyNombaSignature(
  payload: any,
  timestamp: string,
  signature: string,
): Promise<boolean> {
  const merchant = payload.data?.merchant || {};
  const transaction = payload.data?.transaction || {};

  let responseCode = transaction.responseCode || "";
  if (responseCode === "null") responseCode = "";

  const hashingPayload = [
    payload.event_type || "",
    payload.requestId || "",
    merchant.userId || "",
    merchant.walletId || "",
    transaction.transactionId || "",
    transaction.type || "",
    transaction.time || "",
    responseCode,
    timestamp,
  ].join(":");

  const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
  hmac.update(hashingPayload);
  const expectedSignature = hmac.digest("base64");

  const receivedBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expectedSignature, "base64");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}