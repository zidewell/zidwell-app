// app/api/admin-apis/subscribers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, full_name, first_name, last_name, phone, subscription_tier, subscription_expires_at, created_at"
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Zidwell subscriptions
    const { data: zidwellSubs } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, tier, status, started_at, expires_at, cancelled_at, auto_renew, payment_method, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Zidwell payments
    const { data: zidwellPayments } = await supabaseAdmin
      .from("subscription_payments")
      .select(
        "id, amount, currency, status, payment_method, reference, paid_at, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Zidstore subscriptions
    const { data: zidstoreSubs } = await supabaseAdmin
      .from("zidstore_subscriptions")
      .select(
        "id, plan_tier, billing_period, status, started_at, current_period_end, cancel_at_period_end, cancelled_at, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Zidstore payments
    const { data: zidstorePayments } = await supabaseAdmin
      .from("zidstore_subscription_payments")
      .select(
        "id, plan_tier, billing_period, amount, currency, status, provider, reference, paid_at, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      user,
      zidwell: {
        subscriptions: zidwellSubs ?? [],
        payments: zidwellPayments ?? [],
      },
      zidstore: {
        subscriptions: zidstoreSubs ?? [],
        payments: zidstorePayments ?? [],
      },
    });
  } catch (err: any) {
    console.error("Subscriber detail route error:", err);
    return NextResponse.json(
      { error: "Failed to load subscriber details" },
      { status: 500 }
    );
  }
}
