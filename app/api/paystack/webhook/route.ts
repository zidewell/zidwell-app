// app/api/paystack/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyPaystackSignature,
  isPaystackIp,
} from "./helpers/verify-signature";
import { processPaymentPageFromPaystack } from "./services/payment-page.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handleResult(result: any): NextResponse {
  if (result && "error" in result && result.error) {
    const statusCode =
      typeof result.status === "number" ? result.status : 500;
    return NextResponse.json({ error: result.error }, { status: statusCode });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const requestId = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // ─── 1. RAW body (signature is over raw bytes) ───
    const rawBody = await req.text();

    // ─── 2. Signature ───
    const signature = req.headers.get("x-paystack-signature");
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.warn(`[${requestId}] ❌ invalid signature`);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // ─── 3. Optional IP allowlist ───
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    if (!isPaystackIp(forwardedFor, realIp)) {
      console.warn(`[${requestId}] ❌ IP not in allowlist`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── 4. Parse ───
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = payload?.event;
    const data = payload?.data || {};

    console.log(`[${requestId}] event=${event} reference=${data.reference}`);

    // ─── 5. Idempotency log (best effort — non-fatal) ───
    const eventKey = `${event}:${data.id}`;
    try {
      const { error: logErr } = await supabase
        .from("paystack_webhook_events")
        .insert({
          event_key: eventKey,
          event_type: event,
          reference: data.reference || null,
          amount_kobo: data.amount || null,
          payload,
          received_at: new Date().toISOString(),
        });

      if (logErr) {
        if (logErr.code === "23505") {
          console.log(`[${requestId}] ↩ duplicate webhook, acking`);
          return NextResponse.json({ success: true, message: "Duplicate" });
        }
        console.warn(`[${requestId}] event log skipped:`, logErr.message);
      }
    } catch (logEx) {
      console.warn(`[${requestId}] event log threw:`, logEx);
    }

    // ─── 6. Dispatch ───
    if (event === "charge.success") {
      const meta = data.metadata || {};
      if (meta.type === "payment_page") {
        const result = await processPaymentPageFromPaystack(payload);
        return handleResult(result);
      }
      console.log(
        `[${requestId}] charge.success ignored — metadata.type=${meta.type}`
      );
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    console.log(`[${requestId}] unhandled event ${event}`);
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  } catch (err: any) {
    console.error(`[${requestId}] ❌ unhandled error:`, err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}


// export async function POST(req: Request) {
//   const timestamp = req.headers.get("nomba-timestamp");
//   const signature = req.headers.get("nomba-sig-value");

//   // ✅ TEMP: Allow missing headers only for initial verification
//   if (!timestamp || !signature) {
//     console.log("Nomba initial webhook verification ping — allowing");
//     return new Response(JSON.stringify({ verified: true }), { status: 200 });
//   }

//   // 🔐 Normal processing for real events
//   const body = await req.json();
//   console.log("Nomba Webhook Triggered", body);

//   return new Response(JSON.stringify({ received: true }), { status: 200 });
// }
