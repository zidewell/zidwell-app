// app/store/[storeSlug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SEO:
//   • generateStoreMetadata()   → title, OG image, description, keywords
//   • generateStoreFrontSchema() → JSON-LD Store schema with departments
//   • generateBreadcrumbSchema() → Home > Store breadcrumbs
//   • ISR (revalidate = 60)
//   • Slug sanitization + HTML sanitization
//   • Single RPC for view increments (no N+1)
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Package, MapPin, Store as StoreIcon, Eye } from "lucide-react";
import {
  generateStoreMetadata,
  generateStoreFrontSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";

export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StorePageProps {
  params: Promise<{ storeSlug: string }>;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,100}$/i.test(slug);
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

// ─── SEO: Dynamic metadata ───
export async function generateMetadata({ params }: StorePageProps) {
  const { storeSlug } = await params;
  if (!isValidSlug(storeSlug)) {
    return { title: "Store Not Found" };
  }

  const { data: store } = await supabase
    .from("online_stores")
    .select("name, description, slug, logo_url, cover_url, city, state")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .eq("activation_paid", true)
    .maybeSingle();

  if (!store) {
    return {
      title: "Store Not Found",
      description: "This store does not exist or is not active.",
      robots: { index: false, follow: false },
    };
  }

  return generateStoreMetadata({
    name: store.name,
    slug: store.slug,
    description: store.description,
    cover_image: store.cover_url,
    logo: store.logo_url,
    city: store.city,
    state: store.state,
  });
}

export default async function PublicStorePage({ params }: StorePageProps) {
  const { storeSlug } = await params;

  if (!isValidSlug(storeSlug)) notFound();

  const { data: store, error: storeError } = await supabase
    .from("online_stores")
    .select("*")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .eq("activation_paid", true)
    .maybeSingle();

  if (storeError || !store) {
    console.error("Store not found:", storeError);
    notFound();
  }

  const { data: pages, error: pagesError } = await supabase
    .from("payment_pages")
    .select("*")
    .eq("is_published", true)
    .or(`user_id.eq.${store.owner_id},metadata->>storeSlug.eq.${storeSlug}`)
    .order("created_at", { ascending: false });

  if (pagesError) {
    console.error("Error fetching pages:", pagesError);
  }

  const validPages = pages || [];

  // Single RPC instead of N+1 UPDATEs — fire-and-forget
  void supabase
    .rpc("increment_store_and_product_views", {
      p_store_id: store.id,
      p_page_ids: validPages.map((p) => p.id),
    })
    .then(({ error }) => {
      if (error) console.error("View increment failed:", error);
    });

  const safeDescription = sanitizeHtml(store.description || "");

  // ─── SEO: JSON-LD schemas ───
  const storeSchema = generateStoreFrontSchema({
    name: store.name,
    slug: store.slug,
    description: store.description,
    city: store.city,
    state: store.state,
    logo: store.logo_url,
    cover_image: store.cover_url,
    total_views: store.total_views,
    created_at: store.created_at,
    products: validPages.map((p) => ({
      title: p.title,
      slug: p.slug,
      price: Number(p.price) || 0,
      price_type: p.price_type,
      product_images: p.product_images,
      cover_image: p.cover_image,
    })),
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: store.name, item: `/store/${store.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* ─── SEO: JSON-LD structured data ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ─── Store Header ─── */}
      <div className="bg-[#023528] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <StoreIcon className="h-8 w-8 text-[#e1bf46]" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{store.name}</h1>

              {safeDescription && (
                <div className="mt-4 text-base leading-7 text-white/70 prose prose-invert prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: safeDescription
                        .replace(/<p>/g, '<p class="mb-2">')
                        .replace(
                          /<ol>/g,
                          '<ol class="list-decimal pl-5 space-y-1 my-2">'
                        )
                        .replace(
                          /<ul>/g,
                          '<ul class="list-disc pl-5 space-y-1 my-2">'
                        )
                        .replace(/<li>/g, '<li class="mb-1">'),
                    }}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {validPages.length} product
                  {validPages.length !== 1 ? "s" : ""}
                </span>
                {store.city && store.state && (
                  <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {store.city}, {store.state}
                  </span>
                )}
                <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {(store.total_views || 0).toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Products Grid ─── */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {validPages.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Products</h2>
              <span className="text-sm text-gray-400">
                {validPages.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {validPages.map((page) => {
                const productStoreSlug = page.metadata?.storeSlug || storeSlug;
                const safeProductDesc = sanitizeHtml(page.description || "");
                return (
                  <Link
                    key={page.id}
                    href={`/store/${productStoreSlug}/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-[#e1bf46] transition-all duration-300 hover:shadow-lg hover:shadow-[#e1bf46]/5"
                  >
                    <div className="aspect-[5/4] overflow-hidden bg-[#2a2a2a] relative">
                      {page.product_images && page.product_images.length > 0 ? (
                        <img
                          src={page.product_images[0]}
                          alt={page.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : page.cover_image ? (
                        <img
                          src={page.cover_image}
                          alt={page.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="text-xs bg-black/70 text-[#e1bf46] px-2 py-1 rounded-full">
                          {page.page_type || "Product"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-[#e1bf46] transition-colors line-clamp-1">
                        {page.title}
                      </h3>

                      {safeProductDesc && (
                        <div
                          className="text-sm text-gray-400 mt-1 line-clamp-3 prose prose-invert prose-sm max-w-none prose-p:text-gray-400 prose-p:my-0.5 prose-ul:text-gray-400 prose-ul:list-disc prose-ul:pl-4 prose-ul:my-0.5 prose-ol:text-gray-400 prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-0.5 prose-li:text-gray-400 prose-li:my-0 prose-strong:text-gray-300 prose-em:text-gray-400 prose-headings:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: safeProductDesc }}
                        />
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-lg font-bold text-[#e1bf46]">
                          ₦{Number(page.price || 0).toLocaleString()}
                        </p>
                        {page.price_type === "installment" &&
                          page.installment_count && (
                            <span className="text-xs text-gray-400">
                              {page.installment_count}x payments
                            </span>
                          )}
                      </div>
                      <button className="w-full mt-3 bg-[#e1bf46] text-[#023528] font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity text-sm">
                        View Product
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Package className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white">
              No products yet
            </h3>
            <p className="text-gray-400 mt-2">
              This store hasn't added any products yet.
            </p>
            <p className="text-gray-500 text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="text-[#e1bf46]">Zidwell</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Secure payments • Fast checkout • Trusted by merchants
          </p>
        </div>
      </div>
    </div>
  );
}