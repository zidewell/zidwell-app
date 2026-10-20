// app/api/admin-apis/online-stores/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Store ID required" }, { status: 400 });

    const [storeRes, walletRes, pagesRes] = await Promise.all([
      supabaseAdmin.from("online_stores").select("*").eq("id", id).single(),
      supabaseAdmin.from("store_owner_wallets").select("*").eq("store_id", id).maybeSingle(),
      supabaseAdmin.from("payment_pages").select("*").eq("store_id", id),
    ]);

    if (storeRes.error || !storeRes.data) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const pages = pagesRes.data ?? [];
    const pageIds = pages.map((p: any) => p.id);

    let payments: any[] = [];
    if (pageIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("payment_page_payments")
        .select(
          "id, payment_page_id, amount, fee, app_fee, nomba_fee, total_fee, net_amount, status, customer_name, customer_email, customer_phone, created_at, paid_at"
        )
        .in("payment_page_id", pageIds)
        .order("created_at", { ascending: false })
        .limit(50);
      payments = data ?? [];
    }

    // Owner profile
    const { data: owner } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, full_name, phone")
      .eq("id", storeRes.data.owner_id)
      .maybeSingle();

    return NextResponse.json({
      store: storeRes.data,
      wallet: walletRes.data ?? null,
      owner: owner ?? null,
      pages,
      recent_payments: payments,
    });
  } catch (err: any) {
    console.error("Store detail error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}