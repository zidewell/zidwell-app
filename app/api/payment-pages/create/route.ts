// app/api/payment-page/create/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AUTHENTICATED API - Requires login
export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json({ error: "Please login to create a payment page", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const { 
      title, 
      slug, 
      description, 
      coverImage, 
      logo, 
      productImages,
      priceType, 
      price, 
      installmentCount, 
      feeMode,
      pageType,
      metadata 
    } = await request.json();

    // Validate required fields
    if (!title || !pageType) {
      return NextResponse.json(
        { error: "Title and page type are required" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      // Check if slug exists and make unique
      const { data: existing } = await supabase
        .from("payment_pages")
        .select("slug")
        .eq("slug", finalSlug)
        .single();
      
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    // Create payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .insert({
        user_id: user.id,
        title,
        slug: finalSlug,
        description,
        cover_image: coverImage,
        logo,
        product_images: productImages || [],
        price_type: priceType,
        price: price || 0,
        installment_count: installmentCount,
        fee_mode: feeMode,
        page_type: pageType,
        metadata: metadata || {},
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pageError) {
      console.error("Error creating page:", pageError);
      return NextResponse.json(
        { error: pageError.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        pageBalance: page.page_balance,
        totalRevenue: page.total_revenue,
        totalPayments: page.total_payments,
        pageViews: page.page_views,
        createdAt: page.created_at,
      },
    });

    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  } catch (error: any) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}