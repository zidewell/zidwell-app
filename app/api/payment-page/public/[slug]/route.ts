// app/api/payment-page/public/[slug]/route.ts
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
      console.error("❌ API - No slug provided");
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // First try exact match
    let { data: page, error } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    // If not found, try case-insensitive match
    if (error && error.code === 'PGRST116') {
      console.log(`🔍 No exact match, trying case-insensitive for: ${slug}`);
      const { data: pageCaseInsensitive, error: caseError } = await supabase
        .from("payment_pages")
        .select("*")
        .ilike("slug", `%${slug}%`)
        .maybeSingle();
      
      if (!caseError && pageCaseInsensitive) {
        page = pageCaseInsensitive;
        error = null;
        console.log(`✅ Found case-insensitive match: ${page.slug}`);
      }
    }

    if (error) {
      console.error("❌ API - Database error:", error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch page", details: error.message },
        { status: 500 }
      );
    }

    if (!page) {
      console.error("❌ API - No page found for slug:", slug);
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if page is published
    if (!page.is_published) {
      console.error(`❌ Page "${page.title}" is not published`);
      return NextResponse.json({ error: "Page not available" }, { status: 404 });
    }

    // INCREMENT PAGE VIEWS - Add this here
    const { error: viewError } = await supabase.rpc("increment_page_views", {
      p_page_id: page.id,
    });

    if (viewError) {
      console.error("❌ Error incrementing page views:", viewError);
    } else {
      console.log(`✅ Page views incremented for: ${page.title}`);
    }

    console.log(`✅ API - Page found: ${page.title}`);

    // Format the response with updated view count
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