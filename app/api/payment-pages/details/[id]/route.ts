// app/api/payment-page/details/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AUTHENTICATED API - Requires login
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json({ error: "Please login to view page details", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // Get page by id (must belong to user)
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    // Get payments for this page
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    const formattedPage = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      description: page.description,
      coverImage: page.cover_image,
      logo: page.logo,
      productImages: page.product_images,
      priceType: page.price_type,
      price: page.price,
      installmentCount: page.installment_count,
      feeMode: page.fee_mode,
      pageBalance: page.page_balance,
      totalRevenue: page.total_revenue,
      totalPayments: page.total_payments,
      pageViews: page.page_views,
      createdAt: page.created_at,
      pageType: page.page_type,
      metadata: page.metadata,
      recentPayments: payments?.slice(0, 10).map(p => ({
        id: p.id,
        customerName: p.customer_name,
        customerEmail: p.customer_email,
        amount: p.amount,
        fee: p.fee,
        createdAt: p.created_at,
      })),
      paymentStats: {
        totalAmount,
        totalCount: payments?.length || 0,
      },
    };

    const response = NextResponse.json({
      success: true,
      page: formattedPage,
    });

    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  } catch (error: any) {
    console.error("Get page details error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}