// app/api/payment-page/public/[slug]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    console.log(`🔍 Fetching payment page with slug: ${slug}`);

    const { data: page, error } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !page) {
      console.error("❌ Page not found:", error);
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    console.log(`✅ Page found: ${page.title}`);

    // Return page with virtual account info from metadata
    const response = {
      page: {
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
        virtualAccount: page.metadata?.virtual_account || null,
        pageViews: page.page_views,
        totalPayments: page.total_payments,
        pageBalance: page.page_balance,
        totalRevenue: page.total_revenue,
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching payment page:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}