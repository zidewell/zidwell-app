import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json({ error: "Please login to view pages", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // Get all pages for user
    const { data: pages, error: pagesError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (pagesError) {
      console.error("Error fetching pages:", pagesError);
      return NextResponse.json(
        { error: pagesError.message },
        { status: 500 }
      );
    }

    const formattedPages = pages.map((page: any) => ({
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
      isPublished: page.is_published,
      metadata: page.metadata,
    }));

    const response = NextResponse.json({
      success: true,
      pages: formattedPages,
    });

    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  } catch (error: any) {
    console.error("List pages error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}