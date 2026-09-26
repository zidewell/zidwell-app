// app/api/webhooks/bank78/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { processBank78WalletCredit } from "@/lib/bank78-webhook/wallet-credit";
import { processBank78Payout } from "@/lib/bank78-webhook/payout";
import { processBank78PayoutRefund } from "@/lib/bank78-webhook/payout-refund";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────────────────────
// Verify Bank78 webhook signature (HMAC-SHA256 hex)
// ─────────────────────────────────────────────────────────────
function verifySignature(raw: string, signature: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.BANK78_WEBHOOK_SECRET!)
    .update(raw)
    .digest("hex");

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─────────────────────────────────────────────────────────────
// Idempotency — remember which webhook events we've processed
// ─────────────────────────────────────────────────────────────
async function alreadyProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const { data } = await supabase
    .from("bank78_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  return !!data;
}

async function markProcessed(eventId: string, eventType: string, payload: any) {
  if (!eventId) return;
  await supabase.from("bank78_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
  });
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const raw = await req.text();

  const signature =
    req.headers.get("x-bank78-signature") ||
    req.headers.get("x-signature") ||
    "";

  if (!verifySignature(raw, signature)) {
    console.error("[bank78 webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept a few common event-name shapes
  const eventType =
    payload.event || payload.event_type || payload.eventType || "";
  const eventId =
    payload.eventId ||
    payload.event_id ||
    payload.data?.transactionId ||
    payload.data?.transactionReference;

  console.log("[bank78 webhook]", { eventType, eventId });

  if (eventId && (await alreadyProcessed(eventId))) {
    return NextResponse.json({ ok: true, message: "Already processed" });
  }

  try {
    switch (eventType) {
      // ── Money arrived in a user's virtual NUBAN ──
      case "wallet.credit":
      case "virtual_account.credit":
      case "payment.success": {
        const result = await processBank78WalletCredit(payload);
        await markProcessed(eventId, eventType, payload);
        return NextResponse.json(result);
      }

      // ── Outgoing bank transfer result ──
      case "payout.success":
      case "payout.failed":
      case "transfer.success":
      case "transfer.failed": {
        const result = await processBank78Payout(payload);
        await markProcessed(eventId, eventType, payload);
        return NextResponse.json(result);
      }

      // ── Bank returned money for a failed transfer ──
      case "payout.refund":
      case "payout.reversal": {
        const result = await processBank78PayoutRefund(payload);
        await markProcessed(eventId, eventType, payload);
        return NextResponse.json(result);
      }

      default:
        console.log("[bank78 webhook] Unhandled event:", eventType);
        return NextResponse.json({ ok: true, message: "Ignored" });
    }
  } catch (err: any) {
    console.error("[bank78 webhook] handler error:", err);
    return NextResponse.json(
      { error: err.message || "Webhook failed" },
      { status: 500 }
    );
  }
}