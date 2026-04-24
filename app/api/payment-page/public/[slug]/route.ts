import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUBLIC API - No authentication required
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
   const slug = (await params).slug;

    // Get published page by slug
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      console.error("Page not found error:", pageError);
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    // Increment page views - FIXED error handling
    try {
      await supabase.rpc("increment_page_views", { p_page_id: page.id });
    } catch (rpcError) {
      // Don't fail the request if view increment fails
      console.error("Failed to increment page views:", rpcError);
    }

    // Return only public-safe data
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
      pageType: page.page_type,
      metadata: page.metadata,
    };

    return NextResponse.json({
      success: true,
      page: formattedPage,
    });
  } catch (error: any) {
    console.error("Get public page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}