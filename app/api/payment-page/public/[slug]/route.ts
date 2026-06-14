import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    console.log(`🔍 API - Fetching payment page with slug: "${slug}"`);
    
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Try exact match
    let { data: page, error } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    // Try case-insensitive match if not found
    if (error && error.code === 'PGRST116') {
      const { data: pageCaseInsensitive, error: caseError } = await supabase
        .from("payment_pages")
        .select("*")
        .ilike("slug", `%${slug}%`)
        .maybeSingle();
      
      if (!caseError && pageCaseInsensitive) {
        page = pageCaseInsensitive;
        error = null;
      }
    }

    if (error || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if page is published
    if (!page.is_published) {
      return NextResponse.json({ error: "Page not available" }, { status: 404 });
    }

    // Increment page views
    await supabase.rpc("increment_page_views", { p_page_id: page.id });

    // Format response
    const response = {
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description || "",
        coverImage: page.cover_image,
        logo: page.logo,
        productImages: page.product_images || [],
        priceType: page.price_type,
        price: Number(page.price),
        installmentCount: page.installment_count,
        feeMode: page.fee_mode,
        pageType: page.page_type,
        metadata: page.metadata || {},
        virtualAccount: page.metadata?.virtual_account || null,
        linkConfig: page.link_config || null,
        pageViews: (page.page_views || 0) + 1,
        totalPayments: page.total_payments || 0,
        pageBalance: Number(page.page_balance),
        totalRevenue: Number(page.total_revenue),
        isPublished: page.is_published,
        createdAt: page.created_at,
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ API - Error fetching payment page:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}