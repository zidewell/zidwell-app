// app/api/payment-page/public/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const slug = (await params).id;
 

    const { data: page, error } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Return page with virtual account info
    return NextResponse.json({
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
      }
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}