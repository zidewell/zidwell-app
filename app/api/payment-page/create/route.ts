import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";
import { 
  isBVNVerified, 
  getUserBVNFromNomba, 
  createPaymentPageVirtualAccount 
} from "@/lib/nomba-virtual-account";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function uploadImageToStorage(userId: string, base64Image: string, type: string): Promise<string | null> {
  if (!base64Image) return null;
  if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
    return base64Image;
  }
  if (!base64Image.startsWith('data:image')) return null;
  
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const matches = base64Image.match(/^data:image\/(\w+);base64,/);
    const extension = matches ? matches[1] : "jpg";
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${userId}/${type}/${timestamp}-${randomString}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-page-images")
      .upload(filename, imageBuffer, {
        contentType: `image/${extension}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("payment-page-images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to create a payment page", logout: true },
        { status: 401 }
      );
    }

    const body = await request.json();
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
    } = body;

    console.log("📝 Creating page:", { title, pageType, slug });

    // Validate required fields
    if (!title || !pageType || !slug) {
      return NextResponse.json(
        { error: "Title, page type, and slug are required" },
        { status: 400 }
      );
    }

    // Validate page type specific requirements
    if (pageType === "link") {
      // For link pages with fixed amount, price is required
      if (metadata?.linkConfig?.amountMode === "fixed" && (!price || price <= 0)) {
        return NextResponse.json(
          { error: "Amount is required for fixed amount payment link" },
          { status: 400 }
        );
      }
    }

    if (pageType === "school") {
      if (!metadata?.feeBreakdown || metadata.feeBreakdown.length === 0) {
        return NextResponse.json(
          { error: "Fee breakdown is required for school pages" },
          { status: 400 }
        );
      }
    }

    if (pageType === "physical" || pageType === "digital") {
      if (priceType !== "open" && (!price || price <= 0)) {
        return NextResponse.json(
          { error: "Price is required for this page type" },
          { status: 400 }
        );
      }
    }

    // BVN Verification - REQUIRED FOR ALL PAGE TYPES
    console.log("🔍 Checking BVN verification for user:", user.id);
    const hasVerifiedBVN = await isBVNVerified(user.id);
    if (!hasVerifiedBVN) {
      return NextResponse.json(
        { 
          error: "BVN verification required before creating payment pages",
          requiresBvnVerification: true,
        },
        { status: 400 }
      );
    }

    // Get user's BVN - REQUIRED FOR ALL PAGE TYPES
    console.log("🔍 Fetching user BVN...");
    const userBVN = await getUserBVNFromNomba(user.id);
    if (!userBVN) {
      return NextResponse.json(
        { error: "Unable to retrieve your BVN. Please contact support." },
        { status: 400 }
      );
    }
    console.log("✅ BVN retrieved:", userBVN.substring(0, 4) + "****");

    // Upload images
    let uploadedCoverImage = null;
    if (coverImage) {
      uploadedCoverImage = await uploadImageToStorage(user.id, coverImage, "covers");
    }
    
    let uploadedLogo = null;
    if (logo && logo.startsWith('data:image')) {
      uploadedLogo = await uploadImageToStorage(user.id, logo, "logos");
    } else if (logo && (logo.startsWith('http://') || logo.startsWith('https://'))) {
      uploadedLogo = logo;
    }
    
    const uploadedProductImages: string[] = [];
    if (productImages && productImages.length > 0) {
      for (const img of productImages) {
        if (img.startsWith('data:image')) {
          const uploadedUrl = await uploadImageToStorage(user.id, img, "products");
          if (uploadedUrl) uploadedProductImages.push(uploadedUrl);
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          uploadedProductImages.push(img);
        }
      }
    }

    // Prepare metadata
    const finalMetadata: any = { ...metadata };

    // For link pages, store the entire link configuration in metadata
    if (pageType === "link" && metadata?.linkConfig) {
      finalMetadata.pageType = "link";
      finalMetadata.linkConfig = {
        ...metadata.linkConfig,
        createdAt: new Date().toISOString(),
      };
    }

    // Calculate final price
    let finalPrice = price || 0;
    if (pageType === "school" && finalMetadata.feeBreakdown?.length > 0) {
      finalPrice = finalMetadata.feeBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    }

    // Determine final price_type
    let finalPriceType = priceType;
    if (pageType === "link" && metadata?.linkConfig?.amountMode === "variable") {
      finalPriceType = "open";
    }
    if (pageType === "donation") {
      finalPriceType = "open";
    }

    // ============================================
    // CREATE VIRTUAL ACCOUNT FOR ALL PAGE TYPES
    // ============================================
    console.log("🏦 Creating virtual account for page type:", pageType);
    
    const tempPageId = crypto.randomUUID();
    const className = pageType === "school" && metadata?.className ? metadata.className : undefined;
    
    const virtualAccount = await createPaymentPageVirtualAccount(
      tempPageId,
      title,
      userBVN,
      className
    );
    
    if (!virtualAccount) {
      console.error("❌ Failed to create virtual account");
      return NextResponse.json(
        { error: "Failed to create payment account. Please try again." },
        { status: 500 }
      );
    }
    
    console.log(`✅ Virtual account created: ${virtualAccount.accountNumber}`);

    // Add virtual account to metadata
    finalMetadata.virtual_account = {
      accountNumber: virtualAccount.accountNumber,
      bankName: virtualAccount.bankName,
      accountName: virtualAccount.accountName,
      bankAccountName: virtualAccount.bankAccountName,
      accountRef: virtualAccount.accountRef,
      createdAt: new Date().toISOString(),
      isActive: true,
      type: "payment_page",
    };

    // Insert payment page
    console.log("💾 Saving payment page to database...");
    
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .insert({
        user_id: user.id,
        title,
        slug,
        description: description || "",
        cover_image: uploadedCoverImage,
        logo: uploadedLogo,
        product_images: uploadedProductImages,
        price_type: finalPriceType,
        price: finalPrice,
        installment_count: installmentCount,
        fee_mode: feeMode || "bearer",
        page_type: pageType,
        metadata: finalMetadata,
        is_published: true,
        published_at: new Date().toISOString(),
        page_balance: 0,
        total_revenue: 0,
        total_payments: 0,
        page_views: 0,
      })
      .select()
      .single();

    if (pageError) {
      console.error("❌ Error creating page:", pageError);
      return NextResponse.json(
        { error: pageError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Payment page created: ${page.id}`);

    // Update virtual account reference
    const updatedVirtualAccount = {
      ...finalMetadata.virtual_account,
      paymentPageId: page.id,
      accountRef: `PP-${page.id.replace(/-/g, '').substring(0, 20)}`,
    };
    
    await supabase
      .from("payment_pages")
      .update({
        metadata: {
          ...finalMetadata,
          virtual_account: updatedVirtualAccount,
        }
      })
      .eq("id", page.id);

    console.log("🎉 Payment page creation complete!");

    const responseData = {
      success: true,
      message: "Payment page created successfully!",
      slug: page.slug,
      virtualAccount: {
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountName: virtualAccount.accountName,
      },
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        pageType: page.page_type,
        coverImage: page.cover_image,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}