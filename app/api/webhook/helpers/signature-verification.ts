// app/api/webhook/helpers/signature-verification.ts
import { createHmac, timingSafeEqual } from "crypto";

const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY;

/**
 * Verify a Nomba webhook signature.
 *
 * Nomba computes:
 *   message = `${event_type}:${requestId}:${merchant.userId}:${merchant.walletId}:${transaction.transactionId}:${transaction.type}:${transaction.time}:${transaction.responseCode}:${timestamp}`
 *   signature = base64( HMAC-SHA256(message, NOMBA_SIGNATURE_KEY) )
 *
 * @param payload   Parsed JSON body (object, not string)
 * @param timestamp Value of the `nomba-timestamp` header
 * @param signature Value of the `nomba-signature` header (base64)
 */
export async function verifyNombaSignature(
  payload: any,
  timestamp: string,
  signature: string
): Promise<boolean> {
  try {
    if (!NOMBA_SIGNATURE_KEY) {
      console.error(
        "[verify] ❌ NOMBA_SIGNATURE_KEY is not set in environment variables"
      );
      return false;
    }

    if (!payload || typeof payload !== "object") {
      console.error("[verify] ❌ payload is not an object:", typeof payload);
      return false;
    }

    if (!timestamp) {
      console.error("[verify] ❌ missing timestamp header");
      return false;
    }

    if (!signature) {
      console.error("[verify] ❌ missing signature header");
      return false;
    }

    // Build the hashing payload exactly as Nomba documents it
    const hashingPayload = [
      payload.event_type ?? "",
      payload.requestId ?? "",
      payload.data?.merchant?.userId ?? "",
      payload.data?.merchant?.walletId ?? "",
      payload.data?.transaction?.transactionId ?? "",
      payload.data?.transaction?.type ?? "",
      payload.data?.transaction?.time ?? "",
      payload.data?.transaction?.responseCode ?? "",
    ].join(":");

    const message = `${hashingPayload}:${timestamp}`;

    const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
    hmac.update(message);
    const expectedSignature = hmac.digest("base64");

    // DEBUG (remove after confirmed working)
    console.log("[verify] --- DEBUG ---");
    console.log("[verify] event_type:", payload.event_type);
    console.log("[verify] requestId:", payload.requestId);
    console.log("[verify] merchant.userId:", payload.data?.merchant?.userId);
    console.log("[verify] merchant.walletId:", payload.data?.merchant?.walletId);
    console.log(
      "[verify] transaction.transactionId:",
      payload.data?.transaction?.transactionId
    );
    console.log("[verify] transaction.type:", payload.data?.transaction?.type);
    console.log("[verify] transaction.time:", payload.data?.transaction?.time);
    console.log(
      "[verify] transaction.responseCode:",
      payload.data?.transaction?.responseCode
    );
    console.log("[verify] timestamp:", timestamp);
    console.log("[verify] message string:", message);
    console.log("[verify] expected sig:", expectedSignature);
    console.log("[verify] received sig:", signature);
    console.log("[verify] --- END DEBUG ---");

    // Strip "sha256=" prefix if present (defensive against format variants)
    const cleanSignature = signature.replace(/^sha256=/i, "").trim();

    let receivedBuffer: Buffer;
    let expectedBuffer: Buffer;
    try {
      receivedBuffer = Buffer.from(cleanSignature, "base64");
      expectedBuffer = Buffer.from(expectedSignature, "base64");
    } catch (bufErr) {
      console.error("[verify] ❌ Failed to build buffers:", bufErr);
      return false;
    }

    if (receivedBuffer.length !== expectedBuffer.length) {
      console.error(
        `[verify] ❌ length mismatch. Received: ${receivedBuffer.length}, Expected: ${expectedBuffer.length}`
      );
      return false;
    }

    const isValid = timingSafeEqual(receivedBuffer, expectedBuffer);
    console.log("[verify] RESULT:", isValid ? "✅ VALID" : "❌ INVALID");
    return isValid;
  } catch (err) {
    console.error("[verify] ❌ Exception during verification:", err);
    return false;
  }
}