import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Package, MapPin, ShoppingBag, Store as StoreIcon, Eye } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StorePageProps {
  params: Promise<{ storeSlug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: StorePageProps) {
  const { storeSlug } = await params;
  
  const { data: store } = await supabase
    .from("online_stores")
    .select("name, description, slug")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .eq("activation_paid", true)
    .maybeSingle();

  if (!store) {
    return {
      title: "Store Not Found",
      description: "This store does not exist or is not active.",
    };
  }

  return {
    title: `${store.name} | Zidwell Store`,
    description: store.description || `Shop at ${store.name} on Zidwell.`,
    openGraph: {
      title: `${store.name} | Zidwell Store`,
      description: store.description || `Shop at ${store.name} on Zidwell.`,
      url: `https://zidwell.com/store/${store.slug}`,
      siteName: "Zidwell",
      type: "website",
    },
  };
}

export default async function PublicStorePage({ params }: StorePageProps) {
  const { storeSlug } = await params;

  // Fetch store by slug
  const { data: store, error: storeError } = await supabase
    .from("online_stores")
    .select("*")
    .eq("slug", storeSlug)
    .eq("is_active", true)
    .eq("activation_paid", true)
    .maybeSingle();

  console.log("store", store);

  if (storeError || !store) {
    console.error("Store not found:", storeError);
    notFound();
  }

  // ✅ Fetch payment pages for this store using metadata.storeSlug
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

  // ✅ Step 3: Increment store views (fire and forget)
  const incrementStoreViews = async () => {
    try {
      await supabase
        .from("online_stores")
        .update({ 
          total_views: (store.total_views || 0) + 1 
        })
        .eq("id", store.id);
      
      console.log("✅ Store view count incremented successfully");
    } catch (error) {
      console.error("❌ Error incrementing store view count:", error);
    }
  };

  // Execute increment in background
  incrementStoreViews();

  // ✅ Also increment views for each product page displayed
  const incrementProductViews = async () => {
    try {
      for (const page of validPages) {
        await supabase
          .from("payment_pages")
          .update({ 
            page_views: (page.page_views || 0) + 1 
          })
          .eq("id", page.id);
      }
      console.log(`✅ Product view counts incremented for ${validPages.length} products`);
    } catch (error) {
      console.error("❌ Error incrementing product view counts:", error);
    }
  };

  // Execute product view increment in background
  incrementProductViews();

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-[#023528] to-[#034835] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <StoreIcon className="h-8 w-8 text-[#e1bf46]" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{store.name}</h1>
              {store.description && (
                <p className="text-white/70 mt-2 max-w-2xl">{store.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {validPages.length} product{validPages.length !== 1 ? 's' : ''}
                </span>
                {store.city && store.state && (
                  <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {store.city}, {store.state}
                  </span>
                )}
                <span className="text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {(store.total_views || 0) + 1} views
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {validPages.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Products</h2>
              <span className="text-sm text-gray-400">{validPages.length} items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {validPages.map((page) => {
                // ✅ Use metadata.storeSlug for the product URL
                const productStoreSlug = page.metadata?.storeSlug || storeSlug;
                return (
                  <Link
                    key={page.id}
                    href={`/store/${productStoreSlug}/${page.slug}`}
                    className="group bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden hover:border-[#e1bf46] transition-all duration-300 hover:shadow-lg hover:shadow-[#e1bf46]/5"
                  >
                    {/* Product Image */}
                    <div className="aspect-[5/4] overflow-hidden bg-[#2a2a2a] relative">
                      {page.product_images && page.product_images.length > 0 ? (
                        <img
                          src={page.product_images[0]}
                          alt={page.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : page.cover_image ? (
                        <img
                          src={page.cover_image}
                          alt={page.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-600" />
                        </div>
                      )}
                      {/* Page Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="text-xs bg-black/70 text-[#e1bf46] px-2 py-1 rounded-full">
                          {page.page_type || "Product"}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-[#e1bf46] transition-colors line-clamp-1">
                        {page.title}
                      </h3>
                      {page.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {page.description.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-lg font-bold text-[#e1bf46]">
                          ₦{page.price.toLocaleString()}
                        </p>
                        {page.price_type === "installment" && page.installment_count && (
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
            <h3 className="text-xl font-semibold text-white">No products yet</h3>
            <p className="text-gray-400 mt-2">This store hasn't added any products yet.</p>
            <p className="text-gray-500 text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>

      {/* Footer */}
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