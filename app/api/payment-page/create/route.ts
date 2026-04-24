// app/api/payment-page/create/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define types for different page configurations
interface FeeItem {
  label: string;
  amount: number;
}

interface Variant {
  name: string;
  options: string[];
}

interface SocialLink {
  platform: string;
  url: string;
}

interface SchoolMetadata {
  students?: any[];
  className?: string;
  requiredFields?: string[];
  feeBreakdown?: FeeItem[];
}

interface DonationMetadata {
  suggestedAmounts?: number[];
  showDonorList?: boolean;
  allowDonorMessage?: boolean;
}

interface PhysicalMetadata {
  variants?: Variant[];
  requiresShipping?: boolean;
}

interface DigitalMetadata {
  downloadUrl?: string;
  accessLink?: string;
  emailDelivery?: boolean;
}

interface ServicesMetadata {
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
}

interface InvestmentMetadata {
  minimumAmount?: number;
  expectedReturn?: string;
  tenure?: string;
  charges?: string;
  paymentFrequency?: "one-time" | "recurring";
  termsAndConditions?: string;
  riskExplanation?: string;
  cacCertificate?: string;
  taxClearance?: string;
  explainerVideo?: string;
  socialLinks?: SocialLink[];
  website?: string;
  contactInfo?: string;
}

interface FormattedPage {
  id: any;
  title: any;
  slug: any;
  description: any;
  coverImage: any;
  logo: any;
  productImages: any;
  priceType: any;
  price: any;
  installmentCount: any;
  feeMode: any;
  pageBalance: any;
  totalRevenue: any;
  totalPayments: any;
  pageViews: any;
  createdAt: any;
  pageType: any;
  isPublished: any;
  metadata: any;
  // School specific
  feeBreakdown?: FeeItem[];
  className?: string;
  requiredFields?: string[];
  // Donation specific
  suggestedAmounts?: number[];
  showDonorList?: boolean;
  allowDonorMessage?: boolean;
  // Physical specific
  variants?: Variant[];
  requiresShipping?: boolean;
  // Digital specific
  downloadUrl?: string;
  accessLink?: string;
  emailDelivery?: boolean;
  // Services specific
  bookingEnabled?: boolean;
  customerNoteEnabled?: boolean;
  // Investment specific
  minimumAmount?: number;
  expectedReturn?: string;
  tenure?: string;
  charges?: string;
  paymentFrequency?: "one-time" | "recurring";
  termsAndConditions?: string;
  riskExplanation?: string;
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
        { error: "Title, page type, and slug are required", received: { title, pageType, slug } },
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
          { error: "Price is required for digital products" },
          { status: 400 }
        );
      }
      if (!metadata?.downloadUrl && !metadata?.accessLink) {
        return NextResponse.json(
          { error: "Download URL or access link is required for digital products" },
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

    if (pageType === "real_estate" || pageType === "stock" || pageType === "savings" || pageType === "crypto") {
      if (!metadata?.minimumAmount || metadata.minimumAmount <= 0) {
        return NextResponse.json(
          { error: "Minimum investment amount is required" },
          { status: 400 }
        );
      }
      if (!metadata?.tenure) {
        return NextResponse.json(
          { error: "Tenure/maturity period is required for investments" },
          { status: 400 }
        );
      }
      if (!metadata?.termsAndConditions || metadata.termsAndConditions.length < 100) {
        return NextResponse.json(
          { error: "Terms and conditions must be at least 100 characters" },
          { status: 400 }
        );
      }
      if (!metadata?.riskExplanation) {
        return NextResponse.json(
          { error: "Risk explanation is required for investments" },
          { status: 400 }
        );
      }
    }

    // Prepare metadata with defaults based on page type
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

    // Calculate total amount from fee breakdown for school pages
    let finalPrice = price;
    if (pageType === "school" && finalMetadata.feeBreakdown.length > 0) {
      finalPrice = finalMetadata.feeBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    }

    // Create payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .insert({
        user_id: user.id,
        title,
        slug,
        description: description || "",
        cover_image: coverImage || null,
        logo: logo || null,
        product_images: productImages || [],
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
      console.error("Error creating page:", pageError);
      return NextResponse.json(
        { error: pageError.message, details: pageError },
        { status: 500 }
      );
    }

    console.log("Page created in DB:", page);

    // Format response based on page type with proper typing
    const formattedPage: FormattedPage = {
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
      pageBalance: page.page_balance,
      totalRevenue: page.total_revenue,
      totalPayments: page.total_payments,
      pageViews: page.page_views,
      createdAt: page.created_at,
      pageType: page.page_type,
      isPublished: page.is_published,
      metadata: page.metadata,
    };

    // Add page type specific fields to response
    switch (pageType) {
      case "school":
        formattedPage.feeBreakdown = page.metadata.feeBreakdown;
        formattedPage.className = page.metadata.className;
        formattedPage.requiredFields = page.metadata.requiredFields;
        break;
      case "donation":
        formattedPage.suggestedAmounts = page.metadata.suggestedAmounts;
        formattedPage.showDonorList = page.metadata.showDonorList;
        formattedPage.allowDonorMessage = page.metadata.allowDonorMessage;
        break;
      case "physical":
        formattedPage.variants = page.metadata.variants;
        formattedPage.requiresShipping = page.metadata.requiresShipping;
        break;
      case "digital":
        formattedPage.downloadUrl = page.metadata.downloadUrl;
        formattedPage.accessLink = page.metadata.accessLink;
        formattedPage.emailDelivery = page.metadata.emailDelivery;
        break;
      case "services":
        formattedPage.bookingEnabled = page.metadata.bookingEnabled;
        formattedPage.customerNoteEnabled = page.metadata.customerNoteEnabled;
        break;
      case "real_estate":
      case "stock":
      case "savings":
      case "crypto":
        formattedPage.minimumAmount = page.metadata.minimumAmount;
        formattedPage.expectedReturn = page.metadata.expectedReturn;
        formattedPage.tenure = page.metadata.tenure;
        formattedPage.charges = page.metadata.charges;
        formattedPage.paymentFrequency = page.metadata.paymentFrequency;
        formattedPage.termsAndConditions = page.metadata.termsAndConditions;
        formattedPage.riskExplanation = page.metadata.riskExplanation;
        break;
    }

    const responseData = {
      success: true,
      message: "Payment page created successfully!",
      slug: page.slug,
      page: formattedPage,
    };

    console.log("Sending response:", responseData);

    // Handle token refresh if needed
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