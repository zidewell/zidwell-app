import { createHmac, timingSafeEqual } from "crypto";

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

export async function verifyNombaSignature(
  payload: any,
  timestamp: string,
  signature: string
): Promise<boolean> {
  const hashingPayload = `${payload.event_type}:${payload.requestId}:${
    payload.data?.merchant?.userId || ""
  }:${payload.data?.merchant?.walletId || ""}:${
    payload.data?.transaction?.transactionId || ""
  }:${payload.data?.transaction?.type || ""}:${
    payload.data?.transaction?.time || ""
  }:${payload.data?.transaction?.responseCode || ""}`;

  const message = `${hashingPayload}:${timestamp}`;
  const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
  hmac.update(message);
  const expectedSignature = hmac.digest("base64");

  const receivedBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expectedSignature, "base64");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}