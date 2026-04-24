import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 });
    }

    const { data: payment, error } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("order_reference", reference)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        net_amount: payment.net_amount,
        status: payment.status,
        customer_name: payment.customer_name,
        customer_email: payment.customer_email,
        payment_method: payment.payment_method,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}