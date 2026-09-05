import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import StoreProductClient from "./client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StoreProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StoreProductPageProps) {
  const { storeSlug, productSlug } = await params;

  const { data: product } = await supabase
    .from("payment_pages")
    .select("title, description, product_images")
    .eq("slug", productSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product does not exist or is not available.",
    };
  }

  let images: string[] = [];
  if (product.product_images) {
    if (typeof product.product_images === 'string') {
      try {
        images = JSON.parse(product.product_images);
      } catch (e) {
        images = [];
      }
    } else if (Array.isArray(product.product_images)) {
      images = product.product_images;
    }
  }

  const imageUrl = images.length > 0 ? images[0] : null;

  return {
    title: `${product.title} | Store`,
    description: product.description?.replace(/<[^>]*>/g, '') || `Buy ${product.title} on Zidwell.`,
    openGraph: {
      title: `${product.title} | Store`,
      description: product.description?.replace(/<[^>]*>/g, '') || `Buy ${product.title} on Zidwell.`,
      url: `https://zidwell.com/store/${storeSlug}/${productSlug}`,
      siteName: "Zidwell",
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}

export default async function StoreProductPage({ params }: StoreProductPageProps) {
  const { storeSlug, productSlug } = await params;

  console.log("🔍 Looking for store:", storeSlug);
  console.log("🔍 Looking for product:", productSlug);

  // ✅ Step 1: Fetch store by slug
  const { data: store, error: storeError } = await supabase
    .from("online_stores")
    .select("*")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .eq("activation_paid", true)
    .maybeSingle();

  if (storeError || !store) {
    console.error("❌ Store not found:", storeSlug);
    notFound();
  }

  // ✅ Ensure store is an object
  const storeData = Array.isArray(store) ? store[0] : store;
  
  if (!storeData) {
    console.error("❌ Store data is invalid:", store);
    notFound();
  }

  console.log("✅ Store found:", storeData.name);
  console.log("📦 Store owner_id:", storeData.owner_id);
  console.log("📦 Store current total_views:", storeData.total_views || 0);

  // ✅ Step 2: Fetch product by slug
  const { data: page, error: pageError } = await supabase
    .from("payment_pages")
    .select("*")
    .eq("slug", productSlug)
    .eq("is_published", true)
    .or(`user_id.eq.${storeData.owner_id},metadata->>storeSlug.eq.${storeSlug}`)
    .maybeSingle();

  if (pageError || !page) {
    console.error("❌ Product not found:", {
      storeSlug,
      productSlug,
      storeOwnerId: storeData.owner_id,
    });
    notFound();
  }

  console.log("✅ Product found:", page.title);
  console.log("📦 Product user_id:", page.user_id);
  console.log("📦 Product current page_views:", page.page_views || 0);

  // ✅ Step 3: Increment page views - using await to ensure it completes
  // We'll increment the views and also get the updated value
  let updatedPageViews = (page.page_views || 0) + 1;
  let updatedStoreViews = (storeData.total_views || 0) + 1;

  try {
    // Increment page_views in payment_pages
    const { data: updatedPage, error: pageUpdateError } = await supabase
      .from("payment_pages")
      .update({ 
        page_views: updatedPageViews
      })
      .eq("id", page.id)
      .select("page_views")
      .single();

    if (pageUpdateError) {
      console.error("❌ Error updating product page_views:", pageUpdateError);
    } else {
      console.log("✅ Product page_views updated to:", updatedPage?.page_views);
      updatedPageViews = updatedPage?.page_views || updatedPageViews;
    }

    // Increment total_views in online_stores
    const { data: updatedStore, error: storeUpdateError } = await supabase
      .from("online_stores")
      .update({ 
        total_views: updatedStoreViews
      })
      .eq("id", storeData.id)
      .select("total_views")
      .single();

    if (storeUpdateError) {
      console.error("❌ Error updating store total_views:", storeUpdateError);
    } else {
      console.log("✅ Store total_views updated to:", updatedStore?.total_views);
      updatedStoreViews = updatedStore?.total_views || updatedStoreViews;
    }
  } catch (error) {
    console.error("❌ Error incrementing views:", error);
  }

  // ✅ Parse product_images
  let productImages: string[] = [];
  let coverImage: string | null = page.cover_image || null;

  if (page.product_images) {
    if (typeof page.product_images === 'string') {
      try {
        const parsed = JSON.parse(page.product_images);
        productImages = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("❌ Error parsing product_images:", e);
        productImages = [];
      }
    } else if (Array.isArray(page.product_images)) {
      productImages = page.product_images;
    }
  }

  if (productImages.length === 0 && coverImage) {
    productImages = [coverImage];
  }

  // ✅ Parse metadata if it's a string
  let parsedMetadata = page.metadata;
  if (typeof page.metadata === 'string') {
    try {
      parsedMetadata = JSON.parse(page.metadata);
    } catch (e) {
      console.error("Error parsing metadata:", e);
      parsedMetadata = {};
    }
  }

  // ✅ Create a clean page object with the updated view count
  const cleanPage = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    description: page.description,
    coverImage: coverImage,
    logo: page.logo || null,
    productImages: productImages,
    priceType: page.price_type || "fixed",
    price: Number(page.price) || 0,
    installmentCount: page.installment_count || undefined,
    feeMode: page.fee_mode || "bearer",
    pageType: page.page_type || "physical",
    metadata: parsedMetadata,
    pageBalance: page.page_balance || 0,
    totalRevenue: page.total_revenue || 0,
    totalPayments: page.total_payments || 0,
    pageViews: updatedPageViews, // ✅ Use the updated value
    isActive: page.is_active || false,
    isPublished: page.is_published || false,
    publishedAt: page.published_at || null,
    createdAt: page.created_at || null,
    updatedAt: page.updated_at || null,
  };

  console.log("📦 Product images:", productImages);
  console.log("📦 Metadata parsed:", parsedMetadata);
  console.log("📦 Students in metadata:", parsedMetadata?.students);
  console.log("📦 Page type mapped:", cleanPage.pageType);
  console.log("📦 Final page views:", cleanPage.pageViews);

  // ✅ Pass store data and clean page data to client
  return <StoreProductClient page={cleanPage} store={storeData} />;
}