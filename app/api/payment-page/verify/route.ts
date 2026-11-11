// app/api/payment-page/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paystackVerify } from "@/lib/paystack";
import { processSubscriptionFromPaystack } from "@/app/api/paystack/webhook/services/subscription.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { success: false, error: "Missing reference" },
      { status: 400 }
    );
  }

  try {
    const tx = await paystackVerify(reference);

    // ─── Fallback finalize for subscriptions ───
    // If webhook fails or is delayed, we complete the subscription here.
    if (
      tx.status === "success" &&
      (tx.metadata as any)?.type === "zidstore_subscription"
    ) {
      const { data: row } = await supabase
        .from("zidstore_subscription_payments")
        .select("status")
        .eq("reference", reference)
        .maybeSingle();

      if (row?.status === "pending") {
        try {
          await processSubscriptionFromPaystack({
            event: "charge.success",
            data: {
              id: tx.transactionId,
              reference: tx.reference,
              amount: tx.amount,
              currency: tx.currency,
              status: "success",
              paid_at: tx.paid_at,
              channel: tx.channel,
              customer: tx.customer,
              metadata: tx.metadata || {},
              gateway_response: tx.gateway_response,
            },
          });
        } catch (e) {
          console.error("[verify] subscription finalize failed:", e);
        }
      }
    }

    return NextResponse.json({
      success: tx.status === "success",
      status: tx.status,
      amount: tx.amount / 100,
      reference: tx.reference,
      paidAt: tx.paid_at,
      channel: tx.channel,
      metadata: tx.metadata,
    });
  } catch (err: any) {
    console.error("[verify] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
