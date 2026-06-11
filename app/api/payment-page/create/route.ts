// app/api/payment-page/create/route.ts
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

/**
 * Upload an image to Supabase Storage and return the public URL
 */
async function uploadImageToStorage(userId: string, base64Image: string, type: string): Promise<string | null> {
  if (!base64Image) return null;
  
  // If it's already a URL (not base64), return as is
  if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
    return base64Image;
  }
  
  // Check if it's a base64 image
  if (!base64Image.startsWith('data:image')) {
    return null;
  }
  
  try {
    // Convert base64 to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Determine file extension
    const matches = base64Image.match(/^data:image\/(\w+);base64,/);
    const extension = matches ? matches[1] : "jpg";
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${userId}/${type}/${timestamp}-${randomString}.${extension}`;

    // Upload to Supabase Storage
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

    // Get public URL
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
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to create a payment page", logout: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);
    
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

    // Validate required fields
    if (!title || !pageType || !slug) {
      return NextResponse.json(
        { error: "Title, page type, and slug are required" },
        { status: 400 }
      );
    }

    // Validate page type specific requirements
    if (pageType === "school") {
      if (!metadata?.feeBreakdown || metadata.feeBreakdown.length === 0) {
        return NextResponse.json(
          { error: "Fee breakdown is required for school pages" },
          { status: 400 }
        );
      }
    }

    if (pageType === "donation") {
      if (!metadata?.suggestedAmounts || metadata.suggestedAmounts.length === 0) {
        return NextResponse.json(
          { error: "Suggested donation amounts are required" },
          { status: 400 }
        );
      }
    }

    if (pageType === "physical") {
      if (!price || price <= 0) {
        return NextResponse.json(
          { error: "Price is required for physical products" },
          { status: 400 }
        );
      }
    }

    if (pageType === "digital") {
      if (!price || price <= 0) {
        return NextResponse.json(
          { error: "Price is required for payment link" },
          { status: 400 }
        );
      }
      if (!metadata?.downloadUrl && !metadata?.accessLink) {
        return NextResponse.json(
          { error: "Download URL or access link is required for payment link" },
          { status: 400 }
        );
      }
    }

    if (pageType === "services") {
      if (!price || price <= 0) {
        return NextResponse.json(
          { error: "Price is required for services" },
          { status: 400 }
        );
      }
    }

    // ========== STEP 1: CHECK BVN VERIFICATION STATUS ==========
    console.log("🔍 Step 1: Checking BVN verification status...");
    
    const hasVerifiedBVN = await isBVNVerified(user.id);
    
    if (!hasVerifiedBVN) {
      console.error("❌ User has not verified BVN");
      return NextResponse.json(
        { 
          error: "BVN verification required before creating payment pages",
          requiresBvnVerification: true,
          message: "Please verify your BVN first to create payment pages"
        },
        { status: 400 }
      );
    }
    
    console.log("✅ User has verified BVN");

    // ========== STEP 2: GET USER'S BVN FROM THEIR WALLET ACCOUNT ==========
    console.log("🔍 Step 2: Fetching user's BVN from their wallet virtual account...");
    
    const userBVN = await getUserBVNFromNomba(user.id);
    
    if (!userBVN) {
      console.error("❌ Failed to get user's BVN from Nomba");
      return NextResponse.json(
        { 
          error: "Unable to retrieve your BVN. Please contact support.",
          requiresBvnVerification: true,
        },
        { status: 400 }
      );
    }
    
    console.log(`✅ User BVN retrieved: ${userBVN.substring(0, 4)}****`);

    // ========== STEP 2.5: UPLOAD IMAGES ==========
    console.log("🖼️ Step 2.5: Uploading images to storage...");
    
    // Upload cover image
    let uploadedCoverImage = null;
    if (coverImage) {
      uploadedCoverImage = await uploadImageToStorage(user.id, coverImage, "covers");
      console.log(`   Cover image uploaded: ${uploadedCoverImage || 'failed'}`);
    }
    
    // Upload logo (if provided and is base64)
    let uploadedLogo = null;
    if (logo && logo.startsWith('data:image')) {
      uploadedLogo = await uploadImageToStorage(user.id, logo, "logos");
      console.log(`   Logo uploaded: ${uploadedLogo || 'failed'}`);
    } else if (logo) {
      // Logo is already a URL (profile picture)
      uploadedLogo = logo;
      console.log(`   Logo is existing URL: ${logo}`);
    }
    
    // Upload product images
    const uploadedProductImages: string[] = [];
    if (productImages && productImages.length > 0) {
      for (const img of productImages) {
        if (img.startsWith('data:image')) {
          const uploadedUrl = await uploadImageToStorage(user.id, img, "products");
          if (uploadedUrl) {
            uploadedProductImages.push(uploadedUrl);
          }
        } else {
          uploadedProductImages.push(img);
        }
      }
      console.log(`   Product images uploaded: ${uploadedProductImages.length}`);
    }

    // Prepare metadata
    const finalMetadata: any = { ...metadata };

    // Add page type specific defaults
    switch (pageType) {
      case "school":
        finalMetadata.students = metadata?.students || [];
        finalMetadata.className = metadata?.className || "";
        finalMetadata.requiredFields = metadata?.requiredFields || [];
        finalMetadata.feeBreakdown = metadata?.feeBreakdown || [];
        break;
      
      case "donation":
        finalMetadata.suggestedAmounts = metadata?.suggestedAmounts || [5000, 10000, 20000];
        finalMetadata.showDonorList = metadata?.showDonorList || false;
        finalMetadata.allowDonorMessage = metadata?.allowDonorMessage !== undefined ? metadata.allowDonorMessage : true;
        break;
      
      case "physical":
        finalMetadata.variants = metadata?.variants || [];
        finalMetadata.requiresShipping = metadata?.requiresShipping !== undefined ? metadata.requiresShipping : true;
        break;
      
      case "digital":
        finalMetadata.downloadUrl = metadata?.downloadUrl || "";
        finalMetadata.accessLink = metadata?.accessLink || "";
        finalMetadata.emailDelivery = metadata?.emailDelivery !== undefined ? metadata.emailDelivery : true;
        break;
      
      case "services":
        finalMetadata.bookingEnabled = metadata?.bookingEnabled || false;
        finalMetadata.customerNoteEnabled = metadata?.customerNoteEnabled !== undefined ? metadata.customerNoteEnabled : true;
        break;
      
      case "real_estate":
      case "stock":
      case "savings":
      case "crypto":
        finalMetadata.minimumAmount = metadata?.minimumAmount || 0;
        finalMetadata.expectedReturn = metadata?.expectedReturn || "";
        finalMetadata.tenure = metadata?.tenure || "";
        finalMetadata.charges = metadata?.charges || "";
        finalMetadata.paymentFrequency = metadata?.paymentFrequency || "one-time";
        finalMetadata.termsAndConditions = metadata?.termsAndConditions || "";
        finalMetadata.riskExplanation = metadata?.riskExplanation || "";
        finalMetadata.cacCertificate = metadata?.cacCertificate || "";
        finalMetadata.taxClearance = metadata?.taxClearance || "";
        finalMetadata.explainerVideo = metadata?.explainerVideo || "";
        finalMetadata.socialLinks = metadata?.socialLinks || [];
        finalMetadata.website = metadata?.website || "";
        finalMetadata.contactInfo = metadata?.contactInfo || "";
        break;
    }

    // Calculate total amount
    let finalPrice = price;
    if (pageType === "school" && finalMetadata.feeBreakdown.length > 0) {
      finalPrice = finalMetadata.feeBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    }

    // ========== BUILD VIRTUAL ACCOUNT NAME WITH CLASS/GROUP NAME ==========
    let className = undefined;
    if (pageType === "school" && metadata?.className) {
      className = metadata.className;
    }

    console.log(`📝 Virtual account will include class: ${className || 'none'}`);

    // Generate temporary ID for virtual account
    const tempPageId = crypto.randomUUID();
    
    // ========== STEP 3: CREATE NEW VIRTUAL ACCOUNT FOR THIS PAYMENT PAGE ==========
    console.log("🏦 Step 3: Creating NEW virtual account for payment page...");
    
    const virtualAccount = await createPaymentPageVirtualAccount(
      tempPageId,
      title,
      userBVN,
      className  // Pass className for school pages
    );
    
    if (!virtualAccount) {
      console.error("❌ Failed to create virtual account");
      return NextResponse.json(
        { error: "Failed to create payment account. Please try again." },
        { status: 500 }
      );
    }
    
    console.log(`✅ Payment page virtual account created: ${virtualAccount.accountNumber}`);

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

    // ========== STEP 4: CREATE PAYMENT PAGE IN DATABASE ==========
    console.log("💾 Step 4: Saving payment page to database...");
    console.log("   Cover image URL:", uploadedCoverImage);
    console.log("   Logo URL:", uploadedLogo);
    console.log("   Product images:", uploadedProductImages.length);
    
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
        price_type: priceType,
        price: finalPrice || 0,
        installment_count: installmentCount,
        fee_mode: feeMode,
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
        { error: pageError.message, details: pageError },
        { status: 500 }
      );
    }

    console.log(`✅ Payment page created successfully: ${page.id}`);
    console.log(`   Cover image saved: ${page.cover_image}`);

    // ========== STEP 5: UPDATE VIRTUAL ACCOUNT REFERENCE ==========
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

    console.log("🎉 ========== PAYMENT PAGE CREATION COMPLETE ==========");
    console.log(`📱 Payment Page Virtual Account: ${virtualAccount.accountNumber}`);
    console.log(`🏦 Bank: ${virtualAccount.bankName}`);
    console.log(`📄 Page Slug: ${slug}`);
    console.log(`🖼️ Cover Image: ${page.cover_image || 'No cover image'}`);

    const responseData = {
      success: true,
      message: "Payment page created successfully with virtual account!",
      slug: page.slug,
      virtualAccount: {
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountName: virtualAccount.accountName,
        instruction: `Customers can pay by transferring to this account.`,
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