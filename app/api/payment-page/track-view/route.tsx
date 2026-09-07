// app/api/payment-page/track-view/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ✅ Use SERVICE_ROLE_KEY to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { pageId, storeId } = await request.json();

    console.log("📊 Track view request:", { pageId, storeId });

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    let pageViews = 0;
    let storeViews = 0;

    // ✅ Update page views
    const { data: page, error: fetchError } = await supabase
      .from("payment_pages")
      .select("page_views")
      .eq("id", pageId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Error fetching page:", fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!page) {
      console.error("❌ Page not found:", pageId);
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    const newViews = (page.page_views || 0) + 1;

    const { error: updateError } = await supabase
      .from("payment_pages")
      .update({ page_views: newViews })
      .eq("id", pageId);

    if (updateError) {
      console.error("❌ Error updating page views:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    pageViews = newViews;
    console.log("✅ Page views updated to:", newViews);

    // ✅ Update store views (optional)
    if (storeId) {
      const { data: store, error: storeFetchError } = await supabase
        .from("online_stores")
        .select("total_views")
        .eq("id", storeId)
        .maybeSingle();

      if (!storeFetchError && store) {
        const newStoreViews = (store.total_views || 0) + 1;
        const { error: storeUpdateError } = await supabase
          .from("online_stores")
          .update({ total_views: newStoreViews })
          .eq("id", storeId);

        if (!storeUpdateError) {
          storeViews = newStoreViews;
          console.log("✅ Store views updated to:", newStoreViews);
        }
      }
    }

    return NextResponse.json({
      success: true,
      pageViews,
      storeViews,
    });
  } catch (error) {
    console.error("❌ Error tracking view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}