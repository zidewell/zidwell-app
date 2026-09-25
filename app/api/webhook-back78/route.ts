// app/api/webhooks/bank78/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processActivation } from "@/lib/activation";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();

    // ─── Verify Bank78 signature ───
    const signature =
      req.headers.get("x-bank78-signature") ||
      req.headers.get("x-signature") ||
      "";

    const expected = crypto
      .createHmac("sha256", process.env.BANK78_WEBHOOK_SECRET!)
      .update(raw)
      .digest("hex");

    if (!signature || signature !== expected) {
      console.error("[/api/webhooks/bank78] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(raw);

    console.log("[/api/webhooks/bank78] Received:", {
      event: payload.event,
      userId: payload?.data?.userId,
      amount: payload?.data?.amount,
    });

    if (payload.event !== "wallet.credit") {
      return NextResponse.json({ received: true });
    }

    const data = payload.data || {};
    const userId = data.userId;
    const amount = Number(data.amount);

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const result = await processActivation({
      userId,
      inflowAmount: amount,
      inflowReference: data.reference,
      inflowProviderTxId: data.transactionId,
      inflowChannel: data.channel || "bank_transfer",
      inflowSender: data.sender,
    });

    return NextResponse.json({ ok: true, activation: result });
  } catch (err: any) {
    console.error("[/api/webhooks/bank78] Error:", err.message);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}