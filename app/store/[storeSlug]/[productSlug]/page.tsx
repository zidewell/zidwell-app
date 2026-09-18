// app/store/[storeSlug]/[productSlug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SEO:
//   • generateProductMetadata()  → title with price, OG image, product:price tags
//   • generateProductSchema()    → JSON-LD Product / Service / DigitalDocument / FinancialProduct
//   • generateBreadcrumbSchema() → Home > Store > Product breadcrumbs
//   • ISR (revalidate = 60)
//   • Slug sanitization
//   • Public paid-students map for school pages
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import StoreProductClient from "./client";
import {

  generateProductMetadata,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";


export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StoreProductPageProps {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,100}$/i.test(slug);
}

// ─── SEO: Dynamic metadata ───
export async function generateMetadata({ params }: StoreProductPageProps) {
  const { storeSlug, productSlug } = await params;
  if (!isValidSlug(storeSlug) || !isValidSlug(productSlug)) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const [storeRes, productRes] = await Promise.all([
    supabase
      .from("online_stores")
      .select("name, slug, is_active, activation_paid")
      .eq("slug", storeSlug)
      .maybeSingle(),
    supabase
      .from("payment_pages")
      .select(
        "title, description, product_images, cover_image, price, price_type, slug, page_type"
      )
      .eq("slug", productSlug)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  const store = storeRes.data;
  const product = productRes.data;

  if (
    !store ||
    !product ||
    store.is_active !== true ||
    store.activation_paid !== true
  ) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  let images: string[] = [];
  if (product.product_images) {
    if (typeof product.product_images === "string") {
      try {
        images = JSON.parse(product.product_images);
      } catch {
        images = [];
      }
    } else if (Array.isArray(product.product_images)) {
      images = product.product_images;
    }
  }

  return generateProductMetadata({
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: Number(product.price) || 0,
    productImages: images,
    coverImage: product.cover_image,
    storeName: store.name,
    storeSlug: store.slug,
  });
}

export default async function StoreProductPage({
  params,
}: StoreProductPageProps) {
  const { storeSlug, productSlug } = await params;

  if (!isValidSlug(storeSlug) || !isValidSlug(productSlug)) {
    notFound();
  }

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

  const storeData = Array.isArray(store) ? store[0] : store;

  if (!storeData) {
    console.error("❌ Store data is invalid:", store);
    notFound();
  }

  const { data: page, error: pageError } = await supabase
    .from("payment_pages")
    .select("*")
    .eq("slug", productSlug)
    .eq("is_published", true)
    .or(
      `user_id.eq.${storeData.owner_id},metadata->>storeSlug.eq.${storeSlug}`
    )
    .maybeSingle();

  if (pageError || !page) {
    console.error("❌ Product not found:", {
      storeSlug,
      productSlug,
      storeOwnerId: storeData.owner_id,
    });
    notFound();
  }

  let productImages: string[] = [];
  let coverImage: string | null = page.cover_image || null;

  if (page.product_images) {
    if (typeof page.product_images === "string") {
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

  let parsedMetadata = page.metadata;
  if (typeof page.metadata === "string") {
    try {
      parsedMetadata = JSON.parse(page.metadata);
    } catch (e) {
      console.error("Error parsing metadata:", e);
      parsedMetadata = {};
    }
  }

  // ─── Public paid-students map for school pages ───
  let initialPaidStudents: Record<string, number> = {};

  if (page.page_type === "school") {
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_page_payments")
      .select("amount, student_name, selected_students, status")
      .eq("payment_page_id", page.id)
      .eq("status", "completed");

    if (paymentsError) {
      console.error("❌ Failed to load school payments:", paymentsError);
    }

    for (const p of payments || []) {
      const amount = Number(p.amount) || 0;
      const names: string[] = [];

      const rawSelected: any = p.selected_students;

      if (Array.isArray(rawSelected) && rawSelected.length > 0) {
        for (const n of rawSelected) {
          if (typeof n === "string" && n.trim().length > 0) {
            names.push(n.trim());
          }
        }
      } else if (typeof rawSelected === "string" && rawSelected.length > 0) {
        try {
          const parsed = JSON.parse(rawSelected);
          if (Array.isArray(parsed)) {
            for (const n of parsed) {
              if (typeof n === "string" && n.trim().length > 0) {
                names.push(n.trim());
              }
            }
          } else if (typeof parsed === "string" && parsed.trim().length > 0) {
            names.push(parsed.trim());
          }
        } catch {
          if (rawSelected.trim().length > 0) {
            names.push(rawSelected.trim());
          }
        }
      }

      if (
        names.length === 0 &&
        typeof p.student_name === "string" &&
        p.student_name.trim().length > 0
      ) {
        names.push(p.student_name.trim());
      }

      if (names.length === 0) continue;

      const perStudent = amount / names.length;
      for (const name of names) {
        initialPaidStudents[name] =
          (initialPaidStudents[name] || 0) + perStudent;
      }
    }

    for (const key of Object.keys(initialPaidStudents)) {
      initialPaidStudents[key] =
        Math.round(initialPaidStudents[key] * 100) / 100;
    }
  }

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
    pageViews: page.page_views || 0,
    isActive: page.is_active || false,
    isPublished: page.is_published || false,
    publishedAt: page.published_at || null,
    createdAt: page.created_at || null,
    updatedAt: page.updated_at || null,
  };

  // ─── Fetch more products from the same store (excluding current) ───
  const { data: moreProducts } = await supabase
    .from("payment_pages")
    .select(
      "id, title, slug, description, price, price_type, product_images, cover_image, page_type, metadata"
    )
    .eq("is_published", true)
    .neq("id", page.id)
    .or(
      `user_id.eq.${storeData.owner_id},metadata->>storeSlug.eq.${storeSlug}`
    )
    .order("created_at", { ascending: false })
    .limit(8);

  // ─── SEO: Determine stock status ───
  const stockValue = parsedMetadata?.stock;
  const inStock = stockValue == null ? true : Number(stockValue) > 0;

  // ─── SEO: JSON-LD schemas ───
  const productSchema = generateProductSchema({
    title: page.title,
    slug: page.slug,
    description: page.description,
    price: Number(page.price) || 0,
    priceType: page.price_type,
    productImages: productImages,
    coverImage: coverImage,
    storeName: storeData.name,
    storeSlug: storeData.slug,
    inStock,
    pageType: page.page_type,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: storeData.name, item: `/store/${storeData.slug}` },
    { name: page.title, item: `/store/${storeData.slug}/${page.slug}` },
  ]);

  return (
    <>
      {/* ─── SEO: JSON-LD structured data ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FDC020]" />
          </div>
        }
      >
        <StoreProductClient
          page={cleanPage}
          store={storeData}
          initialPaidStudents={initialPaidStudents}
          moreProducts={moreProducts || []}
        />
      </Suspense>


    </>
  );
}