// app/api/payment-page/update/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication - pass the request properly
    const authResult = await isAuthenticatedWithRefresh(req);
    const { user, newTokens } = authResult;
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to update payment page", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Updating page:", id, body);
    
    const { 
      title, 
      description, 
      coverImage, 
      logo, 
      productImages,
      priceType, 
      price, 
      installmentCount, 
      metadata 
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if page exists and belongs to user
    const { data: existingPage, error: checkError } = await supabase
      .from("payment_pages")
      .select("user_id, metadata")
      .eq("id", id)
      .single();

    if (checkError || !existingPage) {
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    if (existingPage.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      title,
      description: description || "",
      cover_image: coverImage || null,
      logo: logo || null,
      product_images: productImages || [],
      price_type: priceType,
      price: price || 0,
      updated_at: new Date().toISOString(),
    };

    if (priceType === "installment" && installmentCount) {
      updateData.installment_count = installmentCount;
    }

    // Preserve existing virtual account info in metadata
    const existingMetadata = existingPage.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...metadata,
      // Preserve virtual account if it exists
      virtual_account: existingMetadata.virtual_account,
    };
    
    updateData.metadata = updatedMetadata;

    // Update the page
    const { data: page, error: updateError } = await supabase
      .from("payment_pages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating page:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    console.log("Page updated successfully:", page.id);

    const responseData = {
      success: true,
      message: "Payment page updated successfully!",
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
        isPublished: page.is_published,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error("Update page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}