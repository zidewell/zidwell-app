// app/store/[storeSlug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SEO:
//   • generateStoreMetadata()   → title, OG image, description, keywords
//   • generateStoreFrontSchema() → JSON-LD Store schema with departments
//   • generateBreadcrumbSchema() → Home > Store breadcrumbs
//   • ISR (revalidate = 60)
//   • Slug sanitization + HTML sanitization
//   • Single RPC for view increments (no N+1)
//
// UI/UX:
//   • Fully compatible with light & dark modes via design tokens
//   • Mobile-first grid (2 cols on mobile → 4 on XL)
//   • Squircle radii matching the Zidwell design system
//   • Card-based product layout with hover lift + accent border
//   • Location section with embedded map + address card
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Package,
  MapPin,
  Store as StoreIcon,
  Eye,
  Navigation,
} from "lucide-react";
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

/** Safe numeric parse for lat/lng coming back as numeric/string from Postgres. */
function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
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

  // ─── Location bits ───
  const lat = toNumberOrNull(store.latitude);
  const lng = toNumberOrNull(store.longitude);
  const hasCoordinates = lat !== null && lng !== null;

  const hasAddress = Boolean(
    store.street_address || store.city || store.state || store.country
  );

  const addressLine = [
    store.street_address,
    store.city,
    store.state,
    store.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Google Maps embed URLs — no API key required for the `output=embed` form.
  const mapQuery = hasCoordinates
    ? `${lat},${lng}`
    : encodeURIComponent(
        [store.street_address, store.city, store.state, store.country]
          .filter(Boolean)
          .join(", ")
      );

  const mapEmbedSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapDirectionsHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

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
    <div className="min-h-screen bg-(--bg-primary)">
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
      <header className="border-b border-(--border-color) bg-(--bg-secondary)">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:py-14">
          {store.cover_url && (
            <div className="squircle-lg mb-6 overflow-hidden border border-(--border-color)">
              <img
                src={store.cover_url}
                alt={`${store.name} cover`}
                className="h-40 w-full object-cover sm:h-52 md:h-64"
                loading="eager"
              />
            </div>
          )}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="squircle-md flex h-16 w-16 shrink-0 items-center justify-center border border-(--border-color) bg-(--bg-primary) shadow-(--shadow-soft) sm:h-20 sm:w-20">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="squircle-md h-full w-full object-cover"
                />
              ) : (
                <StoreIcon className="h-8 w-8 text-(--color-accent-yellow) sm:h-10 sm:w-10" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="eyebrow text-(--text-secondary)">Online Store</p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-(--text-primary) sm:text-3xl md:text-4xl">
                {store.name}
              </h1>

              {safeDescription && (
                <div className="prose prose-sm dark:prose-invert mt-4 max-w-2xl text-sm leading-6 text-(--text-secondary) prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-(--text-primary)">
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

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="badge border border-(--border-color) bg-(--bg-primary) text-xs font-medium text-(--text-secondary)">
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  {validPages.length} product
                  {validPages.length !== 1 ? "s" : ""}
                </span>

                {store.city && store.state && (
                  <span className="badge border border-(--border-color) bg-(--bg-primary) text-xs font-medium text-(--text-secondary)">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    {store.city}, {store.state}
                  </span>
                )}

                <span className="badge border border-(--border-color) bg-(--bg-primary) text-xs font-medium text-(--text-secondary)">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {(store.total_views || 0).toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Products Section ─── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {validPages.length > 0 ? (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-(--text-primary) sm:text-xl">
                Products
              </h2>
              <span className="text-sm text-(--text-secondary)">
                {validPages.length} item{validPages.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {validPages.map((page) => {
                const productStoreSlug = page.metadata?.storeSlug || storeSlug;
                const safeProductDesc = sanitizeHtml(page.description || "");
                return (
                  <Link
                    key={page.id}
                    href={`/store/${productStoreSlug}/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="squircle-lg group flex flex-col overflow-hidden border border-(--border-color) bg-(--bg-secondary) transition-all duration-300 hover:-translate-y-0.5 hover:border-(--color-accent-yellow)/40 hover:shadow-(--shadow-pop)"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-(--bg-primary)">
                      {page.product_images && page.product_images.length > 0 ? (
                        <img
                          src={page.product_images[0]}
                          alt={page.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : page.cover_image ? (
                        <img
                          src={page.cover_image}
                          alt={page.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-(--text-secondary)/40 sm:h-12 sm:w-12" />
                        </div>
                      )}

                      <div className="absolute left-2.5 top-2.5">
                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          {page.page_type || "Product"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="line-clamp-1 text-sm font-semibold text-(--text-primary) transition-colors group-hover:text-(--color-accent-yellow)">
                        {page.title}
                      </h3>

                      {safeProductDesc && (
                        <div
                          className="prose prose-sm dark:prose-invert mt-1 line-clamp-2 max-w-none text-xs leading-5 text-(--text-secondary) prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0"
                          dangerouslySetInnerHTML={{
                            __html: safeProductDesc.replace(
                              /<p>/g,
                              '<p class="mb-1">'
                            ),
                          }}
                        />
                      )}

                      <div className="mt-auto flex items-baseline justify-between pt-3">
                        <p className="text-sm font-bold text-(--color-accent-yellow) sm:text-base">
                          ₦{Number(page.price || 0).toLocaleString()}
                        </p>
                        {page.price_type === "installment" &&
                          page.installment_count && (
                            <span className="text-[10px] font-medium text-(--text-secondary)">
                              {page.installment_count}×
                            </span>
                          )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="squircle-md flex h-16 w-16 items-center justify-center border border-(--border-color) bg-(--bg-secondary)">
              <Package className="h-8 w-8 text-(--text-secondary)/50" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-(--text-primary)">
              No products yet
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-(--text-secondary)">
              This store hasn&apos;t added any products yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* ─── Location / Map Section ─── */}
      {(hasCoordinates || hasAddress) && (
        <section className="border-t border-(--border-color) bg-(--bg-secondary)">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="text-lg font-semibold text-(--text-primary) sm:text-xl">
                  Visit this store
                </h2>
                <p className="mt-1 text-sm text-(--text-secondary)">
                  Find us on the map or get directions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
              {/* Address card */}
              <div className="squircle-lg flex flex-col border border-(--border-color) bg-(--bg-primary) p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="squircle-md flex h-10 w-10 shrink-0 items-center justify-center bg-(--bg-secondary)">
                    <MapPin className="h-5 w-5 text-(--color-accent-yellow)" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow text-(--text-secondary)">Address</p>
                    <p className="mt-1 text-sm font-semibold text-(--text-primary)">
                      {addressLine || "Location details not provided"}
                    </p>
                  </div>
                </div>

                {store.location_enabled && hasCoordinates && (
                  <p className="mt-4 text-xs text-(--text-secondary)">
                    <span className="font-medium text-(--text-primary)">
                      Precise location enabled
                    </span>{" "}
                    · {lat!.toFixed(4)}, {lng!.toFixed(4)}
                  </p>
                )}

                <a
                  href={mapDirectionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="squircle-md mt-6 inline-flex items-center justify-center gap-2 bg-(--color-accent-yellow) px-4 py-3 text-sm font-semibold text-(--color-ink) transition-opacity hover:opacity-90"
                >
                  <Navigation className="h-4 w-4" />
                  Get directions
                </a>
              </div>

              {/* Map embed */}
              <div className="squircle-lg overflow-hidden border border-(--border-color) bg-(--bg-primary) lg:col-span-2">
                {hasCoordinates || hasAddress ? (
                  <iframe
                    title={`Map of ${store.name}`}
                    src={mapEmbedSrc}
                    className="h-72 w-full sm:h-80 lg:h-full lg:min-h-[320px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center sm:h-80">
                    <p className="text-sm text-(--text-secondary)">
                      No location provided.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="border-t border-(--border-color) bg-(--bg-primary)">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center">
          <p className="text-sm text-(--text-secondary)">
            Powered by{" "}
            <span className="font-semibold text-(--color-accent-yellow)">
              Zidwell
            </span>
          </p>
          <p className="mt-1.5 text-xs text-(--text-secondary)/70">
            Secure payments · Fast checkout · Trusted by merchants
          </p>
        </div>
      </footer>
    </div>
  );
}