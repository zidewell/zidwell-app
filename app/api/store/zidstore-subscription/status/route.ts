// app/api/store/zidstore-subscription/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Unauthorized", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await unauthorized.json(), newTokens);
    return unauthorized;
  }

  try {
    const { data: subscription, error } = await supabase
      .from("zidstore_subscriptions")
      .select(
        "id, plan_tier, billing_period, status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, created_at"
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error) {
      console.error("[zidstore-sub status] fetch error:", error);
      const err = NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    let isActive = false;
    if (subscription) {
      const periodEnd = new Date(subscription.current_period_end);
      isActive = periodEnd.getTime() > Date.now();
    }

    const responseData = {
      active: isActive,
      subscription: subscription
        ? {
            id: subscription.id,
            plan_tier: subscription.plan_tier,
            billing_period: subscription.billing_period,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancelled_at: subscription.cancelled_at,
            created_at: subscription.created_at,
          }
        : null,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[zidstore-sub status] unhandled:", err);
    const errRes = NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
    if (newTokens) return createAuthResponse(await errRes.json(), newTokens);
    return errRes;
  }
}
