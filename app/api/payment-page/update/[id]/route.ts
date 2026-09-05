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
    
    // Check authentication
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
      metadata,
      isPublished // ✅ Added this field
    } = body;

    // Validate required fields (title is required, but for toggle we might only send isPublished)
    if (!title && isPublished === undefined) {
      return NextResponse.json(
        { error: "Title or isPublished is required" },
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

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // ✅ Only add fields if they are provided (not undefined)
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || "";
    if (coverImage !== undefined) updateData.cover_image = coverImage || null;
    if (logo !== undefined) updateData.logo = logo || null;
    if (productImages !== undefined) updateData.product_images = productImages || [];
    if (priceType !== undefined) updateData.price_type = priceType;
    if (price !== undefined) updateData.price = price || 0;
    if (isPublished !== undefined) updateData.is_published = isPublished;
    
    if (priceType === "installment" && installmentCount) {
      updateData.installment_count = installmentCount;
    }

    // Handle metadata - preserve existing if not provided
    if (metadata !== undefined) {
      const existingMetadata = existingPage.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        ...metadata,
        // Preserve virtual account if it exists
        virtual_account: existingMetadata.virtual_account,
      };
      updateData.metadata = updatedMetadata;
    }

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