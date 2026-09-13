// lib/seo.ts
import { Metadata } from "next";

export const siteConfig = {
  name: "Zidwell",
  description:
    "All-in-one finance and business management platform for Nigerian SMEs. Professional accounting, invoicing, contracts, receipts, and financial tools.",
  url: "https://zidwell.com",
  ogImage: "https://zidwell.com/images/og-image.png",
  twitterImage: "https://zidwell.com/images/twitter-card.jpg",
  locale: "en_NG",
  type: "website" as const,
};

// ─── Schema.org Generators ───

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zidwell",
    alternateName: "Zidwell Finance Platform",
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+234-7069175399",
      contactType: "customer service",
      areaServed: "NG",
      availableLanguage: "en",
    },
    sameAs: [
      "https://twitter.com/zidwellapp",
      "https://linkedin.com/company/zidwell",
      "https://facebook.com/zidwellapp",
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zidwell",
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; item: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item.startsWith("http")
        ? item.item
        : `${siteConfig.url}${item.item}`,
    })),
  };
}

export function generateSignupPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sign Up for Zidwell",
    url: `${siteConfig.url}/auth/signup`,
    description:
      "Create your free Zidwell account to access business finance tools, invoicing, contracts, and accounting services.",
    mainEntity: {
      "@type": "CreateAccountAction",
      name: "Create Account",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/auth/signup`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/IOSPlatform",
          "http://schema.org/AndroidPlatform",
        ],
      },
    },
  };
}

export function generateSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zidwell",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/logo.png`,
    author: {
      "@type": "Organization",
      name: "Zidwell Technologies",
    },
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Zidwell",
    image: `${siteConfig.url}/logo.png`,
    url: siteConfig.url,
    telephone: "+234-7069175399",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "6.5244",
      longitude: "3.3792",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    priceRange: "$$",
    areaServed: "Nigeria",
  };
}

// ─── Metadata Generator (General) ───

interface PageMetaOptions {
  title: string;
  description?: string;
  keywords?: string[];
  pathname: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  canonical?: string;
}

export function generatePageMetadata(options: PageMetaOptions): Metadata {
  const {
    title,
    description = siteConfig.description,
    keywords = [],
    pathname,
    ogImage = siteConfig.ogImage,
    ogType = "website",
    noIndex = false,
    canonical,
  } = options;

  const url = `${siteConfig.url}${pathname}`;
  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : url;

  return {
    title: `${title} | Zidwell Business Tools`,
    description,
    keywords: [
      "Zidwell",
      "Nigeria",
      "SME",
      "business finance",
      "invoicing",
      "accounting",
      ...keywords,
    ],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Zidwell`,
      description,
      url,
      siteName: "Zidwell",
      locale: siteConfig.locale,
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - Zidwell Business Finance Platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@zidwellapp",
      creator: "@zidwellapp",
      title: `${title} | Zidwell`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE STORE SEO
// ─────────────────────────────────────────────────────────────────────────────

// ─── STOREFRONT METADATA ───
// Used by: app/store/[storeSlug]/page.tsx
export function generateStoreMetadata(store: {
  name: string;
  slug: string;
  description: string | null;
  cover_image?: string | null;
  logo?: string | null;
  city?: string | null;
  state?: string | null;
}): Metadata {
  const plainDescription =
    store.description?.replace(/<[^>]*>/g, "").trim().slice(0, 300) ||
    `Shop at ${store.name} on Zidwell. Browse products, pay securely, and enjoy fast checkout.`;

  const storeUrl = `${siteConfig.url}/store/${store.slug}`;
  const image =
    store.cover_image ||
    store.logo ||
    `${siteConfig.url}/images/og-image.png`;

  const locationLine =
    store.city && store.state
      ? `${store.city}, ${store.state}`
      : store.city || store.state || "Nigeria";

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${store.name} | Zidwell Store`,
    description: plainDescription,
    keywords: [
      store.name,
      "online store",
      "buy online",
      locationLine,
      "Nigeria",
      "Zidwell",
      "secure checkout",
    ],
    alternates: {
      canonical: storeUrl,
    },
    openGraph: {
      title: `${store.name} | Zidwell Store`,
      description: plainDescription,
      url: storeUrl,
      siteName: store.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${store.name} storefront`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${store.name} | Zidwell Store`,
      description: plainDescription,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── STOREFRONT SCHEMA ───
// Used by: app/store/[storeSlug]/page.tsx
export function generateStoreFrontSchema(store: {
  name: string;
  slug: string;
  description: string | null;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  total_views?: number | null;
  created_at?: string | null;
  products?: Array<{
    title: string;
    slug: string;
    price: number;
    price_type?: string;
    product_images?: string[] | null;
    cover_image?: string | null;
  }>;
}) {
  const storeUrl = `${siteConfig.url}/store/${store.slug}`;
  const imageUrl =
    store.cover_image ||
    (store.logo ? store.logo : `${siteConfig.url}/images/og-image.png`);

  const products = Array.isArray(store.products) ? store.products : [];

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": storeUrl,
    name: store.name,
    description:
      store.description?.replace(/<[^>]*>/g, "").trim() ||
      `Shop at ${store.name} on Zidwell.`,
    url: storeUrl,
    image: imageUrl,
    logo: store.logo || `${siteConfig.url}/logo.png`,
    ...(store.city || store.state
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: store.city || undefined,
            addressRegion: store.state || undefined,
            addressCountry: "NG",
          },
        }
      : {}),
    ...(products.length > 0
      ? {
          department: products.slice(0, 20).map((p) => ({
            "@type": "Product",
            name: p.title,
            url: `${storeUrl}/${p.slug}`,
            image:
              (Array.isArray(p.product_images) && p.product_images[0]) ||
              p.cover_image ||
              undefined,
            offers: {
              "@type": "Offer",
              price: Number(p.price) || 0,
              priceCurrency: "NGN",
              availability: "https://schema.org/InStock",
              url: `${storeUrl}/${p.slug}`,
            },
          })),
        }
      : {}),
  };
}

// ─── PRODUCT METADATA ───
// Used by: app/store/[storeSlug]/[productSlug]/page.tsx
export function generateProductMetadata(product: {
  title: string;
  slug: string;
  description: string | null;
  price: number;
  productImages?: string[] | null;
  coverImage?: string | null;
  storeName: string;
  storeSlug: string;
}): Metadata {
  const plainDescription =
    product.description?.replace(/<[^>]*>/g, "").trim().slice(0, 300) ||
    `Buy ${product.title} on ${product.storeName}. Secure checkout with card or bank transfer on Zidwell.`;

  const productUrl = `${siteConfig.url}/store/${product.storeSlug}/${product.slug}`;

  const images =
    Array.isArray(product.productImages) && product.productImages.length > 0
      ? product.productImages
      : product.coverImage
      ? [product.coverImage]
      : [`${siteConfig.url}/images/og-image.png`];

  const priceFormatted = `₦${(Number(product.price) || 0).toLocaleString()}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${product.title} — ${priceFormatted} | ${product.storeName}`,
    description: plainDescription,
    keywords: [
      product.title,
      product.storeName,
      "buy online",
      "secure checkout",
      "Zidwell",
      "Nigeria",
      priceFormatted,
    ],
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.title} — ${priceFormatted}`,
      description: plainDescription,
      url: productUrl,
      siteName: product.storeName,
      locale: siteConfig.locale,
      type: "website",
      images: images.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: product.title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — ${priceFormatted}`,
      description: plainDescription,
      images: [images[0]],
    },
    other: {
      "product:price:amount": String(Number(product.price) || 0),
      "product:price:currency": "NGN",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── PRODUCT SCHEMA ───
// Used by: app/store/[storeSlug]/[productSlug]/page.tsx
// Handles all page types: physical, digital, services, school, donation,
// link, real_estate, stock, savings, crypto
export function generateProductSchema(product: {
  title: string;
  slug: string;
  description: string | null;
  price: number;
  priceType?: string;
  productImages?: string[] | null;
  coverImage?: string | null;
  storeName: string;
  storeSlug: string;
  inStock?: boolean;
  pageType?: string;
}) {
  const productUrl = `${siteConfig.url}/store/${product.storeSlug}/${product.slug}`;
  const images =
    Array.isArray(product.productImages) && product.productImages.length > 0
      ? product.productImages
      : product.coverImage
      ? [product.coverImage]
      : [`${siteConfig.url}/images/og-image.png`];

  const availability =
    product.inStock === false
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  // Map internal page types → schema.org types
  const typeMap: Record<string, string> = {
    physical: "Product",
    digital: "DigitalDocument",
    services: "Service",
    school: "Service",
    donation: "DonateAction",
    link: "WebPage",
    real_estate: "Product",
    stock: "FinancialProduct",
    savings: "FinancialProduct",
    crypto: "FinancialProduct",
  };

  const schemaType = typeMap[product.pageType || "physical"] || "Product";

  // Base schema — works for all types
  const baseSchema: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": productUrl,
    name: product.title,
    description:
      product.description?.replace(/<[^>]*>/g, "").trim() ||
      `${product.title} on ${product.storeName}.`,
    url: productUrl,
    image: images,
    brand: {
      "@type": "Brand",
      name: product.storeName,
    },
  };

  // Add offers for anything that has a purchasable price
  if (
    schemaType === "Product" ||
    schemaType === "DigitalDocument"
  ) {
    baseSchema.offers = {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "NGN",
      price: Number(product.price) || 0,
      availability,
      seller: {
        "@type": "Organization",
        name: product.storeName,
        url: `${siteConfig.url}/store/${product.storeSlug}`,
      },
    };
  }

  // For services, add provider instead of seller
  if (schemaType === "Service") {
    baseSchema.provider = {
      "@type": "Organization",
      name: product.storeName,
      url: `${siteConfig.url}/store/${product.storeSlug}`,
    };
  }

  return baseSchema;
}